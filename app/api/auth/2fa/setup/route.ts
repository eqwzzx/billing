import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  generateTwoFactorSetup,
  hashBackupCodes,
} from '@/lib/two-factor'

/**
 * POST /api/auth/2fa/setup
 * Инициализирует настройку 2FA для пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Проверяем, не включена ли уже 2FA
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    })

    if (dbUser?.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Двухфакторная аутентификация уже включена' },
        { status: 400 }
      )
    }

    // Генерируем секрет и QR код
    const setup = await generateTwoFactorSetup(user.email)

    // Хешируем backup коды перед сохранением
    const hashedBackupCodes = hashBackupCodes(setup.backupCodes)

    // Сохраняем секрет (но не активируем 2FA до подтверждения)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: setup.secret,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
        twoFactorEnabled: false, // Активируем только после подтверждения
      },
    })

    return NextResponse.json({
      success: true,
      qrCode: setup.qrCodeUrl,
      secret: setup.secret,
      backupCodes: setup.backupCodes, // Отправляем оригинальные коды пользователю
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка настройки 2FA' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
