import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST - отследить просмотр реферальной ссылки
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { refCode } = body

    if (!refCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

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

    // Увеличить счётчик просмотров
    await prisma.referralLink.update({
      where: { id: link.id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    console.log('[Referral] View tracked for link:', refCode, 'New views:', link.views + 1)

    return NextResponse.json({ success: true, views: link.views + 1 })
  } catch (error) {
    console.error('[Referral] Error tracking view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
