import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAuthEnabled } from '@/lib/auth'
import { liftExpiredBanForUser } from '@/lib/ban'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export async function GET(request: NextRequest) {
  console.log('=== /api/auth/me DEBUG ===')
  console.log('All cookies:', request.cookies.getAll())
  console.log('Cookie header:', request.headers.get('cookie'))
  console.log('JWT_SECRET exists:', !!JWT_SECRET)
  
  if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  
  try {
    // ВРЕМЕННО ОТКЛЮЧЕНА ПРОВЕРКА authEnabled - требует исправления AdminSettings
    // const enabled = await isAuthEnabled()
    // if (!enabled) {
    //   return NextResponse.json({
    //     user: {
    //       id: 'public',
    //       email: 'public@fluxor.local',
    //       name: 'Гость',
    //       balance: 0,
    //       role: 'USER',
    //       pterodactylId: null,
    //       emailVerified: true,
    //       banned: false,
    //       banType: 'NONE',
    //       createdAt: new Date().toISOString(),
    //     },
    //   })
    // }

    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      console.log('❌ No auth-token cookie found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ Token found, length:', token.length)

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    console.log('✅ Token decoded, userId:', decoded.userId)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        role: true,
        pterodactylId: true,
        emailVerified: true,
        banned: true,
        banType: true,
        banReason: true,
        bannedAt: true,
        banExpiresAt: true,
        banCount: true,
        createdAt: true,
        // Marketing fields
        firstOrderDiscount: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmTerm: true,
        utmContent: true,
        // referralCode: true, // Убрано - поле не существует в production БД
        // Discord fields - ВАЖНО для сохранения привязки после перезагрузки
        discordId: true,
        discordUsername: true,
        discordDiscriminator: true,
        discordAvatar: true,
        discordGlobalName: true,
      },
    })

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const finalUser = await liftExpiredBanForUser(user)

    console.log('✅ User authenticated:', finalUser.email)
    return NextResponse.json({ user: finalUser })
  } catch (error) {
    console.error('❌ Auth error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
