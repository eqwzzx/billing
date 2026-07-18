import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST - отследить переход по реферальной ссылке
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Ищем реферальную ссылку
    const link = await prisma.referralLink.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!link) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    // Проверяем, активна ли ссылка и не истек ли срок
    if (!link.isActive) {
      return NextResponse.json({ error: 'Referral link is inactive' }, { status: 400 })
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Referral link has expired' }, { status: 400 })
    }

    // Увеличиваем счетчик просмотров
    await prisma.referralLink.update({
      where: { id: link.id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({ success: true, linkId: link.id })
  } catch (error) {
    console.error('[API] Error tracking referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
