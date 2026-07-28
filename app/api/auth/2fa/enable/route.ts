import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { verifyTwoFactorToken } from '@/lib/two-factor'

/**
 * POST /api/auth/2fa/enable
 * Подтверждает и активирует 2FA
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Требуется код подтверждения' },
        { status: 400 }
      )
    }

    // Получаем пользователя с секретом
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    })

    if (!dbUser?.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Сначала необходимо выполнить настройку 2FA' },
        { status: 400 }
      )
    }

    if (dbUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Двухфакторная аутентификация уже включена' },
        { status: 400 }
      )
    }

    // Проверяем код
    const isValid = verifyTwoFactorToken(dbUser.twoFactorSecret, token)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный код подтверждения' },
        { status: 400 }
      )
    }

    // Активируем 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Двухфакторная аутентификация успешно включена',
    })
  } catch (error) {
    console.error('2FA enable error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка активации 2FA' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
