/**
 * API для апелляций на блокировку
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { notifyAdminsAboutAppeal } from '@/lib/ban-notifications'

// POST - создать апелляцию
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Причина апелляции должна содержать минимум 10 символов' },
        { status: 400 }
      )
    }

    // Проверяем что пользователь заблокирован
    if (!user.banned) {
      return NextResponse.json(
        { error: 'Вы не заблокированы' },
        { status: 400 }
      )
    }

    // Проверяем нет ли активных апелляций
    const existingAppeal = await prisma.banAppeal.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
    })

    if (existingAppeal) {
      return NextResponse.json(
        { error: 'У вас уже есть активная апелляция' },
        { status: 400 }
      )
    }

    // Находим активную блокировку
    const activeBan = await prisma.banHistory.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    // Создаём апелляцию
    const appeal = await prisma.banAppeal.create({
      data: {
        userId: user.id,
        banHistoryId: activeBan?.id,
        reason: reason.trim(),
        status: 'PENDING',
      },
    })

    // Уведомляем админов
    await notifyAdminsAboutAppeal({
      userId: user.id,
      appealId: appeal.id,
      reason: reason.trim(),
    })

    return NextResponse.json({
      success: true,
      appeal: {
        id: appeal.id,
        reason: appeal.reason,
        status: appeal.status,
        createdAt: appeal.createdAt,
      },
    })
  } catch (error) {
    console.error('[Create Appeal] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create appeal' },
      { status: 500 }
    )
  }
}

// GET - получить свои апелляции
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const appeals = await prisma.banAppeal.findMany({
      where: {
        userId: user.id,
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
