import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

// JWT_SECRET проверяется при использовании
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

export interface AuthPayload {
  userId: string
  email: string
  role: string
}

/**
 * Проверяет JWT токен и возвращает данные пользователя если он админ
 * @param request - NextRequest объект
 * @returns AuthPayload если пользователь админ, null в противном случае
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AuthPayload | null> {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    }) as unknown as AuthPayload

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, banned: true },
    })

    if (!user || user.banned || user.role !== 'ADMIN') {
      return null
    }

    return { userId: user.id, email: user.email, role: user.role }
  } catch {
    return null
  }
}

/**
 * Проверяет JWT токен и возвращает данные любого авторизованного пользователя
 * @param request - NextRequest объект
 * @returns AuthPayload если пользователь авторизован, null в противном случае
 */
export function verifyAuth(request: NextRequest): AuthPayload | null {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    }) as unknown as AuthPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Middleware функция для защиты админских API роутов
 * Возвращает NextResponse с ошибкой если пользователь не админ, null если всё ок
 * 
 * Использование:
 * ```
 * export async function GET(request: NextRequest) {
 *   const authError = requireAdminAuth(request)
 *   if (authError) return authError
 *   // ... остальной код
 * }
 * ```
 * 
 * @param request - NextRequest объект
 * @returns NextResponse с ошибкой 401/403 или null если авторизация успешна
 */
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const auth = await verifyAdminAuth(request)

  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin access required' },
      { status: 403 }
    )
  }

  return null // Если всё ок, возвращаем null
}

/**
 * Middleware функция для защиты API роутов (любой авторизованный пользователь)
 * Возвращает NextResponse с ошибкой если пользователь не авторизован, null если всё ок
 * 
 * @param request - NextRequest объект
 * @returns NextResponse с ошибкой 401 или null если авторизация успешна
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const auth = verifyAuth(request)

  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required' },
      { status: 401 }
    )
  }

  return null
}

/**
 * Получает данные админа из запроса или возвращает ошибку
 * Полезно когда нужно получить данные пользователя после проверки
 * 
 * @param request - NextRequest объект
 * @returns { auth: AuthPayload } | { error: NextResponse }
 */
export async function getAdminOrError(request: NextRequest): Promise<
  | { auth: AuthPayload; error: null }
  | { auth: null; error: NextResponse }
> {
  const auth = await verifyAdminAuth(request)

  if (!auth) {
    return {
      auth: null,
      error: NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }
  }

  return { auth, error: null }
}
