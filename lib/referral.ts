import { cookies } from 'next/headers'
import { prisma } from './db'

const REFERRAL_COOKIE_NAME = 'ref_code'
const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 дней

/**
 * Сохраняет реферальный код в cookies
 */
export function setReferralCode(code: string) {
  try {
    const cookieStore = cookies()
    cookieStore.set(REFERRAL_COOKIE_NAME, code, {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    return true
  } catch (error) {
    console.error('[Referral] Error setting cookie:', error)
    return false
  }
}

/**
 * Получает реферальный код из cookies
 */
export function getReferralCode(): string | null {
  try {
    const cookieStore = cookies()
    const cookie = cookieStore.get(REFERRAL_COOKIE_NAME)
    return cookie?.value || null
  } catch (error) {
    console.error('[Referral] Error getting cookie:', error)
    return null
  }
}

/**
 * Удаляет реферальный код из cookies
 */
export function clearReferralCode() {
  try {
    const cookieStore = cookies()
    cookieStore.delete(REFERRAL_COOKIE_NAME)
    return true
  } catch (error) {
    console.error('[Referral] Error clearing cookie:', error)
    return false
  }
}

/**
 * Проверяет валидность реферального кода
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean
  linkId?: string
  error?: string
}> {
  try {
    const link = await prisma.referralLink.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!link) {
      return { valid: false, error: 'Реферальная ссылка не найдена' }
    }

    if (!link.isActive) {
      return { valid: false, error: 'Реферальная ссылка неактивна' }
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { valid: false, error: 'Срок действия реферальной ссылки истёк' }
    }

    return { valid: true, linkId: link.id }
  } catch (error) {
    console.error('[Referral] Error validating code:', error)
    return { valid: false, error: 'Ошибка проверки реферального кода' }
  }
}

/**
 * Увеличивает счётчик просмотров реферальной ссылки
 */
export async function incrementReferralViews(code: string): Promise<boolean> {
  try {
    await prisma.referralLink.update({
      where: { code: code.toUpperCase() },
      data: { views: { increment: 1 } },
    })
    return true
  } catch (error) {
    console.error('[Referral] Error incrementing views:', error)
    return false
  }
}
