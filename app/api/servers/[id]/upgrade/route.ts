import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateServerBuild } from '@/lib/pterodactyl'
import { sendDiscordLog } from '@/lib/discord'
import { adminLogger } from '@/lib/admin-logger'
import { verifyAuth } from '@/lib/auth-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const userId = auth.userId

    const body = await request.json()
    const { newPlanId } = body

    const server = await prisma.server.findFirst({
      where: { 
        id: params.id,
        userId,
      },
      include: {
        plan: true,
        node: true,
      },
    })

    if (!server) {
      return NextResponse.json({ error: 'Сервер не найден' }, { status: 404 })
    }

    if (server.status === 'DELETED') {
      return NextResponse.json({ error: 'Сервер удалён' }, { status: 400 })
    }

    const newPlan = await prisma.plan.findUnique({
      where: { id: newPlanId },
    })

    if (!newPlan) {
      return NextResponse.json({ error: 'Новый тариф не найден' }, { status: 404 })
    }

    // Нельзя апгрейдить с/на бесплатный тариф
    if (server.plan.isFree || newPlan.isFree) {
      return NextResponse.json({ 
        error: 'Нельзя изменить тариф для бесплатных серверов' 
      }, { status: 400 })
    }

    // Проверка что новый тариф той же категории
    if (server.plan.category !== newPlan.category) {
      return NextResponse.json({ 
        error: 'Можно апгрейдить только на тариф той же категории' 
      }, { status: 400 })
    }

    // Нельзя понизить тариф
    const currentPlanPrice = server.plan.price + (server.node?.priceModifier || 0)
    const newPlanPrice = newPlan.price + (server.node?.priceModifier || 0)
    
    if (newPlanPrice <= currentPlanPrice) {
      return NextResponse.json({ 
        error: 'Новый тариф должен быть дороже текущего' 
      }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Рассчитываем возврат за неиспользованное время
    const now = new Date()
    const expiresAt = server.expiresAt ? new Date(server.expiresAt) : null
    
    if (!expiresAt || expiresAt <= now) {
      return NextResponse.json({ 
        error: 'Срок аренды истёк. Продлите сервер перед апгрейдом.' 
      }, { status: 400 })
    }

    // Рассчитываем остаток времени
    const totalTime = 30 * 24 * 60 * 60 * 1000 // 30 дней в миллисекундах
    const remainingTime = expiresAt.getTime() - now.getTime()
    const remainingDays = remainingTime / (24 * 60 * 60 * 1000)
    
    // Минимум 1 день для апгрейда
    if (remainingDays < 1) {
      return NextResponse.json({ 
        error: 'Осталось меньше суток аренды. Продлите сервер перед апгрейдом.' 
      }, { status: 400 })
    }

    // Возврат средств за остаток текущего тарифа
    const paidAmount = server.paidAmount || currentPlanPrice
    const refundAmount = Math.round((paidAmount / totalTime) * remainingTime)
    
    // Стоимость нового тарифа за оставшееся время
    const newPlanCost = Math.round((newPlanPrice / totalTime) * remainingTime)
    
    // Итоговая сумма к оплате = стоимость нового тарифа - возврат за старый
    const totalCost = newPlanCost - refundAmount

    if (totalCost < 0) {
      return NextResponse.json({ 
        error: 'Ошибка расчёта стоимости апгрейда' 
      }, { status: 500 })
    }

    if (user.balance < totalCost) {
      return NextResponse.json({ 
        error: 'Недостаточно средств на балансе',
        required: totalCost,
        current: user.balance,
        refund: refundAmount,
        newPlanCost,
        remainingDays: Math.round(remainingDays),
      }, { status: 400 })
    }

    // Обновляем сервер в Pterodactyl
    if (!server.pterodactylId) {
      return NextResponse.json({ 
        error: 'Сервер не связан с панелью управления' 
      }, { status: 500 })
    }

    try {
      // Получаем текущий сервер из Pterodactyl для получения allocation ID
      const { getPterodactylServer } = await import('@/lib/pterodactyl')
      const pteroServer = await getPterodactylServer(server.pterodactylId)
      
      // Получаем ID основного allocation (первый в списке)
      const defaultAllocationId = pteroServer.relationships?.allocations?.data?.[0]?.attributes?.id
      
      if (!defaultAllocationId) {
        console.error('[Upgrade Server] No allocation found for server')
        return NextResponse.json({ 
          error: 'Не удалось найти порт сервера' 
        }, { status: 500 })
      }

      // Обновляем build сервера с текущим allocation
      await updateServerBuild(server.pterodactylId, {
        ram: newPlan.ram,
        cpu: newPlan.cpu,
        disk: newPlan.disk,
        databases: newPlan.databases,
        backups: newPlan.backups,
        allocations: newPlan.allocations || 1,
        allocationId: defaultAllocationId,
      })
    } catch (pteroError: any) {
      console.error('[Upgrade Server] Pterodactyl error:', pteroError)
      const errorMsg = pteroError?.message || 'Неизвестная ошибка'
      return NextResponse.json({ 
        error: 'Ошибка обновления сервера в панели управления: ' + errorMsg 
      }, { status: 500 })
    }

    // Списываем средства
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: totalCost } },
    })

    // Обновляем сервер в БД
    await prisma.server.update({
      where: { id: server.id },
      data: {
        planId: newPlan.id,
        paidAmount: newPlanCost, // Новая стоимость за оставшееся время
      },
    })

    // Создаём транзакцию
    await prisma.transaction.create({
      data: {
        userId,
        type: 'PAYMENT',
        amount: -totalCost,
        description: `Апгрейд сервера "${server.name}" с ${server.plan.name} на ${newPlan.name} (осталось ${Math.round(remainingDays)} дн.)`,
        serverId: server.id,
      },
    })

    // Отправляем лог в Discord
    await sendDiscordLog({
      type: 'SERVER_UPGRADE',
      userId,
      userEmail: user.email,
      amount: totalCost,
      serverName: server.name,
      planName: `${server.plan.name} → ${newPlan.name}`,
      description: `Возврат: ${refundAmount} ₽, Доплата: ${totalCost} ₽, Осталось: ${Math.round(remainingDays)} дн.`,
    })

    // Логирование для админки
    await adminLogger.log({
      userId,
      action: 'SERVER_UPGRADE',
      details: `Сервер ${server.id} (${server.name}): ${server.plan.name} → ${newPlan.name}`,
      metadata: {
        serverId: server.id,
        oldPlan: server.plan.name,
        newPlan: newPlan.name,
        refund: refundAmount,
        cost: totalCost,
        remainingDays: Math.round(remainingDays),
      },
    })

    return NextResponse.json({ 
      success: true,
      message: `Сервер успешно апгрейднут на ${newPlan.name}`,
      details: {
        refund: refundAmount,
        cost: totalCost,
        remainingDays: Math.round(remainingDays),
        newPlan: {
          name: newPlan.name,
          ram: newPlan.ram,
          cpu: newPlan.cpu,
          disk: newPlan.disk,
        },
      },
    })
  } catch (error) {
    console.error('[Upgrade Server] Error:', error)
    return NextResponse.json({ 
      error: 'Ошибка при апгрейде сервера' 
    }, { status: 500 })
  }
}
