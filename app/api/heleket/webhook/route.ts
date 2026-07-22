import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { HeleketWebhookPayload, verifyWebhookSign } from "@/lib/heleket"
import { sendDiscordLog } from "@/lib/discord"
import { trackMarketingEvent } from "@/lib/marketing"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as HeleketWebhookPayload

    const { uuid, order_id, amount, currency, status, is_final, sign } = body

    console.log("[Heleket Webhook] Received:", { uuid, order_id, amount, currency, status, is_final })

    if (!uuid || !order_id || !status || !sign) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    if (!verifyWebhookSign(body)) {
      console.error("[Heleket Webhook] Invalid signature")
      return NextResponse.json({ error: "Hash Verification Failure" }, { status: 403 })
    }

    const orderIdClean = order_id.replace(/^whmcs(?:_upd)?_/, "")
    const [userId, timestamp, promoId] = orderIdClean.split("_")

    if (!userId) {
      console.error("[Heleket Webhook] Missing userId in order_id")
      return NextResponse.json({ error: "Invalid order_id" }, { status: 400 })
    }

    const isPaid = is_final && (status === "paid" || status === "paid_over" || status === "wrong_amount")

    if (isPaid) {
      const paymentAmount = parseFloat(amount)

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        console.error("[Heleket Webhook] User not found:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const rubAmount = Math.round(paymentAmount * 90)

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
            : Math.round(paymentAmount * 90 * (promo.value / 100))
          appliedPromoId = promo.id
        }
      }

      const totalAmount = rubAmount + bonus

      const credited = await prisma.$transaction(async (tx) => {
        const claim = await tx.transaction.updateMany({
          where: { externalId: uuid, status: "PENDING" },
          data: {
            status: "COMPLETED",
            amount: totalAmount,
            description: bonus > 0
              ? `Heleket: ${paymentAmount} ${currency} (${rubAmount} ₽) + бонус ${bonus} ₽`
              : `Heleket: ${paymentAmount} ${currency} (${rubAmount} ₽)`,
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
          console.error("[Heleket Webhook] Promo apply error:", error)
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
          
          console.log('[Heleket Webhook] Updated referral stats for user:', userId)
        }
      } catch (error) {
        console.error('[Heleket Webhook] Error updating referral stats:', error)
        // Не блокируем платёж из-за ошибки обновления реферальной статистики
      }

      console.log(`[Heleket Webhook] Payment succeeded: ${uuid}, user: ${userId}, amount: ${totalAmount} ₽`)
      
      // Отправляем лог в Discord
      await sendDiscordLog({
        type: 'DEPOSIT',
        userId,
        userEmail: user.email,
        amount: totalAmount,
        method: 'Heleket (Crypto)',
        description: bonus > 0 ? `Бонус: +${bonus} ₽` : undefined,
      })

      // Отслеживаем маркетинговое событие
      await trackMarketingEvent({
        eventType: 'PAYMENT_SUCCESS',
        userId,
        amount: totalAmount,
        metadata: {
          method: 'Heleket',
          transactionId: uuid,
          currency,
          bonus: bonus > 0 ? bonus : undefined,
        },
      })
    }

    if (status === "fail" || status === "cancel" || status === "system_fail") {
      await prisma.transaction.updateMany({
        where: { externalId: uuid, status: "PENDING" },
        data: {
          status: "FAILED",
          description: "Платёж отменён",
        },
      })

      console.log(`[Heleket Webhook] Payment failed: ${uuid}, status: ${status}`)
    }

    if (status === "refund_paid") {
      await prisma.transaction.updateMany({
        where: { externalId: uuid },
        data: {
          status: "FAILED",
          description: "Платёж возвращён",
        },
      })

      console.log(`[Heleket Webhook] Payment refunded: ${uuid}`)
    }

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("[Heleket Webhook] Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
