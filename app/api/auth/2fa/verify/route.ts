import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  verifyTwoFactorToken,
  verifyBackupCode,
  removeUsedBackupCode,
} from '@/lib/two-factor'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

/**
 * POST /api/auth/2fa/verify
 * Проверяет 2FA код при логине
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, useBackupCode } = body

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email и код обязательны' },
        { status: 400 }
      )
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        banned: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    if (user.banned) {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован' },
        { status: 403 }
      )
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA не настроена для этого пользователя' },
        { status: 400 }
      )
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
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(updatedCodes) },
        })
      }
    } else {
      // Проверяем TOTP код
      isValid = verifyTwoFactorToken(user.twoFactorSecret, token)
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный код' },
        { status: 400 }
      )
    }

    // Создаем JWT токен
    const authToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    )

    // Создаем ответ с cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    return response
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json(
      { error: 'Ошибка проверки 2FA' },
      { status: 500 }
    )
  }
}
