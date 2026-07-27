/**
 * API для управления апелляциями (админ)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth } from '@/lib/auth-admin'
import { adminLogger } from '@/lib/admin-logger'
import { sendAppealResultNotification, sendUnbanNotification } from '@/lib/ban-notifications'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// GET - получить все апелляции
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status
    }

    const appeals = await prisma.banAppeal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            banned: true,
            banType: true,
            banReason: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ appeals })
  } catch (error) {
    console.error('[Get Appeals] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get appeals' },
      { status: 500 }
    )
  }
}

// PATCH - обработать апелляцию
export async function PATCH(request: NextRequest) {
  const authError = await requireAdminAuth(request)
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
    const { appealId, status, reviewNote, unbanUser } = body

    if (!appealId || !status) {
      return NextResponse.json(
        { error: 'appealId и status обязательны' },
        { status: 400 }
      )
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'status должен быть APPROVED или REJECTED' },
        { status: 400 }
      )
    }

    // Находим апелляцию
    const appeal = await prisma.banAppeal.findUnique({
      where: { id: appealId },
      include: {
        user: true,
      },
    })

    if (!appeal) {
      return NextResponse.json({ error: 'Апелляция не найдена' }, { status: 404 })
    }

    if (appeal.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Апелляция уже обработана' },
        { status: 400 }
      )
    }

    // Обновляем апелляцию
    const updatedAppeal = await prisma.banAppeal.update({
      where: { id: appealId },
      data: {
        status: status,
        reviewedBy: adminId,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
      },
    })

    // Если апелляция одобрена И выбрано разблокировать пользователя
    if (status === 'APPROVED' && unbanUser && appeal.user.banned) {
      await prisma.user.update({
        where: { id: appeal.userId },
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
          userId: appeal.userId,
          isActive: true,
        },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      })

      // Отправляем уведомление о разблокировке
      await sendUnbanNotification({
        userId: appeal.userId,
        reason: 'Апелляция одобрена',
        adminName: adminName,
      })

      await adminLogger.log({
        action: 'USER_UNBAN',
        userId: appeal.userId,
        adminId: adminId,
        description: `Пользователь разблокирован по апелляции ${appealId}`,
      })
    }

    // Отправляем уведомление о результате апелляции
    await sendAppealResultNotification({
      userId: appeal.userId,
      appealId: appeal.id,
      status: status,
      reviewNote: reviewNote,
      adminName: adminName,
    })

    // Логирование
    await adminLogger.log({
      action: status === 'APPROVED' ? 'USER_BAN_APPEAL_ACCEPT' : 'USER_BAN_APPEAL_REJECT',
      userId: appeal.userId,
      adminId: adminId,
      description: `Апелляция ${status === 'APPROVED' ? 'одобрена' : 'отклонена'}: ${appealId}`,
      metadata: JSON.stringify({
        appealId,
        reviewNote,
        unbanUser,
      }),
    })

    return NextResponse.json({
      success: true,
      appeal: updatedAppeal,
      userUnbanned: status === 'APPROVED' && unbanUser,
    })
  } catch (error) {
    console.error('[Process Appeal] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process appeal' },
      { status: 500 }
    )
  }
}
