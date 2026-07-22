import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyInternalSecret } from '@/lib/internal-auth'

/**
 * API для Discord бота - получение списка серверов пользователя
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

    // Получаем серверы пользователя
    const servers = await prisma.server.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        pterodactylId: true,
        expiresAt: true,
        createdAt: true,
        plan: {
          select: {
            name: true,
            category: true,
            ram: true,
            cpu: true,
            disk: true,
            price: true
          }
        },
        node: {
          select: {
            name: true,
            locationName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      userId: user.id,
      servers: servers.map(server => ({
        id: server.id,
        name: server.name,
        status: server.status,
        pterodactylId: server.pterodactylId,
        expiresAt: server.expiresAt,
        createdAt: server.createdAt,
        plan: server.plan,
        node: server.node
      })),
      total: servers.length
    })

  } catch (error) {
    console.error('Error fetching servers for Discord bot:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера' 
    }, { status: 500 })
  }
}
