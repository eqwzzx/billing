import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './db'
import { verifyTwoFactorToken, verifyBackupCode, removeUsedBackupCode } from './two-factor'

/**
 * Проверяет 2FA токен если у пользователя включена 2FA
 */
export async function verify2FAToken(
  userId: string,
  token?: string,
  useBackupCode?: boolean
): Promise<{ success: boolean; error?: string }> {
  // Получаем пользователя
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  })

  if (!user) {
    return { success: false, error: 'Пользователь не найден' }
  }

  // Если 2FA не включена, пропускаем проверку
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: true }
  }

  // Если 2FA включена, требуем токен
  if (!token) {
    return { success: false, error: 'Требуется код двухфакторной аутентификации' }
  }

  let isValid = false

  if (useBackupCode) {
    // Проверяем резервный код
    const backupCodes = user.twoFactorBackupCodes
      ? JSON.parse(user.twoFactorBackupCodes)
      : []

    isValid = verifyBackupCode(token, backupCodes)

    if (isValid) {
      // Удаляем использованный код
      const updatedCodes = removeUsedBackupCode(token, backupCodes)
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: JSON.stringify(updatedCodes) },
      })
    }
  } else {
    // Проверяем TOTP код
    isValid = verifyTwoFactorToken(user.twoFactorSecret, token)
  }

  if (!isValid) {
    return { success: false, error: 'Неверный код двухфакторной аутентификации' }
  }

  return { success: true }
}

/**
 * Middleware для проверки 2FA перед критическими операциями
 */
export async function require2FAVerification(
  userId: string,
  request: NextRequest
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const body = await request.json()
    const { twoFactorToken, useBackupCode } = body

    const result = await verify2FAToken(userId, twoFactorToken, useBackupCode)

    if (!result.success) {
      return { allowed: false, error: result.error }
    }

    return { allowed: true }
  } catch (error) {
    return { allowed: false, error: 'Ошибка проверки 2FA' }
  }
}

/**
 * Проверяет нужна ли 2FA для пользователя
 */
export async function requires2FA(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  })

  return user?.twoFactorEnabled || false
}
