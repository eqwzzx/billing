import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateYooMoneyNotification, YooMoneyWebhookPayload } from "@/lib/yoomoney"
import { sendDiscordLog } from "@/lib/discord"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data: YooMoneyWebhookPayload = {}
    
    for (const [key, value] of formData.entries()) {
      data[key as keyof YooMoneyWebhookPayload] = value.toString()
    }

    console.log("[YooMoney] Webhook received:", data)

    if (!validateYooMoneyNotification(data)) {
      console.error("[YooMoney] Invalid notification signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    const { label, amount } = data
    if (!label || !amount) {
      console.error("[YooMoney] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (data.codepro === "true") {
      console.warn("[YooMoney] Rejected: protected transfer (codepro)", label)
      return NextResponse.json({ status: "ignored", reason: "codepro" }, { status: 200 })
    }

    if (data.unaccepted === "true") {
      console.warn("[YooMoney] Rejected: unaccepted transfer", label)
      return NextResponse.json({ status: "ignored", reason: "unaccepted" }, { status: 200 })
    }

    const orderParts = label.split("_")
    if (orderParts.length < 2) {
      console.error("[YooMoney] Invalid order format")
      return NextResponse.json({ error: "Invalid order format" }, { status: 400 })
    }

    const userId = orderParts[0]
    const promoId = orderParts[2] !== "none" ? orderParts[2] : null
    const amountNum = parseFloat(amount)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.error("[YooMoney] User not found:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let bonus = 0
    let appliedPromoId: string | null = null
    if (promoId) {
      const promo = await prisma.promoCode.findUnique({
        where: { id: promoId },
        include: { usages: { where: { userId } } }
      })
      if (
        promo &&
        promo.isActive &&
        promo.usages.length === 0 &&
        !(promo.maxUses && promo.usedCount >= promo.maxUses)
      ) {
        bonus = promo.type === "BALANCE"
          ? promo.value
          : Math.round(amountNum * (promo.value / 100))
        appliedPromoId = promo.id
      }
    }

    const totalAmount = amountNum + bonus

    const credited = await prisma.$transaction(async (tx) => {
      const claim = await tx.transaction.updateMany({
        where: { externalId: label, status: "PENDING" },
        data: {
          status: "COMPLETED",
          amount: totalAmount,
          description: `YooMoney платёж: ${label}${bonus > 0 ? ` (бонус: +${bonus} ₽)` : ""}`
        }
      })
      if (claim.count === 0) return false
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: totalAmount } }
      })
      return true
    })

    if (!credited) {
      console.log("[YooMoney] Transaction already processed:", label)
      return NextResponse.json({ status: "success" }, { status: 200 })
    }

    if (appliedPromoId) {
      try {
        await prisma.promoUsage.create({ data: { userId, promoId: appliedPromoId } })
        await prisma.promoCode.update({
          where: { id: appliedPromoId },
          data: { usedCount: { increment: 1 } },
        })
      } catch (error) {
        console.error("[YooMoney] Promo apply error:", error)
      }
    }

    console.log(`[YooMoney] Payment processed successfully for user ${userId}, amount: ${totalAmount}`)
    
    // Отправляем лог в Discord
    await sendDiscordLog({
      type: 'DEPOSIT',
      userId,
      userEmail: user.email,
      amount: totalAmount,
      method: 'YooMoney',
      description: bonus > 0 ? `Бонус: +${bonus} ₽` : undefined,
    })
    
    return NextResponse.json({ status: "success" }, { status: 200 })
  } catch (error) {
    console.error("[YooMoney] Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}