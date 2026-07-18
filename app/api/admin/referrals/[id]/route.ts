import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - получить детальную информацию о реферальной ссылке
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Авторизация с правильной обработкой ошибок
    let user
    try {
      user = await requireAuth(req)
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PR_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Only ADMIN or PR_MANAGER can access referral link details' }, { status: 403 })
    }

    const { id } = params

    const link = await prisma.referralLink.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            // Получаем информацию о пользователе
          },
          orderBy: { registeredAt: 'desc' },
        },
      },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Получаем полную информацию о пользователях
    const userIds = link.registrations.map(r => r.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            servers: true,
          },
        },
      },
    })

    // Создаем map для быстрого доступа к данным пользователей
    const usersMap = new Map(users.map(u => [u.id, u]))

    // Обогащаем данные регистраций информацией о пользователях
    const enrichedRegistrations = link.registrations.map(reg => {
      const userData = usersMap.get(reg.userId)
      return {
        id: reg.id,
        userId: reg.userId,
        hasDeposited: reg.hasDeposited,
        totalDeposits: reg.totalDeposits,
        registeredAt: reg.registeredAt,
        firstDepositAt: reg.firstDepositAt,
        ipAddress: reg.ipAddress,
        user: userData ? {
          email: userData.email,
          name: userData.name,
          balance: userData.balance,
          createdAt: userData.createdAt,
          transactionsCount: userData._count.transactions,
          serversCount: userData._count.servers,
        } : null,
      }
    })

    // Подсчитываем общую статистику
    const stats = {
      views: link.views,
      registrations: link.registrations.length,
      deposits: link.registrations.filter(r => r.hasDeposited).length,
      totalRevenue: link.registrations.reduce((sum, r) => sum + r.totalDeposits, 0),
      conversionRate: link.views > 0 ? ((link.registrations.length / link.views) * 100).toFixed(2) : '0.00',
      depositRate: link.registrations.length > 0 ? ((link.registrations.filter(r => r.hasDeposited).length / link.registrations.length) * 100).toFixed(2) : '0.00',
      averageDeposit: link.registrations.filter(r => r.hasDeposited).length > 0 
        ? (link.registrations.reduce((sum, r) => sum + r.totalDeposits, 0) / link.registrations.filter(r => r.hasDeposited).length).toFixed(2)
        : '0.00',
    }

    return NextResponse.json({
      id: link.id,
      code: link.code,
      name: link.name,
      url: link.url,
      isActive: link.isActive,
      expiresAt: link.expiresAt,
      createdBy: link.createdBy,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      stats,
      registrations: enrichedRegistrations,
    })
  } catch (error) {
    console.error('[API] Error fetching referral link details:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
