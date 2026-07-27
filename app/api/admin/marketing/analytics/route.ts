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
    
    if (source) where.utmSource = source
    if (campaign) where.utmCampaign = campaign

    // Получаем все события
    const events = await prisma.marketingEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Ограничение для производительности
    })

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
      const key = `${event.utmSource || 'direct'}_${event.utmMedium || 'none'}_${event.utmCampaign || 'none'}`
      
      if (!sourceStats[key]) {
        sourceStats[key] = {
          source: event.utmSource || 'direct',
          medium: event.utmMedium || 'none',
          campaign: event.utmCampaign || 'none',
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
      revenue: analytics.reduce((sum, s) => sum + s.totalValue, 0),
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
    const where: any = {}
    
    if (source) where.utmSource = source
    if (medium && medium !== 'none') where.utmMedium = medium
    if (campaign && campaign !== 'none') where.utmCampaign = campaign

    // Удаляем события
    const result = await prisma.marketingEvent.deleteMany({
      where
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Удалено ${result.count} событий`
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
