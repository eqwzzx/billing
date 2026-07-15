import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateEmail } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ available: false, error: 'Email обязателен' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Запрет на использование "+" в email
    if (normalizedEmail.includes('+')) {
      return NextResponse.json({ 
        available: false, 
        error: 'Email не может содержать символ "+"' 
      }, { status: 400 })
    }

    // Валидация формата
    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Некорректный формат email' 
      }, { status: 400 })
    }

    // Проверка существования
    const existingUser = await prisma.user.findUnique({ 
      where: { email: normalizedEmail },
      select: { id: true }
    })

    if (existingUser) {
      return NextResponse.json({ 
        available: false, 
        error: 'Email уже занят' 
      })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('[Check Email] Error:', error)
    return NextResponse.json({ available: false, error: 'Ошибка сервера' }, { status: 500 })
  }
}
