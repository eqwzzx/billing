import { NextRequest, NextResponse } from "next/server"
import { getAdminOrError } from "@/lib/auth-admin"
import { prisma } from "@/lib/db"
import { deleteServer } from "@/lib/pterodactyl"

interface RefundCalculation {
  totalPaid: number
  usedDays: number
  totalDays: number
  remainingDays: number
  refundAmount: number
  refundPercentage: number
}

/**
 * Рассчитывает сумму возврата на основе оставшегося времени
 */
function calculateRefund(
  paidAmount: number,
  createdAt: Date,
  expiresAt: Date | null
): RefundCalculation {
  const now = new Date()
  
  // Если нет даты истечения, возвращаем полную сумму
  if (!expiresAt) {
    return {
      totalPaid: paidAmount,
      usedDays: 0,
      totalDays: 0,
      remainingDays: 0,
      refundAmount: paidAmount,
      refundPercentage: 100,
    }
  }

  const createdTime = createdAt.getTime()
  const expiresTime = expiresAt.getTime()
  const nowTime = now.getTime()

  // Общее количество дней, за которые заплатили
  const totalMillis = expiresTime - createdTime
  const totalDays = Math.ceil(totalMillis / (1000 * 60 * 60 * 24))

  // Использованное время
  const usedMillis = nowTime - createdTime
  const usedDays = Math.ceil(usedMillis / (1000 * 60 * 60 * 24))

  // Оставшееся время
  const remainingMillis = expiresTime - nowTime
  const remainingDays = Math.max(0, Math.ceil(remainingMillis / (1000 * 60 * 60 * 24)))

  // Процент оставшегося времени
  const refundPercentage = totalDays > 0 ? (remainingDays / totalDays) * 100 : 0

  // Сумма возврата (округляем до 2 знаков)
  const refundAmount = Math.round((paidAmount * refundPercentage) / 100 * 100) / 100

  return {
    totalPaid: paidAmount,
    usedDays: Math.max(0, usedDays),
    totalDays,
    remainingDays,
    refundAmount: Math.max(0, refundAmount),
    refundPercentage: Math.max(0, refundPercentage),
  }
}

/**
 * POST /api/admin/servers/refund
 * Удаляет сервер и возвращает средства пользователю
 */
export async function POST(request: NextRequest) {
  const { auth, error } = await getAdminOrError(request)
  if (error) return error

  try {
    const body = await request.json()
    const { serverId, reason, forceDelete = false } = body

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    // Получаем информацию о сервере
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        user: true,
        plan: true,
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    if (server.status === "DELETED") {
      return NextResponse.json({ error: "Server already deleted" }, { status: 400 })
    }

    // Рассчитываем возврат
    const paidAmount = server.paidAmount || server.plan.price
    const refundCalc = calculateRefund(
      paidAmount,
      server.createdAt,
      server.expiresAt
    )

    // Выполняем транзакцию
    const result = await prisma.$transaction(async (tx) => {
      // 1. Возвращаем деньги пользователю (если есть что возвращать)
      let transaction = null
      if (refundCalc.refundAmount > 0) {
        await tx.user.update({
          where: { id: server.userId },
          data: {
            balance: {
              increment: refundCalc.refundAmount,
            },
          },
        })

        // Создаем транзакцию возврата
        transaction = await tx.transaction.create({
          data: {
            userId: server.userId,
            type: "DEPOSIT", // Используем DEPOSIT для возврата средств
            amount: refundCalc.refundAmount,
            description: `Возврат средств за сервер "${server.name}" (${refundCalc.remainingDays} дней из ${refundCalc.totalDays})${reason ? `. Причина: ${reason}` : ""}`,
            serverId: server.id,
            status: "COMPLETED",
            method: "MANUAL",
          },
        })
      }

      // 2. Обновляем статус сервера
      const updatedServer = await tx.server.update({
        where: { id: serverId },
        data: {
          status: "DELETED",
          refundedAmount: refundCalc.refundAmount,
          refundedAt: new Date(),
          deletionReason: reason || "Удален администратором с возвратом средств",
        },
      })

      // 3. Логируем административное действие
      await tx.adminAction.create({
        data: {
          adminId: auth.userId,
          action: "DELETE_SERVER_WITH_REFUND",
          targetType: "SERVER",
          targetId: server.id,
          reason: reason || null,
          details: {
            serverName: server.name,
            userId: server.userId,
            userEmail: server.user.email,
            paidAmount: paidAmount,
            refundAmount: refundCalc.refundAmount,
            refundPercentage: refundCalc.refundPercentage,
            usedDays: refundCalc.usedDays,
            totalDays: refundCalc.totalDays,
            remainingDays: refundCalc.remainingDays,
          },
        },
      })

      return { server: updatedServer, transaction, refundCalc }
    })

    // 4. Удаляем сервер из Pterodactyl (не блокирующая операция)
    if (server.pterodactylId && !forceDelete) {
      try {
        await deleteServer(server.pterodactylId, false)
        console.log(`[Refund] Deleted Pterodactyl server ${server.pterodactylId}`)
      } catch (error) {
        console.error(`[Refund] Failed to delete Pterodactyl server ${server.pterodactylId}:`, error)
        // Не возвращаем ошибку, т.к. деньги уже вернули
      }
    }

    console.log(
      `[Refund] Server ${server.name} (${server.id}) deleted by admin ${auth.email}. ` +
      `Refunded ${refundCalc.refundAmount} ₽ to user ${server.user.email}. ` +
      `Reason: ${reason || "Not specified"}`
    )

    return NextResponse.json({
      success: true,
      message: `Сервер удален. Возвращено ${refundCalc.refundAmount} ₽`,
      data: {
        serverId: server.id,
        serverName: server.name,
        userId: server.userId,
        userEmail: server.user.email,
        refund: {
          amount: refundCalc.refundAmount,
          percentage: Math.round(refundCalc.refundPercentage),
          usedDays: refundCalc.usedDays,
          remainingDays: refundCalc.remainingDays,
          totalDays: refundCalc.totalDays,
        },
        transactionId: result.transaction?.id,
      },
    })
  } catch (error) {
    console.error("[Refund] Error processing refund:", error)
    return NextResponse.json(
      { error: "Failed to process refund", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/servers/refund?serverId=xxx
 * Предварительный расчет возврата (без выполнения)
 */
export async function GET(request: NextRequest) {
  const { auth, error } = await getAdminOrError(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get("serverId")

    if (!serverId) {
      return NextResponse.json({ error: "Server ID is required" }, { status: 400 })
    }

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        user: {
          select: { id: true, email: true, balance: true },
        },
        plan: {
          select: { name: true, price: true },
        },
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    if (server.status === "DELETED") {
      return NextResponse.json({ error: "Server already deleted" }, { status: 400 })
    }

    const paidAmount = server.paidAmount || server.plan.price
    const refundCalc = calculateRefund(
      paidAmount,
      server.createdAt,
      server.expiresAt
    )

    return NextResponse.json({
      server: {
        id: server.id,
        name: server.name,
        status: server.status,
        createdAt: server.createdAt,
        expiresAt: server.expiresAt,
      },
      user: {
        id: server.user.id,
        email: server.user.email,
        currentBalance: server.user.balance,
        balanceAfterRefund: server.user.balance + refundCalc.refundAmount,
      },
      refund: {
        totalPaid: refundCalc.totalPaid,
        refundAmount: refundCalc.refundAmount,
        refundPercentage: Math.round(refundCalc.refundPercentage * 100) / 100,
        usedDays: refundCalc.usedDays,
        remainingDays: refundCalc.remainingDays,
        totalDays: refundCalc.totalDays,
      },
    })
  } catch (error) {
    console.error("[Refund] Error calculating refund:", error)
    return NextResponse.json(
      { error: "Failed to calculate refund" },
      { status: 500 }
    )
  }
}
