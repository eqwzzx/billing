import { cookies } from 'next/headers'
import { prisma } from './db'

const UTM_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 дней
const SESSION_COOKIE_MAX_AGE = 24 * 60 * 60 // 24 часа

export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  ref?: string // Реферальный код
}

/**
 * Сохраняет UTM метки в cookies
 */
export function saveUTMToCookies(params: UTMParams) {
  const cookieStore = cookies()
  
  if (params.utm_source) {
    cookieStore.set('utm_source', params.utm_source, {
      maxAge: UTM_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }
  
  if (params.utm_medium) {
    cookieStore.set('utm_medium', params.utm_medium, {
      maxAge: UTM_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }
  
  if (params.utm_campaign) {
    cookieStore.set('utm_campaign', params.utm_campaign, {
      maxAge: UTM_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }
  
  if (params.utm_content) {
    cookieStore.set('utm_content', params.utm_content, {
      maxAge: UTM_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }
  
  if (params.utm_term) {
    cookieStore.set('utm_term', params.utm_term, {
      maxAge: UTM_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }
  
  if (params.ref) {
    cookieStore.set('ref_code', params.ref, {
      maxAge: UTM_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }
}

/**
 * Получает UTM метки из cookies
 */
export function getUTMFromCookies(): UTMParams {
  const cookieStore = cookies()
  
  return {
    utm_source: cookieStore.get('utm_source')?.value,
    utm_medium: cookieStore.get('utm_medium')?.value,
    utm_campaign: cookieStore.get('utm_campaign')?.value,
    utm_content: cookieStore.get('utm_content')?.value,
    utm_term: cookieStore.get('utm_term')?.value,
    ref: cookieStore.get('ref_code')?.value,
  }
}

/**
 * Получает или создаёт session ID
 */
export function getOrCreateSessionId(): string {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('session_id')?.value
  
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    cookieStore.set('session_id', sessionId, {
      maxAge: SESSION_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }
  
  return sessionId
}

/**
 * Логирует маркетинговое событие
 */
export async function trackMarketingEvent(params: {
  eventType: 'VIEW' | 'REGISTRATION' | 'PLAN_SELECT' | 'PAYMENT_START' | 'PAYMENT_SUCCESS' | 'SERVER_CREATE' | 'SERVER_RENEW'
  userId?: string
  amount?: number
  planId?: string
  serverId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  try {
    const utmParams = getUTMFromCookies()
    const sessionId = getOrCreateSessionId()
    
    await prisma.marketingEvent.create({
      data: {
        eventType: params.eventType,
        userId: params.userId,
        sessionId,
        utmSource: utmParams.utm_source,
        utmMedium: utmParams.utm_medium,
        utmCampaign: utmParams.utm_campaign,
        utmContent: utmParams.utm_content,
        utmTerm: utmParams.utm_term,
        referralCode: utmParams.ref,
        amount: params.amount,
        planId: params.planId,
        serverId: params.serverId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
    
    console.log(`[Marketing] Event tracked: ${params.eventType}`, {
      userId: params.userId,
      campaign: utmParams.utm_campaign,
    })
  } catch (error) {
    console.error('[Marketing] Error tracking event:', error)
  }
}

/**
 * Получает настройки скидки первого заказа
 */
export async function getFirstOrderDiscount() {
  try {
    const discount = await prisma.firstOrderDiscount.findFirst()
    return discount || { isEnabled: false, discountPercent: 0 }
  } catch (error) {
    console.error('[Marketing] Error fetching first order discount:', error)
    return { isEnabled: false, discountPercent: 0 }
  }
}

/**
 * Применяет скидку первого заказа к цене
 */
export async function applyFirstOrderDiscount(userId: string, originalPrice: number): Promise<{
  finalPrice: number
  discountAmount: number
  discountPercent: number
  applied: boolean
}> {
  try {
    // Проверяем право пользователя на скидку
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstOrderDiscount: true },
    })
    
    if (!user || !user.firstOrderDiscount) {
      return {
        finalPrice: originalPrice,
        discountAmount: 0,
        discountPercent: 0,
        applied: false,
      }
    }
    
    // Получаем настройки скидки
    const discountSettings = await getFirstOrderDiscount()
    
    if (!discountSettings.isEnabled) {
      return {
        finalPrice: originalPrice,
        discountAmount: 0,
        discountPercent: 0,
        applied: false,
      }
    }
    
    const discountAmount = (originalPrice * discountSettings.discountPercent) / 100
    const finalPrice = originalPrice - discountAmount
    
    return {
      finalPrice: Math.max(0, finalPrice),
      discountAmount,
      discountPercent: discountSettings.discountPercent,
      applied: true,
    }
  } catch (error) {
    console.error('[Marketing] Error applying first order discount:', error)
    return {
      finalPrice: originalPrice,
      discountAmount: 0,
      discountPercent: 0,
      applied: false,
    }
  }
}

/**
 * Помечает что пользователь использовал скидку первого заказа
 */
export async function markFirstOrderDiscountUsed(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { firstOrderDiscount: false },
    })
    console.log(`[Marketing] First order discount marked as used for user: ${userId}`)
  } catch (error) {
    console.error('[Marketing] Error marking discount as used:', error)
  }
}

/**
 * Сохраняет UTM данные в профиль пользователя при регистрации
 */
export async function saveUTMToUser(userId: string) {
  try {
    const utmParams = getUTMFromCookies()
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        utmSource: utmParams.utm_source,
        utmMedium: utmParams.utm_medium,
        utmCampaign: utmParams.utm_campaign,
        utmContent: utmParams.utm_content,
        utmTerm: utmParams.utm_term,
        referralLinkId: utmParams.ref,
      },
    })
    
    console.log(`[Marketing] UTM data saved to user: ${userId}`, utmParams)
  } catch (error) {
    console.error('[Marketing] Error saving UTM to user:', error)
  }
}

/**
 * Получает статистику по источникам трафика
 */
export async function getMarketingAnalytics(params?: {
  startDate?: Date
  endDate?: Date
  utmSource?: string
  utmCampaign?: string
}) {
  try {
    const where: any = {}
    
    if (params?.startDate || params?.endDate) {
      where.createdAt = {}
      if (params.startDate) where.createdAt.gte = params.startDate
      if (params.endDate) where.createdAt.lte = params.endDate
    }
    
    if (params?.utmSource) {
      where.utmSource = params.utmSource
    }
    
    if (params?.utmCampaign) {
      where.utmCampaign = params.utmCampaign
    }
    
    // Получаем все события
    const events = await prisma.marketingEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    // Группируем по источникам
    const sourceStats: Record<string, {
      views: number
      registrations: number
      planSelects: number
      payments: number
      revenue: number
      serverCreates: number
      serverRenews: number
    }> = {}
    
    for (const event of events) {
      const source = event.utmSource || event.referralCode || 'direct'
      
      if (!sourceStats[source]) {
        sourceStats[source] = {
          views: 0,
          registrations: 0,
          planSelects: 0,
          payments: 0,
          revenue: 0,
          serverCreates: 0,
          serverRenews: 0,
        }
      }
      
      const stats = sourceStats[source]
      
      switch (event.eventType) {
        case 'VIEW':
          stats.views++
          break
        case 'REGISTRATION':
          stats.registrations++
          break
        case 'PLAN_SELECT':
          stats.planSelects++
          break
        case 'PAYMENT_SUCCESS':
          stats.payments++
          if (event.amount) stats.revenue += event.amount
          break
        case 'SERVER_CREATE':
          stats.serverCreates++
          break
        case 'SERVER_RENEW':
          stats.serverRenews++
          break
      }
    }
    
    return Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      ...stats,
      conversionRate: stats.views > 0 ? ((stats.registrations / stats.views) * 100).toFixed(2) : '0.00',
      avgRevenue: stats.payments > 0 ? (stats.revenue / stats.payments).toFixed(2) : '0.00',
    }))
  } catch (error) {
    console.error('[Marketing] Error getting analytics:', error)
    return []
  }
}
