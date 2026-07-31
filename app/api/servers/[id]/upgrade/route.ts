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

    // Нельзя изменять тариф с/на бесплатный тариф
    if (server.plan.isFree || newPlan.isFree) {
      return NextResponse.json({ 
        error: 'Нельзя изменить тариф для бесплатных серверов' 
      }, { status: 400 })
    }

    // Проверка что новый тариф той же категории
    if (server.plan.category !== newPlan.category) {
      return NextResponse.json({ 
        error: 'Можно изменить тариф только на тариф той же категории' 
      }, { status: 400 })
    }

    // Проверяем что тарифы разные
    const currentPlanPrice = server.plan.price + (server.node?.priceModifier || 0)
    const newPlanPrice = newPlan.price + (server.node?.priceModifier || 0)
    
    if (newPlanPrice === currentPlanPrice) {
      return NextResponse.json({ 
        error: 'Новый тариф не отличается от текущего' 
      }, { status: 400 })
    }
    
    const isUpgrade = newPlanPrice > currentPlanPrice
    const isDowngrade = newPlanPrice < currentPlanPrice

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Рассчитываем возврат за неиспользованное время
    const now = new Date()
    const expiresAt = server.expiresAt ? new Date(server.expiresAt) : null
    
    if (!expiresAt || expiresAt <= now) {
      return NextResponse.json({ 
        error: 'Срок аренды истёк. Продлите сервер перед изменением тарифа.' 
      }, { status: 400 })
    }

    // Рассчитываем остаток времени
    const totalTime = 30 * 24 * 60 * 60 * 1000 // 30 дней в миллисекундах
    const remainingTime = expiresAt.getTime() - now.getTime()
    const remainingDays = remainingTime / (24 * 60 * 60 * 1000)
    
    // Минимум 1 день для изменения тарифа
    if (remainingDays < 1) {
      return NextResponse.json({ 
        error: 'Осталось меньше суток аренды. Продлите сервер перед изменением тарифа.' 
      }, { status: 400 })
    }

    // Возврат средств за остаток текущего тарифа
    const paidAmount = server.paidAmount || currentPlanPrice
    const refundAmount = Math.round((paidAmount / totalTime) * remainingTime)
    
    // Стоимость нового тарифа за оставшееся время
    const newPlanCost = Math.round((newPlanPrice / totalTime) * remainingTime)
    
    // Итоговая сумма к оплате/возврату
    // При апгрейде: totalCost > 0 (нужно доплатить)
    // При даунгрейде: totalCost < 0 (вернем разницу)
    const totalCost = newPlanCost - refundAmount

    // При апгрейде проверяем баланс
    if (isUpgrade && user.balance < totalCost) {
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
      const { getPterodactylServer, getServerResources } = await import('@/lib/pterodactyl')
      const pteroServer = await getPterodactylServer(server.pterodactylId)
      
      console.log('[Change Plan] Pterodactyl server data:', JSON.stringify(pteroServer, null, 2))
      
      // При даунгрейде проверяем использование диска
      if (isDowngrade) {
        console.log('[Change Plan] Downgrade detected, checking disk usage...')
        
        // Получаем статистику использования ресурсов
        const resources = await getServerResources(server.pterodactylUuid)
        
        if (resources) {
          const usedDiskMB = Math.ceil(resources.disk_bytes / 1024 / 1024)
          const newDiskLimitMB = newPlan.disk
          
          console.log('[Change Plan] Disk check:', {
            usedDiskMB,
            newDiskLimitMB,
            currentDiskLimitMB: server.plan.disk,
          })
          
          // Если используется больше места, чем позволяет новый тариф
          if (usedDiskMB > newDiskLimitMB) {
            return NextResponse.json({ 
              error: `На сервере используется ${usedDiskMB} МБ, а новый тариф позволяет только ${newDiskLimitMB} МБ. Освободите ${usedDiskMB - newDiskLimitMB} МБ перед понижением тарифа.`,
              usedDiskMB,
              newDiskLimitMB,
              requiredToFree: usedDiskMB - newDiskLimitMB,
            }, { status: 400 })
          }
          
          console.log('[Change Plan] Disk check passed')
        } else {
          console.warn('[Change Plan] Could not get resources, skipping disk check')
        }
      }
      
      // Получаем ID основного allocation
      let defaultAllocationId: number | undefined
      
      // Проверяем разные возможные структуры ответа
      if (pteroServer.relationships?.allocations?.data) {
        defaultAllocationId = pteroServer.relationships.allocations.data[0]?.attributes?.id
      } else if (pteroServer.allocations) {
        defaultAllocationId = pteroServer.allocations[0]?.id
      } else if (pteroServer.allocation) {
        defaultAllocationId = typeof pteroServer.allocation === 'number' 
          ? pteroServer.allocation 
          : pteroServer.allocation?.id
      }
      
      console.log('[Change Plan] Found allocation ID:', defaultAllocationId)
      
      if (!defaultAllocationId) {
        console.error('[Change Plan] No allocation found for server. Server data:', pteroServer)
        return NextResponse.json({ 
          error: 'Не удалось найти порт сервера. Обратитесь в поддержку.' 
        }, { status: 500 })
      }

      // Обновляем build сервера с текущим allocation
      console.log('[Change Plan] Updating server build with allocation:', defaultAllocationId)
      await updateServerBuild(server.pterodactylId, {
        ram: newPlan.ram,
        cpu: newPlan.cpu,
        disk: newPlan.disk,
        databases: newPlan.databases,
        backups: newPlan.backups,
        allocations: newPlan.allocations || 1,
        allocationId: defaultAllocationId,
      })
      console.log('[Change Plan] Server build updated successfully')
    } catch (pteroError: any) {
      console.error('[Change Plan] Pterodactyl error:', pteroError)
      const errorMsg = pteroError?.message || 'Неизвестная ошибка'
      return NextResponse.json({ 
        error: 'Ошибка обновления сервера в панели управления: ' + errorMsg 
      }, { status: 500 })
    }

    // Обновляем баланс пользователя
    // При апгрейде: списываем (decrement)
    // При даунгрейде: возвращаем (increment)
    if (isUpgrade) {
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalCost } },
      })
    } else {
      // При даунгрейде totalCost отрицательный, поэтому вычитаем его (добавляем модуль)
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: Math.abs(totalCost) } },
      })
    }

    // Обновляем сервер в БД
    await prisma.server.update({
      where: { id: server.id },
      data: {
        planId: newPlan.id,
        paidAmount: newPlanCost, // Новая стоимость за оставшееся время
      },
    })

    // Создаём транзакцию
    const operationType = isUpgrade ? 'Апгрейд' : 'Даунгрейд'
    await prisma.transaction.create({
      data: {
        userId,
        type: isUpgrade ? 'PAYMENT' : 'REFUND',
        amount: isUpgrade ? -totalCost : Math.abs(totalCost),
        description: `${operationType} сервера "${server.name}" с ${server.plan.name} на ${newPlan.name} (осталось ${Math.round(remainingDays)} дн.)`,
        serverId: server.id,
      },
    })

    // Отправляем лог в Discord
    const logDescription = isUpgrade 
      ? `Возврат: ${refundAmount} ₽, Доплата: ${totalCost} ₽, Осталось: ${Math.round(remainingDays)} дн.`
      : `Возврат за старый: ${refundAmount} ₽, Стоимость нового: ${newPlanCost} ₽, Возврат разницы: ${Math.abs(totalCost)} ₽, Осталось: ${Math.round(remainingDays)} дн.`
    
    await sendDiscordLog({
      type: isUpgrade ? 'SERVER_UPGRADE' : 'SERVER_DOWNGRADE',
      userId,
      userEmail: user.email,
      amount: Math.abs(totalCost),
      serverName: server.name,
      planName: `${server.plan.name} → ${newPlan.name}`,
      description: logDescription,
    })

    // Логирование для админки
    await adminLogger.log({
      userId,
      action: isUpgrade ? 'SERVER_UPGRADE' : 'SERVER_DOWNGRADE',
      details: `Сервер ${server.id} (${server.name}): ${server.plan.name} → ${newPlan.name}`,
      metadata: {
        serverId: server.id,
        oldPlan: server.plan.name,
        newPlan: newPlan.name,
        refund: refundAmount,
        cost: totalCost,
        isUpgrade,
        isDowngrade,
        remainingDays: Math.round(remainingDays),
      },
    })

    const successMessage = isUpgrade 
      ? `Сервер успешно улучшен до ${newPlan.name}`
      : `Тариф успешно понижен до ${newPlan.name}. На баланс возвращено ${Math.abs(totalCost)} ₽`
    
    return NextResponse.json({ 
      success: true,
      message: successMessage,
      isUpgrade,
      isDowngrade,
      details: {
        refund: refundAmount,
        cost: isUpgrade ? totalCost : Math.abs(totalCost),
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
    console.error('[Change Plan] Error:', error)
    return NextResponse.json({ 
      error: 'Ошибка при изменении тарифа сервера' 
    }, { status: 500 })
  }
}
