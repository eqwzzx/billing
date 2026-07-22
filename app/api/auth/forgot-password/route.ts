import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    // Проверяем существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Всегда возвращаем успех для безопасности
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Генерируем токен
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 час

    // Сохраняем токен
    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        token,
        expiresAt: expires,
      },
      update: {
        token,
        expiresAt: expires,
      },
    })

    // Отправляем письмо с использованием централизованной функции
    try {
      await sendPasswordResetEmail(email, token)
    } catch (emailError) {
      console.error('[Forgot Password] Email error:', emailError)
      // Продолжаем, возвращаем успех для безопасности
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ success: true }) // Всегда успех для безопасности
  }
}
