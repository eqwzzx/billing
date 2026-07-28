import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { verifyTwoFactorToken } from '@/lib/two-factor'

/**
 * POST /api/auth/2fa/disable
 * Отключает 2FA
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Требуется код подтверждения для отключения 2FA' },
        { status: 400 }
      )
    }

    // Получаем пользователя
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    })

    if (!dbUser?.twoFactorEnabled || !dbUser.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Двухфакторная аутентификация не включена' },
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

    // Отключаем 2FA и удаляем секреты
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Двухфакторная аутентификация отключена',
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка отключения 2FA' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
