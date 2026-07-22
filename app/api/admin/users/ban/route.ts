/**
 * API для блокировки/разблокировки пользователей
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth } from '@/lib/auth-admin'
import { adminLogger } from '@/lib/admin-logger'
import { sendBanNotification, sendUnbanNotification } from '@/lib/ban-notifications'
import { suspendServer, getPterodactylUser } from '@/lib/pterodactyl'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// POST - заблокировать пользователя
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    // Получаем ID админа
    const token = request.cookies.get('auth-token')?.value
    let adminId = 'unknown'
    let adminName = 'Администратор'
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        adminId = decoded.userId
        const admin = await prisma.user.findUnique({
          where: { id: adminId },
          select: { name: true, email: true }
        })
        if (admin) {
          adminName = admin.name || admin.email
        }
      } catch {}
    }

    const body = await request.json()
    const { userId, email, discordId, banType, reason, expiresAt } = body

    if (!banType || !reason) {
      return NextResponse.json(
        { error: 'banType и reason обязательны' },
        { status: 400 }
      )
    }

    if (!userId && !email && !discordId) {
      return NextResponse.json(
        { error: 'Необходимо указать userId, email или discordId' },
        { status: 400 }
      )
    }

    // Находим пользователя по userId, email или discordId
    let whereClause: any = {}
    if (userId) {
      whereClause.id = userId
    } else if (email) {
      whereClause.email = email
    } else if (discordId) {
      whereClause.discordId = discordId
    }

    // Проверяем что пользователь существует
    const user = await prisma.user.findUnique({
      where: whereClause,
      include: {
        servers: {
          where: {
            status: { notIn: ['DELETED', 'SUSPENDED'] }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Нельзя заблокировать администратора' },
        { status: 403 }
      )
    }

    // Блокируем все активные серверы в Pterodactyl
    let suspendedServersCount = 0
    for (const server of user.servers) {
      if (server.pterodactylId) {
        try {
          await suspendServer(server.pterodactylId)
          await prisma.server.update({
            where: { id: server.id },
            data: { status: 'SUSPENDED' }
          })
          suspendedServersCount++
          console.log(`[Ban] Suspended Pterodactyl server: ${server.pterodactylId}`)
        } catch (error) {
          console.error(`[Ban] Failed to suspend server ${server.pterodactylId}:`, error)
        }
      }
    }

    // Блокируем пользователя в Pterodactyl (если есть аккаунт)
    if (user.pterodactylId) {
      try {
        // В Pterodactyl нет прямого API для блокировки пользователя
        // Но мы можем удалить все его роли или использовать другие методы
        console.log(`[Ban] User has Pterodactyl account: ${user.pterodactylId}`)
      } catch (error) {
        console.error('[Ban] Failed to process Pterodactyl user:', error)
      }
    }

    // Обновляем пользователя
    const bannedAt = new Date()
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        banned: true,
        banType: banType,
        banReason: reason,
        bannedAt: bannedAt,
        bannedBy: adminId,
        banExpiresAt: expiresAt ? new Date(expiresAt) : null,
        banCount: { increment: 1 },
      },
    })

    // Создаём запись в истории банов
    const banHistory = await prisma.banHistory.create({
      data: {
        userId: user.id,
        adminId: adminId,
        banType: banType,
        targetType: 'account',
        reason: reason,
        startedAt: bannedAt,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    })

    // Логирование
    await adminLogger.log({
      action: 'USER_BAN',
      userId: user.id,
      adminId: adminId,
      description: `Пользователь заблокирован: ${banType}. Причина: ${reason}`,
      metadata: JSON.stringify({
        banType,
        reason,
        expiresAt,
        suspendedServersCount,
      }),
    })

    // Отправляем уведомление в Discord
    await sendBanNotification({
      userId: user.id,
      banType: banType,
      reason: reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      adminName: adminName,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        banned: updatedUser.banned,
        banType: updatedUser.banType,
        banReason: updatedUser.banReason,
        bannedAt: updatedUser.bannedAt,
        banExpiresAt: updatedUser.banExpiresAt,
      },
      banHistory: banHistory,
      suspendedServersCount,
    })
  } catch (error) {
    console.error('[Ban User] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to ban user' },
      { status: 500 }
    )
  }
}

// DELETE - разблокировать пользователя
export async function DELETE(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    // Получаем ID админа
    const token = request.cookies.get('auth-token')?.value
    let adminId = 'unknown'
    let adminName = 'Администратор'
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        adminId = decoded.userId
        const admin = await prisma.user.findUnique({
          where: { id: adminId },
          select: { name: true, email: true }
        })
        if (admin) {
          adminName = admin.name || admin.email
        }
      } catch {}
    }

    const body = await request.json()
    const { userId, email, discordId, reason } = body

    if (!userId && !email && !discordId) {
      return NextResponse.json(
        { error: 'Необходимо указать userId, email или discordId' },
        { status: 400 }
      )
    }

    // Находим пользователя
    let whereClause: any = {}
    if (userId) {
      whereClause.id = userId
    } else if (email) {
      whereClause.email = email
    } else if (discordId) {
      whereClause.discordId = discordId
    }

    const user = await prisma.user.findUnique({
      where: whereClause,
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (!user.banned) {
      return NextResponse.json(
        { error: 'Пользователь не заблокирован' },
        { status: 400 }
      )
    }

    // Разблокируем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        banned: false,
        banType: 'NONE',
        banReason: null,
        bannedAt: null,
        bannedBy: null,
        banExpiresAt: null,
      },
    })

    // Обновляем историю банов
    await prisma.banHistory.updateMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    })

    // Логирование
    await adminLogger.log({
      action: 'USER_UNBAN',
      userId: user.id,
      adminId: adminId,
      description: `Пользователь разблокирован. Причина: ${reason || 'Не указана'}`,
    })

    // Отправляем уведомление
    await sendUnbanNotification({
      userId: user.id,
      reason: reason || 'Блокировка снята администратором',
      adminName: adminName,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        banned: updatedUser.banned,
      },
    })
  } catch (error) {
    console.error('[Unban User] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unban user' },
      { status: 500 }
    )
  }
}
