import { NextRequest, NextResponse } from 'next/server'
import { trackMarketingEvent, getOrCreateSessionId } from '@/lib/marketing'
import { getClientIp } from '@/lib/security'

// POST - Отследить маркетинговое событие (публичный endpoint)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventType, userId, amount, planId, serverId, metadata } = body

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 })
    }

    const validEventTypes = ['VIEW', 'REGISTRATION', 'PLAN_SELECT', 'PAYMENT_START', 'PAYMENT_SUCCESS', 'SERVER_CREATE', 'SERVER_RENEW']
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const ipAddress = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || undefined

    await trackMarketingEvent({
      eventType,
      userId,
      amount,
      planId,
      serverId,
      metadata,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error tracking marketing event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
