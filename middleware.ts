import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  // Извлекаем UTM параметры из URL
  const searchParams = request.nextUrl.searchParams
  const utmSource = searchParams.get('utm_source')
  const utmMedium = searchParams.get('utm_medium')
  const utmCampaign = searchParams.get('utm_campaign')
  const utmContent = searchParams.get('utm_content')
  const utmTerm = searchParams.get('utm_term')
  const refCode = searchParams.get('ref')
  
  // Сохраняем UTM метки в cookies на 30 дней
  const cookieMaxAge = 30 * 24 * 60 * 60 // 30 дней
  const cookieOptions = {
    maxAge: cookieMaxAge,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
  
  if (utmSource) {
    response.cookies.set('utm_source', utmSource, cookieOptions)
  }
  
  if (utmMedium) {
    response.cookies.set('utm_medium', utmMedium, cookieOptions)
  }
  
  if (utmCampaign) {
    response.cookies.set('utm_campaign', utmCampaign, cookieOptions)
  }
  
  if (utmContent) {
    response.cookies.set('utm_content', utmContent, cookieOptions)
  }
  
  if (utmTerm) {
    response.cookies.set('utm_term', utmTerm, cookieOptions)
  }
  
  if (refCode) {
    response.cookies.set('ref_code', refCode, cookieOptions)
  }
  
  // Создаём или получаем session ID
  if (!request.cookies.get('session_id')) {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    response.cookies.set('session_id', sessionId, {
      maxAge: 24 * 60 * 60, // 24 часа
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
