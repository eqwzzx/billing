import { NextRequest, NextResponse } from 'next/server'
import { isAuthEnabled } from '@/lib/auth'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const enabled = await isAuthEnabled()

  // Проверяем заблокирован ли пользователь
  const user = await getAuthUser(request)
  if (user && user.id !== 'public' && user.banned) {
    return NextResponse.json(
      { error: 'Вы не можете выйти из аккаунта пока заблокированы' },
      { status: 403 }
    )
  }

  const response = NextResponse.json({
    success: true,
    authEnabled: enabled,
  })

  // Удаляем cookie полностью
  response.cookies.delete('auth-token')
  
  // Для совместимости также устанавливаем пустой cookie с истекшим сроком
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
