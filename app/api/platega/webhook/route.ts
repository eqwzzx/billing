import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { PlategaWebhookPayload, verifyWebhookSignature } from "@/lib/platega"
import { sendDiscordLog } from "@/lib/discord"
import { notifyBalanceDeposit } from "@/lib/discord-notifications"
import { trackMarketingEvent } from "@/lib/marketing"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PlategaWebhookPayload

    console.log("[Platega Webhook] Received:", body)

    const { id, payload, amount, status } = body

    if (!id || !payload || !amount || !status) {
      console.error("[Platega Webhook] Missing required fields")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Проверяем подпись через заголовки
    const merchantId = request.headers.get("X-MerchantId")
    const secret = request.headers.get("X-Secret")

    if (!merchantId || !secret) {
      console.error("[Platega Webhook] Missing authentication headers")
      return NextResponse.json({ error: "Missing authentication headers" }, { status: 401 })
    }

    if (!verifyWebhookSignature(body, merchantId, secret)) {
      console.error("[Platega Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    // Извлекаем userId из payload (наш orderId)
    const [userId, timestamp, promoId] = payload.split("_")

    if (!userId) {
      console.error("[Platega Webhook] Missing userId in payload")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Обрабатываем успешный платёж
    if (status === "CONFIRMED") {
      // Platega возвращает сумму, которую заплатил клиент (с комиссией)
      // Нужно вычислить сумму без комиссии, которую получаем мы
      // Комиссия Platega ~8.5% (это комиссия платёжной системы, не наша)
      // Формула: originalAmount = paidAmount / 1.085
      const paidAmount = amount
      const paymentAmount = Math.round(paidAmount / 1.085) // Сумма без комиссии Platega

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        console.error("[Platega Webhook] User not found:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      let bonus = 0
      let appliedPromoId: string | null = null
      if (promoId && promoId !== "none") {
        const promo = await prisma.promoCode.findUnique({
          where: { id: promoId },
          include: { usages: { where: { userId } } },
        })
        if (
          promo &&
          promo.isActive &&
          promo.usages.length === 0 &&
          !(promo.maxUses && promo.usedCount >= promo.maxUses)
        ) {
          bonus = promo.type === "BALANCE"
            ? promo.value
            : Math.round(paymentAmount * (promo.value / 100))
          appliedPromoId = promo.id
        }
      }

      const totalAmount = paymentAmount + bonus

      const credited = await prisma.$transaction(async (tx) => {
        const claim = await tx.transaction.updateMany({
          where: { externalId: id, status: "PENDING" },
          data: {
            status: "COMPLETED",
            amount: totalAmount,
            description: `Platega платёж: ${id}${bonus > 0 ? ` (бонус: +${bonus} ₽)` : ""}`,
          },
        })
        if (claim.count === 0) return false
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: totalAmount } },
        })
        return true
      })

      if (!credited) {
        console.log("[Platega Webhook] Transaction already processed:", id)
        return NextResponse.json({ success: true, message: "Already processed" })
      }

      if (appliedPromoId) {
        try {
          await prisma.promoUsage.create({ data: { promoId: appliedPromoId, userId } })
          await prisma.promoCode.update({
            where: { id: appliedPromoId },
            data: { usedCount: { increment: 1 } },
          })
        } catch (error) {
          console.error("[Platega Webhook] Promo apply error:", error)
        }
      }

      // Обновляем статистику реферальной ссылки если есть
      try {
        const referralReg = await prisma.referralRegistration.findUnique({
          where: { userId },
        })

        if (referralReg) {
          const updateData: any = {
            totalDeposits: { increment: totalAmount },
          }

          // Если это первое пополнение
          if (!referralReg.hasDeposited) {
            updateData.hasDeposited = true
            updateData.firstDepositAt = new Date()
          }

          await prisma.referralRegistration.update({
            where: { userId },
            data: updateData,
          })

          console.log("[Platega Webhook] Updated referral stats for user:", userId)
        }
      } catch (error) {
        console.error("[Platega Webhook] Error updating referral stats:", error)
        // Не блокируем платёж из-за ошибки обновления реферальной статистики
      }

      console.log(
        `[Platega Webhook] Payment processed successfully for user ${userId}, amount: ${totalAmount}`
      )

      // Отправляем лог в Discord
      await sendDiscordLog({
        type: "DEPOSIT",
        userId,
        userEmail: user.email,
        amount: totalAmount,
        method: "Platega",
        description: bonus > 0 ? `Бонус: +${bonus} ₽` : undefined,
      })

      // Отправляем уведомление в Discord бота
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      })

      if (updatedUser) {
        await notifyBalanceDeposit({
          userId,
          amount: totalAmount,
          newBalance: updatedUser.balance,
          description: `Пополнение через Platega${bonus > 0 ? ` (бонус: +${bonus} ₽)` : ""}`,
          method: "PLATEGA",
        })
      }

      // Отслеживаем маркетинговое событие
      await trackMarketingEvent({
        eventType: "PAYMENT_SUCCESS",
        userId,
        amount: totalAmount,
        metadata: {
          method: "Platega",
          transactionId: id,
          bonus: bonus > 0 ? bonus : undefined,
        },
      })

      return NextResponse.json({ success: true })
    }

    // Обрабатываем отменённый платёж
    if (status === "CANCELED") {
      await prisma.transaction.updateMany({
        where: { externalId: id, status: "PENDING" },
        data: {
          status: "FAILED",
          description: "Платёж отменён",
        },
      })

      console.log(`[Platega Webhook] Payment canceled: ${id}`)
      return NextResponse.json({ success: true })
    }

    // Обрабатываем возврат (chargeback)
    if (status === "CHARGEBACKED") {
      const transaction = await prisma.transaction.findFirst({
        where: { externalId: id },
      })

      const reversed = await prisma.transaction.updateMany({
        where: { externalId: id, status: "COMPLETED" },
        data: {
          status: "FAILED",
          description: "Возврат средств (chargeback)",
        },
      })

      if (transaction && reversed.count > 0) {
        // Вычитаем сумму из баланса пользователя
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { decrement: transaction.amount } },
        })

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (user) {
          await sendDiscordLog({
            type: "REFUND",
            userId,
            userEmail: user.email,
            amount: transaction.amount,
            method: "Platega",
            description: "Chargeback - средства списаны",
          })
        }
      }

      console.log(`[Platega Webhook] Payment chargebacked: ${id}`)
      return NextResponse.json({ success: true })
    }

    // Для других статусов просто возвращаем успех
    console.log(`[Platega Webhook] Payment status: ${status}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Platega Webhook] Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
