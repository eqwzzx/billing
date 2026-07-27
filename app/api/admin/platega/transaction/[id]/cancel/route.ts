import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth, verifyAdminAuth } from "@/lib/auth-admin"
import { cancelTransaction } from "@/lib/platega"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const session = await verifyAdminAuth(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: transactionId } = await params // ✅ await params

    // Отменяем транзакцию через Platega API
    const result = await cancelTransaction(transactionId)

    // Обновляем статус в нашей базе данных
    await prisma.transaction.updateMany({
      where: {
        externalId: transactionId,
      },
      data: {
        status: "FAILED",
        description: `Отменено администратором. ${result.message}`,
      },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        action: "ADMIN_LOGIN", // TODO: Добавить TRANSACTION_CANCEL в enum
        description: `Отмена Platega транзакции ${transactionId}`,
        adminId: session.userId,
        metadata: JSON.stringify({
          transactionId,
          result,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      accepted: result.accepted,
      manualControlRequired: result.manualControlRequired,
    })
  } catch (error) {
    console.error("[Admin] Error canceling transaction:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel transaction" },
      { status: 500 }
    )
  }
}
