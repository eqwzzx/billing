import { NextRequest, NextResponse } from "next/server"
import { getAdminOrError } from "@/lib/auth-admin"
import { prisma } from "@/lib/db"

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
 * POST /api/admin/servers/permanent-delete
 * Полностью удаляет сервер из БД (для уже удаленных серверов).
 * withRefund=true — с возвратом остатка средств, withRefund=false — без возврата.
 */
export async function POST(request: NextRequest) {
  const { auth, error } = await getAdminOrError(request)
  if (error) return error

  try {
    const body = await request.json()
    const { serverId, reason, withRefund = true } = body

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

    if (server.status !== "DELETED") {
      return NextResponse.json({ 
        error: "Server must be in DELETED status. Use refund endpoint for active servers." 
      }, { status: 400 })
    }

    // Проверяем, были ли уже возвращены средства
    const alreadyRefunded = server.refundedAmount && server.refundedAmount > 0

    // Рассчитываем возврат только если он запрошен и еще не было возврата
    let refundCalc: RefundCalculation | null = null
    if (withRefund && !alreadyRefunded) {
      const paidAmount = server.paidAmount || server.plan.price
      refundCalc = calculateRefund(
        paidAmount,
        server.createdAt,
        server.expiresAt
      )
    }

    // Выполняем транзакцию
    const result = await prisma.$transaction(async (tx) => {
      let transaction = null

      // 1. Возвращаем деньги пользователю (если не было возврата ранее)
      if (refundCalc && refundCalc.refundAmount > 0) {
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
            type: "DEPOSIT",
            amount: refundCalc.refundAmount,
            description: `Возврат средств за удаленный сервер "${server.name}" (${refundCalc.remainingDays} дней из ${refundCalc.totalDays})${reason ? `. Причина: ${reason}` : ""}`,
            serverId: server.id,
            status: "COMPLETED",
            method: "MANUAL",
          },
        })
      }

      // 2. Логируем административное действие
      await tx.adminAction.create({
        data: {
          adminId: auth.userId,
          action: withRefund ? "PERMANENT_DELETE_SERVER" : "PERMANENT_DELETE_SERVER_NO_REFUND",
          targetType: "SERVER",
          targetId: server.id,
          reason: reason || null,
          details: {
            serverName: server.name,
            userId: server.userId,
            userEmail: server.user.email,
            wasDeleted: true,
            withRefund,
            refundedBefore: alreadyRefunded,
            previousRefundAmount: server.refundedAmount,
            newRefundAmount: refundCalc?.refundAmount || 0,
            refundPercentage: refundCalc?.refundPercentage || 0,
            usedDays: refundCalc?.usedDays || 0,
            totalDays: refundCalc?.totalDays || 0,
            remainingDays: refundCalc?.remainingDays || 0,
          },
        },
      })

      // 3. Удаляем сервер из БД полностью
      await tx.server.delete({
        where: { id: serverId },
      })

      return { transaction, refundCalc }
    })

    const refundMessage = !withRefund
      ? ". Без возврата средств"
      : refundCalc && refundCalc.refundAmount > 0
        ? `. Возвращено ${refundCalc.refundAmount} ₽`
        : alreadyRefunded
          ? ". Средства уже были возвращены ранее"
          : ". Возврат не требуется"

    console.log(
      `[PermanentDelete] Server ${server.name} (${server.id}) permanently deleted by admin ${auth.email}. ` +
      `User: ${server.user.email}${refundMessage}. ` +
      `Reason: ${reason || "Not specified"}`
    )

    return NextResponse.json({
      success: true,
      message: `Сервер полностью удален${refundMessage}`,
      data: {
        serverId: server.id,
        serverName: server.name,
        userId: server.userId,
        userEmail: server.user.email,
        refund: refundCalc ? {
          amount: refundCalc.refundAmount,
          percentage: Math.round(refundCalc.refundPercentage),
          usedDays: refundCalc.usedDays,
          remainingDays: refundCalc.remainingDays,
          totalDays: refundCalc.totalDays,
        } : null,
        withRefund,
        alreadyRefunded: alreadyRefunded,
        previousRefundAmount: server.refundedAmount,
        transactionId: result.transaction?.id,
      },
    })
  } catch (error) {
    console.error("[PermanentDelete] Error processing permanent delete:", error)
    return NextResponse.json(
      { error: "Failed to permanently delete server", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/servers/permanent-delete?serverId=xxx
 * Предварительный расчет возврата для удаленного сервера
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

    if (server.status !== "DELETED") {
      return NextResponse.json({ 
        error: "Server must be in DELETED status" 
      }, { status: 400 })
    }

    // Проверяем, были ли уже возвращены средства
    const alreadyRefunded = server.refundedAmount && server.refundedAmount > 0

    let refundCalc: RefundCalculation | null = null
    if (!alreadyRefunded) {
      const paidAmount = server.paidAmount || server.plan.price
      refundCalc = calculateRefund(
        paidAmount,
        server.createdAt,
        server.expiresAt
      )
    }

    return NextResponse.json({
      server: {
        id: server.id,
        name: server.name,
        status: server.status,
        createdAt: server.createdAt,
        expiresAt: server.expiresAt,
        deletedAt: server.refundedAt,
      },
      user: {
        id: server.user.id,
        email: server.user.email,
        currentBalance: server.user.balance,
        balanceAfterRefund: refundCalc 
          ? server.user.balance + refundCalc.refundAmount 
          : server.user.balance,
      },
      refund: refundCalc ? {
        totalPaid: refundCalc.totalPaid,
        refundAmount: refundCalc.refundAmount,
        refundPercentage: Math.round(refundCalc.refundPercentage * 100) / 100,
        usedDays: refundCalc.usedDays,
        remainingDays: refundCalc.remainingDays,
        totalDays: refundCalc.totalDays,
      } : null,
      alreadyRefunded: alreadyRefunded,
      previousRefundAmount: server.refundedAmount,
      message: alreadyRefunded 
        ? "Средства уже были возвращены ранее" 
        : refundCalc && refundCalc.refundAmount > 0
          ? "Будет произведен возврат средств"
          : "Возврат не требуется",
    })
  } catch (error) {
    console.error("[PermanentDelete] Error calculating refund:", error)
    return NextResponse.json(
      { error: "Failed to calculate refund" },
      { status: 500 }
    )
  }
}
