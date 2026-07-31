import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdminAuth } from '@/lib/auth-admin'

// GET - получить все alerts
export async function GET(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const alerts = await prisma.alert.findMany({
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('[Admin Alerts] Get error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// POST - создать новый alert
export async function POST(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, message, actionLabel, actionUrl, isActive, priority, hideAfterFirstDiscount } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const alert = await prisma.alert.create({
      data: {
        type: type || 'INFO',
        message,
        actionLabel,
        actionUrl,
        isActive: isActive !== undefined ? isActive : true,
        isSystem: false,
        priority: priority || 0,
        hideAfterFirstDiscount: hideAfterFirstDiscount || false,
      }
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('[Admin Alerts] Create error:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
