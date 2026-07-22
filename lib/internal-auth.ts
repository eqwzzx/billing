import { NextRequest } from 'next/server'

export function verifyInternalSecret(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET
  if (!secret) {
    console.error('[Security] INTERNAL_WEBHOOK_SECRET is not configured')
    return false
  }
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}
