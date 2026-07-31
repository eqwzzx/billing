import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { sendDiscordLog } from '@/lib/discord'
import { trackMarketingEvent } from '@/lib/marketing'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Не авторизованы' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Проверка верификации: Discord ИЛИ email
    if (!user.discordId && !user.emailVerified) {
      return NextResponse.json({ 
        error: 'Для продления сервера необходимо подтвердить email или привязать Discord. Проверьте почту или обратитесь в поддержку.',
        needsVerification: true
      }, { status: 403 })
    }

    const body = await request.json()
    const { serverId, days = 30 } = body

    // Валидация количества дней
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return NextResponse.json({ 
        error: 'Некорректный срок продления. Допустимо от 1 до 365 дней.' 
      }, { status: 400 })
    }

    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { plan: true, node: true },
    })

    if (!server) {
      return NextResponse.json({ error: 'Сервер не найден' }, { status: 404 })
    }

    if (server.userId !== user.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    if (server.plan.isFree) {
      return NextResponse.json({ 
        error: 'Бесплатный тариф нельзя продлить' 
      }, { status: 400 })
    }

    // Полная цена за месяц без скидки (план + модификатор ноды)
    const pricePerMonth = server.plan.price + (server.node?.priceModifier ?? 0)
    
    // Расчёт стоимости за выбранный период
    const renewalCost = (pricePerMonth / 30) * days

    if (user.balance < renewalCost) {
      return NextResponse.json({ 
        error: 'Недостаточно средств на балансе',
        required: renewalCost,
        current: user.balance,
      }, { status: 400 })
    }

    const newExpiresAt = new Date(server.expiresAt || new Date())
    newExpiresAt.setDate(newExpiresAt.getDate() + days)

    // При продлении обновляем paidAmount на стоимость за выбранный период
    await prisma.server.update({
      where: { id: serverId },
      data: { 
        expiresAt: newExpiresAt,
        paidAmount: renewalCost,
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: renewalCost } },
    })

    const daysLabel = days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'PAYMENT',
        amount: -renewalCost,
        description: `Продление сервера "${server.name}" на ${days} ${daysLabel}`,
        serverId: server.id,
      },
    })

    // Отправляем лог в Discord
    await sendDiscordLog({
      type: 'RENEWAL',
      userId: user.id,
      userEmail: user.email,
      amount: renewalCost,
      serverName: server.name,
      planName: server.plan.name,
    })

    // Tracking маркетингового события SERVER_RENEW
    await trackMarketingEvent({
      eventType: 'SERVER_RENEW',
      userId: user.id,
      serverId: server.id,
      planId: server.plan.id,
      amount: renewalCost,
      metadata: {
        serverName: server.name,
        planName: server.plan.name,
        nodeName: server.node?.name,
        daysExtended: days,
      },
    })

    return NextResponse.json({ 
      success: true,
      message: `Сервер продлён на ${days} ${daysLabel}`,
      expiresAt: newExpiresAt,
      cost: renewalCost,
    })
  } catch (error) {
    console.error('Renew server error:', error)
    return NextResponse.json({ 
      error: 'Ошибка при продлении сервера' 
    }, { status: 500 })
  }
}
