import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

const UTM_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 дней

interface UTMParams {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
}

/**
 * POST - Сохранить UTM параметры в cookies и залогировать VIEW событие
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as UTMParams
    
    const cookieStore = await cookies()
    
    // Создаём уникальный ключ для этой UTM комбинации
    const utmKey = `${body.utm_source || 'none'}_${body.utm_medium || 'none'}_${body.utm_campaign || 'none'}`
    const viewCookieName = `utm_view_${utmKey}`
    
    // Проверяем, не было ли уже VIEW события для этой UTM комбинации
    const existingView = cookieStore.get(viewCookieName)?.value
    
    if (existingView) {
      // VIEW событие уже было записано для этой UTM комбинации
      console.log('[UTM] VIEW already tracked for this UTM combination:', utmKey)
      return NextResponse.json({ 
        success: true,
        message: 'UTM parameters already tracked (duplicate prevented)',
        duplicate: true,
      })
    }
    
    // Сохраняем UTM параметры в cookies
    if (body.utm_source) {
      cookieStore.set('utm_source', body.utm_source, {
        maxAge: UTM_COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    
    if (body.utm_medium) {
      cookieStore.set('utm_medium', body.utm_medium, {
        maxAge: UTM_COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    
    if (body.utm_campaign) {
      cookieStore.set('utm_campaign', body.utm_campaign, {
        maxAge: UTM_COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    
    if (body.utm_content) {
      cookieStore.set('utm_content', body.utm_content, {
        maxAge: UTM_COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    
    if (body.utm_term) {
      cookieStore.set('utm_term', body.utm_term, {
        maxAge: UTM_COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    
    // Получаем или создаём session ID
    let sessionId = cookieStore.get('session_id')?.value
    
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      cookieStore.set('session_id', sessionId, {
        maxAge: 24 * 60 * 60, // 24 часа
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    
    // Получаем IP и User-Agent
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    // Логируем VIEW событие в MarketingEvent
    try {
      await prisma.marketingEvent.create({
        data: {
          eventType: 'VIEW',
          sessionId,
          utmSource: body.utm_source || null,
          utmMedium: body.utm_medium || null,
          utmCampaign: body.utm_campaign || null,
          utmContent: body.utm_content || null,
          utmTerm: body.utm_term || null,
          ipAddress,
          userAgent,
        },
      })
      
      console.log('[UTM] VIEW event logged:', {
        sessionId,
        source: body.utm_source,
        medium: body.utm_medium,
        campaign: body.utm_campaign,
      })
      
      // Устанавливаем cookie с отметкой, что VIEW событие было записано
      // Это предотвратит дублирование при повторных переходах
      cookieStore.set(viewCookieName, 'tracked', {
        maxAge: UTM_COOKIE_MAX_AGE, // 30 дней
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
      
    } catch (dbError) {
      console.error('[UTM] Error logging VIEW event to database:', dbError)
      // Продолжаем выполнение, даже если запись в БД не удалась
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'UTM parameters saved and VIEW event logged',
    })
  } catch (error) {
    console.error('[UTM] Error processing UTM tracking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track UTM parameters' },
      { status: 500 }
    )
  }
}
