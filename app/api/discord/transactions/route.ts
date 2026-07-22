import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyInternalSecret } from '@/lib/internal-auth'

/**
 * API для Discord бота - получение транзакций пользователя
 */
export async function GET(request: NextRequest) {
  try {
    if (!verifyInternalSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const discordId = searchParams.get('discordId')
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // PENDING, COMPLETED, FAILED, CANCELLED

    if (!discordId && !email && !userId) {
      return NextResponse.json({ 
        error: 'Требуется один из параметров: discordId, email или userId' 
      }, { status: 400 })
    }

    // Находим пользователя
    const where: any = {}
    if (userId) {
      where.id = userId
    } else if (discordId) {
      where.discordId = discordId
    } else if (email) {
      where.email = email
    }

    const user = await prisma.user.findFirst({
      where,
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Пользователь не найден' 
      }, { status: 404 })
    }

    // Получаем транзакции
    const transactionWhere: any = { userId: user.id }
    if (status) {
      transactionWhere.status = status
    }

    const transactions = await prisma.transaction.findMany({
      where: transactionWhere,
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        description: true,
        externalId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50) // Максимум 50 транзакций за раз
    })

    return NextResponse.json({
      userId: user.id,
      transactions: transactions.map(t => ({
        id: t.id,
        amount: parseFloat(t.amount.toString()),
        type: t.type,
        status: t.status,
        description: t.description,
        externalId: t.externalId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })),
      total: transactions.length
    })

  } catch (error) {
    console.error('Error fetching transactions for Discord bot:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера' 
    }, { status: 500 })
  }
}
