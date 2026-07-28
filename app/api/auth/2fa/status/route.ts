import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/auth/2fa/status
 * Проверяет статус 2FA для текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const backupCodes = dbUser.twoFactorBackupCodes
      ? JSON.parse(dbUser.twoFactorBackupCodes)
      : []

    return NextResponse.json({
      enabled: dbUser.twoFactorEnabled,
      backupCodesCount: backupCodes.length,
    })
  } catch (error) {
    console.error('2FA status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка получения статуса 2FA' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
