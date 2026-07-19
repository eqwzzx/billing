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

    // Найти ссылку
    const link = await prisma.referralLink.findUnique({
      where: { code: refCode.toUpperCase() },
    })

    if (!link) {
      return NextResponse.json({ error: 'Referral link not found' }, { status: 404 })
    }

    // Проверить активность и срок действия
    if (!link.isActive || (link.expiresAt && new Date(link.expiresAt) < new Date())) {
      return NextResponse.json({ error: 'Referral link is inactive or expired' }, { status: 400 })
    }

    // Проверить уникальность просмотра (по IP или fingerprint)
    // Ищем просмотр с таким же IP или fingerprint за последние 24 часа
    const recentView = await prisma.referralView.findFirst({
      where: {
        linkId: link.id,
        OR: [
          { ipAddress: clientIp },
          ...(fingerprint ? [{ fingerprint: fingerprint }] : []),
        ],
        viewedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Последние 24 часа
        },
      },
    })

    if (recentView) {
      console.log('[Referral] Duplicate view detected (IP or fingerprint match), not counting')
      return NextResponse.json({ 
        success: true, 
        duplicate: true,
        message: 'View already tracked for this device/IP'
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

    console.log('[Referral] ✅ Unique view tracked for link:', refCode, 'New views:', link.views + 1)

    return NextResponse.json({ success: true, views: link.views + 1, duplicate: false })
  } catch (error) {
    console.error('[Referral] Error tracking view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
