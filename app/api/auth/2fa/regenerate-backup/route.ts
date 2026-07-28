import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  generateBackupCodes,
  hashBackupCodes,
  verifyTwoFactorToken,
} from '@/lib/two-factor'

/**
 * POST /api/auth/2fa/regenerate-backup
 * Генерирует новые резервные коды
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

    // Генерируем новые backup коды
    const newBackupCodes = generateBackupCodes()
    const hashedBackupCodes = hashBackupCodes(newBackupCodes)

    // Сохраняем новые коды
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      },
    })

    return NextResponse.json({
      success: true,
      backupCodes: newBackupCodes,
      message: 'Резервные коды успешно обновлены',
    })
  } catch (error) {
    console.error('2FA regenerate backup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка генерации резервных кодов' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
