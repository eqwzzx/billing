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

    const monthlyExpenses = servers.reduce((acc, s) => acc + s.plan.price + (s.node?.priceModifier || 0), 0)
    const daysRemaining = monthlyExpenses > 0 ? Math.floor(user.balance / (monthlyExpenses / 30)) : Infinity

    // Фильтруем и обрабатываем alerts
    const processedAlerts = alerts.map(alert => {
      // Системные alerts - проверяем условия
      if (alert.isSystem) {
        if (alert.systemType === 'LOW_BALANCE' && (monthlyExpenses === 0 || daysRemaining >= 3)) {
          return null
        }
        if (alert.systemType === 'BALANCE_REMINDER' && (monthlyExpenses === 0 || daysRemaining < 3 || daysRemaining >= 7)) {
          return null
        }
        if (alert.systemType === 'FREE_PLAN' && !servers.some(s => s.plan.isFree)) {
          return null
        }

        // Заменяем переменные в сообщении
        let message = alert.message
        if (daysRemaining !== Infinity) {
          const daysLabel = daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'
          message = message.replace('{days}', String(daysRemaining))
          message = message.replace('{days_label}', daysLabel)
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
