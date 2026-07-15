import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Код обязателен' }, { status: 400 })
    }

    // Находим запрос на смену email
    const changeRequest = await prisma.emailChangeRequest.findFirst({
      where: {
        userId: user.id,
        code: code.toUpperCase().trim(),
      }
    })

    if (!changeRequest) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 })
    }

    // Проверяем не истек ли код
    if (new Date() > changeRequest.expiresAt) {
      await prisma.emailChangeRequest.delete({
        where: { id: changeRequest.id }
      })
      return NextResponse.json({ error: 'Код истек. Запросите новый.' }, { status: 400 })
    }

    // Проверяем что email все еще свободен
    const existingUser = await prisma.user.findUnique({
      where: { email: changeRequest.newEmail }
    })

    if (existingUser) {
      await prisma.emailChangeRequest.delete({
        where: { id: changeRequest.id }
      })
      return NextResponse.json({ error: 'Этот email уже занят' }, { status: 400 })
    }

    // Получаем старый email для логов
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true }
    })

    // Обновляем email
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        email: changeRequest.newEmail,
        emailVerified: true, // Верифицируем новый email
      }
    })

    // Удаляем запрос
    await prisma.emailChangeRequest.delete({
      where: { id: changeRequest.id }
    })

    // Логируем изменение
    console.log(`[Email Changed] User ${user.id}: ${currentUser?.email} -> ${changeRequest.newEmail}`)

    return NextResponse.json({ 
      success: true,
      newEmail: changeRequest.newEmail,
      message: 'Email успешно изменен'
    })
  } catch (error) {
    console.error('[Confirm Email Change] Error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
