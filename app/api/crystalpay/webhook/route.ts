import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { CrystalPayWebhookPayload, verifyWebhookSignature } from "@/lib/crystalpay"
import { sendDiscordLog } from "@/lib/discord"
import { notifyBalanceDeposit } from "@/lib/discord-notifications"
import { trackMarketingEvent } from "@/lib/marketing"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CrystalPayWebhookPayload

    console.log("[CrystalPay Webhook] Received:", body)

    const { id, order_id, amount, state, extra, signature } = body

    if (!id || !order_id || !amount || !state || !signature) {
      console.error("[CrystalPay Webhook] Missing required fields")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    if (!verifyWebhookSignature(body)) {
      console.error("[CrystalPay Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    // Извлекаем userId из order_id или extra
    const orderId = extra || order_id
    const [userId, timestamp, promoId] = orderId.split("_")

    if (!userId) {
      console.error("[CrystalPay Webhook] Missing userId in order_id")
      return NextResponse.json({ error: "Invalid order_id" }, { status: 400 })
    }

    // Обрабатываем успешный платёж
    if (state === "payed") {
      const paymentAmount = parseFloat(amount)

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        console.error("[CrystalPay Webhook] User not found:", userId)
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
            description: `CrystalPay платёж: ${id}${bonus > 0 ? ` (бонус: +${bonus} ₽)` : ""}`,
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
        console.log("[CrystalPay Webhook] Transaction already processed:", id)
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
          console.error("[CrystalPay Webhook] Promo apply error:", error)
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

          console.log('[CrystalPay Webhook] Updated referral stats for user:', userId)
        }
      } catch (error) {
        console.error('[CrystalPay Webhook] Error updating referral stats:', error)
        // Не блокируем платёж из-за ошибки обновления реферальной статистики
      }

      console.log(`[CrystalPay Webhook] Payment processed successfully for user ${userId}, amount: ${totalAmount}`)

      // Отправляем лог в Discord
      await sendDiscordLog({
        type: 'DEPOSIT',
        userId,
        userEmail: user.email,
        amount: totalAmount,
        method: 'CrystalPay',
        description: bonus > 0 ? `Бонус: +${bonus} ₽` : undefined,
      })

      // Отправляем уведомление в Discord бота
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      })
      
      if (updatedUser) {
        await notifyBalanceDeposit({
          userId,
          amount: totalAmount,
          newBalance: updatedUser.balance,
          description: `Пополнение через CrystalPay${bonus > 0 ? ` (бонус: +${bonus} ₽)` : ''}`,
          method: 'CRYSTALPAY'
        })
      }

      // Отслеживаем маркетинговое событие
      await trackMarketingEvent({
        eventType: 'PAYMENT_SUCCESS',
        userId,
        amount: totalAmount,
        metadata: {
          method: 'CrystalPay',
          transactionId: id,
          bonus: bonus > 0 ? bonus : undefined,
        },
      })

      return NextResponse.json({ success: true })
    }

    // Обрабатываем отменённый платёж
    if (state === "canceled") {
      await prisma.transaction.updateMany({
        where: { externalId: id, status: "PENDING" },
        data: {
          status: "FAILED",
          description: "Платёж отменён",
        },
      })

      console.log(`[CrystalPay Webhook] Payment canceled: ${id}`)
      return NextResponse.json({ success: true })
    }

    // Для других статусов просто возвращаем успех
    console.log(`[CrystalPay Webhook] Payment state: ${state}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[CrystalPay Webhook] Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
