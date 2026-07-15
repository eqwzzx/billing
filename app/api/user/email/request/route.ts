import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { validateEmail } from '@/lib/security'
import { generateVerificationCode, sendVerificationCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const { newEmail } = body

    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json({ error: 'Новый email обязателен' }, { status: 400 })
    }

    const normalizedEmail = newEmail.toLowerCase().trim()

    // Валидация
    if (normalizedEmail.includes('+')) {
      return NextResponse.json({ error: 'Email не может содержать символ "+"' }, { status: 400 })
    }

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Некорректный формат email' }, { status: 400 })
    }

    // Проверка что email свободен
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Этот email уже используется' }, { status: 400 })
    }

    // Получаем текущего пользователя
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (currentUser.email === normalizedEmail) {
      return NextResponse.json({ error: 'Это ваш текущий email' }, { status: 400 })
    }

    // Генерируем код подтверждения
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 минут

    // Удаляем старые запросы
    await prisma.emailChangeRequest.deleteMany({
      where: { userId: user.id }
    })

    // Создаем новый запрос
    await prisma.emailChangeRequest.create({
      data: {
        userId: user.id,
        newEmail: normalizedEmail,
        code,
        expiresAt,
      }
    })

    // Отправляем код на НОВЫЙ email
    const sent = await sendVerificationCode(normalizedEmail, code)

    if (!sent) {
      await prisma.emailChangeRequest.deleteMany({
        where: { userId: user.id }
      })
      return NextResponse.json({ 
        error: 'Ошибка отправки кода. Проверьте email и попробуйте позже.' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Код подтверждения отправлен на новый email'
    })
  } catch (error) {
    console.error('[Request Email Change] Error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
