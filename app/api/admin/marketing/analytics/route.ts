import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Получить маркетинговую аналитику
export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireAuth(req)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'ADMIN' && user.role !== 'PR_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const source = searchParams.get('source')
    const campaign = searchParams.get('campaign')

    // Формируем условия для фильтрации
    const where: any = {}

    if (startDate || endDate) {
      where.createdAt = {}

      if (startDate) {
        const from = new Date(startDate)
        if (isNaN(from.getTime())) {
          return NextResponse.json({ error: 'Некорректная дата начала' }, { status: 400 })
        }
        from.setHours(0, 0, 0, 0)
        where.createdAt.gte = from
      }

      if (endDate) {
        const to = new Date(endDate)
        if (isNaN(to.getTime())) {
          return NextResponse.json({ error: 'Некорректная дата окончания' }, { status: 400 })
        }
        to.setHours(23, 59, 59, 999)
        where.createdAt.lte = to
      }
    }
    
    // Получаем все события (фильтр по источнику применяем после восстановления UTM,
    // иначе события без меток в самом событии не попадут в выборку)
    const events = await prisma.marketingEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Ограничение для производительности
    })

    // События из вебхуков (оплаты) сохранялись без UTM меток, т.к. cookies там недоступны.
    // Восстанавливаем источник из профиля пользователя, чтобы выручка попадала в свою кампанию.
    const userIdsToResolve = Array.from(
      new Set(
        events
          .filter(e => !e.utmSource && e.userId)
          .map(e => e.userId as string)
      )
    )

    const userUtmById = new Map<string, {
      utmSource: string | null
      utmMedium: string | null
      utmCampaign: string | null
    }>()

    if (userIdsToResolve.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIdsToResolve } },
        select: { id: true, utmSource: true, utmMedium: true, utmCampaign: true },
      })
      for (const u of users) {
        if (u.utmSource) {
          userUtmById.set(u.id, {
            utmSource: u.utmSource,
            utmMedium: u.utmMedium,
            utmCampaign: u.utmCampaign,
          })
        }
      }
    }

    const resolveUtm = (event: typeof events[number]) => {
      if (event.utmSource) {
        return {
          source: event.utmSource,
          medium: event.utmMedium,
          campaign: event.utmCampaign,
        }
      }

      const fromUser = event.userId ? userUtmById.get(event.userId) : undefined
      if (fromUser) {
        return {
          source: fromUser.utmSource,
          medium: event.utmMedium || fromUser.utmMedium,
          campaign: event.utmCampaign || fromUser.utmCampaign,
        }
      }

      return {
        source: null,
        medium: event.utmMedium,
        campaign: event.utmCampaign,
      }
    }

    // Группируем по источникам
    const sourceStats: Record<string, {
      source: string
      medium: string
      campaign: string
      views: number
      registrations: number
      planSelects: number
      paymentStarts: number
      payments: number
      revenue: number
      serverCreates: number
      serverRenews: number
    }> = {}

    for (const event of events) {
      const utm = resolveUtm(event)

      // Фильтры применяем уже к восстановленным меткам
      if (source && (utm.source || 'direct') !== source) continue
      if (campaign && (utm.campaign || 'none') !== campaign) continue

      const key = `${utm.source || 'direct'}_${utm.medium || 'none'}_${utm.campaign || 'none'}`

      if (!sourceStats[key]) {
        sourceStats[key] = {
          source: utm.source || 'direct',
          medium: utm.medium || 'none',
          campaign: utm.campaign || 'none',
          views: 0,
          registrations: 0,
          planSelects: 0,
          paymentStarts: 0,
          payments: 0,
          revenue: 0,
          serverCreates: 0,
          serverRenews: 0,
        }
      }

      const stats = sourceStats[key]

      switch (event.eventType) {
        case 'VIEW':
          stats.views++
          break
        case 'REGISTRATION':
          stats.registrations++
          break
        case 'PLAN_SELECT':
          stats.planSelects++
          break
        case 'PAYMENT_START':
          stats.paymentStarts++
          break
        case 'PAYMENT_SUCCESS':
          stats.payments++
          if (event.amount) stats.revenue += event.amount
          break
        case 'SERVER_CREATE':
          stats.serverCreates++
          break
        case 'SERVER_RENEW':
          stats.serverRenews++
          break
      }
    }

    // Преобразуем в массив и добавляем вычисляемые метрики
    const analytics = Object.values(sourceStats).map(stats => ({
      ...stats,
      revenue: Number(stats.revenue.toFixed(2)),
      conversionRate: stats.views > 0
        ? Number(((stats.registrations / stats.views) * 100).toFixed(2))
        : 0,
      paymentRate: stats.registrations > 0
        ? Number(((stats.payments / stats.registrations) * 100).toFixed(2))
        : 0,
      avgRevenue: stats.payments > 0
        ? Number((stats.revenue / stats.payments).toFixed(2))
        : 0,
      totalValue: Number(stats.revenue.toFixed(2)),
    }))

    // Сортируем по выручке
    analytics.sort((a, b) => b.totalValue - a.totalValue)

    // Считаем общую статистику
    const totals = {
      views: analytics.reduce((sum, s) => sum + s.views, 0),
      registrations: analytics.reduce((sum, s) => sum + s.registrations, 0),
      payments: analytics.reduce((sum, s) => sum + s.payments, 0),
      revenue: Number(analytics.reduce((sum, s) => sum + s.totalValue, 0).toFixed(2)),
      serverCreates: analytics.reduce((sum, s) => sum + s.serverCreates, 0),
      serverRenews: analytics.reduce((sum, s) => sum + s.serverRenews, 0),
    }

    return NextResponse.json({
      analytics,
      totals,
      period: {
        start: startDate,
        end: endDate,
      },
    })
  } catch (error: any) {
    console.error('[API] Error fetching marketing analytics:', error)

    if (error?.code === 'P2021' || error?.code === 'P2022') {
      return NextResponse.json(
        {
          error: 'Таблица MarketingEvent отсутствует в базе. Выполните: npx prisma db push',
          code: error.code,
        },
        { status: 503 }
      )
    }

    if (error?.code === 'P1001' || error?.code === 'P1002') {
      return NextResponse.json(
        { error: 'Нет соединения с базой данных', code: error.code },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: error?.code,
        detail: process.env.NODE_ENV === 'production' ? undefined : String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

// DELETE - Удалить события по источнику
export async function DELETE(req: NextRequest) {
  let user
  try {
    user = await requireAuth(req)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'ADMIN' && user.role !== 'PR_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { source, medium, campaign } = body

    if (!source) {
      return NextResponse.json({ error: 'Источник обязателен' }, { status: 400 })
    }

    // Формируем условия для удаления
    const where: any = { utmSource: source }
    if (medium && medium !== 'none') where.utmMedium = medium
    if (campaign && campaign !== 'none') where.utmCampaign = campaign

    // Удаляем события
    const result = await prisma.marketingEvent.deleteMany({
      where
    })

    // Дополнительно удаляем события без меток, которые в аналитике относятся
    // к этому источнику по профилю пользователя (оплаты из вебхуков)
    const userWhere: any = { utmSource: source }
    if (medium && medium !== 'none') userWhere.utmMedium = medium
    if (campaign && campaign !== 'none') userWhere.utmCampaign = campaign

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    })

    let inheritedCount = 0
    if (users.length > 0) {
      const inherited = await prisma.marketingEvent.deleteMany({
        where: {
          utmSource: null,
          userId: { in: users.map(u => u.id) },
        },
      })
      inheritedCount = inherited.count
    }

    const total = result.count + inheritedCount

    return NextResponse.json({
      success: true,
      deleted: total,
      message: `Удалено ${total} событий`
    })
  } catch (error: any) {
    console.error('[API] Error deleting marketing events:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: process.env.NODE_ENV === 'production' ? undefined : String(error?.message || error),
      },
      { status: 500 }
    )
  }
}
