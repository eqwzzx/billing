import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sanitizeString } from '@/lib/security'

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Имя обязательно' }, { status: 400 })
    }

    const sanitizedName = sanitizeString(name, 100).trim()

    if (sanitizedName.length < 1) {
      return NextResponse.json({ error: 'Имя слишком короткое' }, { status: 400 })
    }

    if (sanitizedName.length > 100) {
      return NextResponse.json({ error: 'Имя слишком длинное (максимум 100 символов)' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { name: sanitizedName },
    })

    return NextResponse.json({ success: true, name: sanitizedName })
  } catch (error) {
    console.error('[Update Name] Error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
