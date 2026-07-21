import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth-admin"

export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    // Получаем все Platega транзакции из базы данных
    const transactions = await prisma.transaction.findMany({
      where: {
        method: "PLATEGA",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Форматируем для фронтенда
    const formatted = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      currency: "RUB", // Предполагаем RUB, можно расширить
      status: t.status === "COMPLETED" ? "CONFIRMED" : t.status === "FAILED" ? "CANCELED" : "PENDING",
      paymentMethod: "PLATEGA",
      externalId: t.externalId,
      createdAt: t.createdAt.toISOString(),
      description: t.description || "",
      user: t.user,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("[Admin] Error fetching Platega transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}
