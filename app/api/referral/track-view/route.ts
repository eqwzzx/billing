import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getClientIp } from '@/lib/security'

// POST - отследить просмотр реферальной ссылки (с проверкой уникальности)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { refCode, fingerprint } = body

    if (!refCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    // Получить IP адрес клиента
    const clientIp = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || 'unknown'

    console.log('[Referral] Track view attempt:', { refCode, clientIp, fingerprint })

    // Сначала ищем в админских реферальных ссылках
    const link = await prisma.referralLink.findUnique({
      where: { code: refCode.toUpperCase() },
    })

    if (link) {
      // Это админская UTM ссылка - трекаем просмотр как раньше
      
      // Проверить активность и срок действия
      if (!link.isActive || (link.expiresAt && new Date(link.expiresAt) < new Date())) {
        return NextResponse.json({ error: 'Referral link is inactive or expired' }, { status: 400 })
      }

      // Проверить уникальность просмотра (по IP или fingerprint)
      const recentView = await prisma.referralView.findFirst({
        where: {
          linkId: link.id,
          OR: [
            { ipAddress: clientIp },
            ...(fingerprint ? [{ fingerprint: fingerprint }] : []),
          ],
          viewedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      })

      if (recentView) {
        console.log('[Referral] Duplicate view detected (IP or fingerprint match), not counting')
        return NextResponse.json({ 
          success: true, 
          duplicate: true,
          message: 'View already tracked for this device/IP',
          type: 'admin_link'
        })
      }

      // Создать запись о просмотре
      await prisma.referralView.create({
        data: {
          linkId: link.id,
          ipAddress: clientIp,
          fingerprint: fingerprint || null,
          userAgent,
        },
      })

      // Увеличить счётчик просмотров
      await prisma.referralLink.update({
        where: { id: link.id },
        data: {
          views: {
            increment: 1,
          },
        },
      })

      console.log('[Referral] ✅ Admin link view tracked:', refCode, 'New views:', link.views + 1)

      return NextResponse.json({ success: true, views: link.views + 1, duplicate: false, type: 'admin_link' })
    }

    // Если не нашли в админских ссылках, проверяем персональные коды пользователей
    const user = await prisma.user.findFirst({
      where: { referralCode: refCode.toUpperCase() },
      select: { id: true, referralCode: true, email: true }
    })

    if (user) {
      // Это персональный реферальный код пользователя
      console.log('[Referral] ✅ Personal referral code view tracked for user:', user.email)
      
      // Для персональных кодов просто логируем, не храним каждый просмотр
      // Реальный трекинг произойдет при регистрации нового пользователя
      return NextResponse.json({ 
        success: true, 
        duplicate: false,
        message: 'Personal referral code recognized',
        type: 'personal_code'
      })
    }

    // Код не найден ни в админских ссылках, ни у пользователей
    console.log('[Referral] ❌ Referral code not found:', refCode)
    return NextResponse.json({ 
      error: 'Referral code not found',
      message: 'Code not recognized as admin link or personal code'
    }, { status: 404 })

  } catch (error) {
    console.error('[Referral] Error tracking view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
