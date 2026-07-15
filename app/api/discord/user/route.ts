import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * API для Discord бота - получение информации о пользователе
 * Можно искать по: discordId, email, username
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию (секретный ключ от Discord бота)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.INTERNAL_WEBHOOK_SECRET || 'fluxor-internal-webhook'}`
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const discordId = searchParams.get('discordId')
    const email = searchParams.get('email')
    const username = searchParams.get('username')

    if (!discordId && !email && !username) {
      return NextResponse.json({ 
        error: 'Требуется один из параметров: discordId, email или username' 
      }, { status: 400 })
    }

    // Строим условие поиска
    const where: any = {}
    if (discordId) {
      where.discordId = discordId
    } else if (email) {
      where.email = email
    } else if (username) {
      where.discordUsername = username
    }

    // Ищем пользователя
    const user = await prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        emailVerified: true,
        discordId: true,
        discordUsername: true,
        discordAvatar: true,
        role: true,
        banned: true,
        banType: true,
        banReason: true,
        bannedAt: true,
        banExpiresAt: true,
        createdAt: true,
        _count: {
          select: {
            servers: true,
            transactions: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Пользователь не найден' 
      }, { status: 404 })
    }

    // Получаем статистику транзакций
    const transactionsStats = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      },
      _count: true
    })

    // Получаем статистику серверов
    const serversStats = await prisma.server.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: true
    })

    const serversByStatus = serversStats.reduce((acc: any, stat) => {
      acc[stat.status] = stat._count
      return acc
    }, {})

    // Формируем ответ
    const response = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: parseFloat(user.balance.toString()),
        emailVerified: user.emailVerified,
        discord: {
          id: user.discordId,
          username: user.discordUsername,
          avatar: user.discordAvatar
        },
        role: user.role,
        ban: user.banned ? {
          banned: true,
          type: user.banType,
          reason: user.banReason,
          bannedAt: user.bannedAt,
          expiresAt: user.banExpiresAt
        } : {
          banned: false
        },
        createdAt: user.createdAt
      },
      stats: {
        transactions: {
          total: transactionsStats._count,
          totalAmount: parseFloat(transactionsStats._sum.amount?.toString() || '0')
        },
        servers: {
          total: user._count.servers,
          byStatus: serversByStatus
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching user for Discord bot:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера' 
    }, { status: 500 })
  }
}
