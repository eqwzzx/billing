import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем активные alerts
    const alerts = await prisma.alert.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Получаем серверы пользователя для системных alerts
    const servers = await prisma.server.findMany({
      where: { 
        userId: user.id,
        status: { not: 'DELETED' }
      },
      include: {
        plan: true,
        node: true,
      }
    })

    // Вычисляем ежемесячные расходы (только для активных платных серверов)
    const monthlyExpenses = servers
      .filter(s => !s.plan.isFree && ['ACTIVE', 'READY', 'INSTALLING'].includes(s.status))
      .reduce((acc, s) => acc + s.plan.price + (s.node?.priceModifier || 0), 0)
    
    // Вычисляем оставшиеся дни
    let daysRemaining = 0
    if (monthlyExpenses > 0 && user.balance > 0) {
      daysRemaining = Math.floor(user.balance / (monthlyExpenses / 30))
    } else if (monthlyExpenses === 0) {
      daysRemaining = Infinity
    }

    console.log('[User Alerts] Debug:', {
      userId: user.id,
      balance: user.balance,
      monthlyExpenses,
      daysRemaining,
      serversCount: servers.length
    })

    // Фильтруем и обрабатываем alerts
    const processedAlerts = alerts.map(alert => {
      // Проверяем, должен ли алерт скрываться для пользователей без скидки первого заказа
      if (alert.hideAfterFirstDiscount && !user.firstOrderDiscount) {
        return null
      }

      // Системные alerts - проверяем условия
      if (alert.isSystem) {
        // LOW_BALANCE: показываем если расходы есть и осталось меньше 3 дней
        if (alert.systemType === 'LOW_BALANCE' && (monthlyExpenses === 0 || daysRemaining >= 3)) {
          return null
        }
        
        // BALANCE_REMINDER: показываем если расходы есть и осталось от 3 до 7 дней
        if (alert.systemType === 'BALANCE_REMINDER' && (monthlyExpenses === 0 || daysRemaining < 3 || daysRemaining >= 7)) {
          return null
        }
        
        // FREE_PLAN: показываем только если есть бесплатные серверы
        if (alert.systemType === 'FREE_PLAN' && !servers.some(s => s.plan.isFree)) {
          return null
        }

        // Заменяем переменные в сообщении
        let message = alert.message
        
        // Только заменяем переменные если это не Infinity
        if (daysRemaining !== Infinity && daysRemaining >= 0) {
          const daysLabel = daysRemaining === 1 ? 'день' : daysRemaining >= 2 && daysRemaining <= 4 ? 'дня' : 'дней'
          message = message.replace(/\{days\}/g, String(daysRemaining))
          message = message.replace(/\{days_label\}/g, daysLabel)
        } else {
          // Если Infinity или недостаточно данных - убираем переменные из сообщения
          message = message.replace(/\{days\}/g, '∞')
          message = message.replace(/\{days_label\}/g, '')
        }

        return {
          id: alert.id,
          type: alert.type,
          message,
          actionLabel: alert.actionLabel,
          actionUrl: alert.actionUrl,
        }
      }

      // Кастомные alerts - возвращаем как есть
      return {
        id: alert.id,
        type: alert.type,
        message: alert.message,
        actionLabel: alert.actionLabel,
        actionUrl: alert.actionUrl,
      }
    }).filter(Boolean)

    return NextResponse.json(processedAlerts)
  } catch (error) {
    console.error('[User Alerts] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}
