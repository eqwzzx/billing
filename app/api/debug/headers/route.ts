import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-admin'
import { getClientIp } from '@/lib/security'

export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const headers: Record<string, string> = {}

  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  return NextResponse.json({
    headers,
    url: request.url,
    method: request.method,
    ip: getClientIp(request),
  })
}

export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const headers: Record<string, string> = {}

  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  let body = null
  try {
    body = await request.json()
  } catch {
    // ignore
  }

  return NextResponse.json({
    headers,
    body,
    url: request.url,
    method: request.method,
    ip: getClientIp(request),
  })
}
