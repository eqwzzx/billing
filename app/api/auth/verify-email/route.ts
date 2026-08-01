import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendVerificationCode, isSmtpConfigured, generateVerificationCode } from '@/lib/email'
import { sendDiscordLog } from '@/lib/discord'
import { checkRateLimit, rateLimitResponse, getClientIp, createAuditLog } from '@/lib/security'
import { encryptPassword, generatePterodactylPassword } from '@/lib/pterodactyl-password'
import { adminLogger } from '@/lib/admin-logger'
import { discordLogger } from '@/lib/discord-logger'
import { saveUTMToUser, trackMarketingEvent } from '@/lib/marketing'
import { notifyUserRegistered } from '@/lib/discord-notifications'

// Генерация уникального реферального кода для пользователя
async function generateUniqueReferralCode(email: string): Promise<string> {
  const baseCode = email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000) // 4-значное число
  let code = `${baseCode}${randomSuffix}`
  
  // Проверяем уникальность
  let attempts = 0
  while (attempts < 10) {
    const existing = await prisma.user.findFirst({ where: { referralCode: code } })
    if (!existing) {
      return code
    }
    // Если код занят, генерируем новый
    code = `${baseCode}${Math.floor(1000 + Math.random() * 9000)}`
    attempts++
  }
  
  // Если не удалось за 10 попыток, используем случайный код
  return `USER${Date.now().toString().slice(-8)}`
}

// Динамически импортируем pterodactyl функции только когда они нужны
let pterodactylLib: any = null
async function loadPterodactyl() {
  if (pterodactylLib === null) {
    try {
      pterodactylLib = await import('@/lib/pterodactyl')
    } catch (error) {
      console.log('[VerifyEmail] Pterodactyl library not available')
      pterodactylLib = false
    }
  }
  return pterodactylLib || null
}

// POST - подтверждение email по коду (создание аккаунта)
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  
  // Rate limiting: 10 попыток за 15 минут
  const rateLimit = checkRateLimit(`verify-code:${clientIp}`, { 
    maxRequests: 10, 
    windowMs: 15 * 60 * 1000 
  })
  
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Ищем pending регистрацию
    const pending = await prisma.emailVerification.findUnique({
      where: { email: normalizedEmail }
    })

    if (!pending) {
      return NextResponse.json({ error: 'Регистрация не найдена. Начните заново.' }, { status: 400 })
    }

    if (pending.expiresAt < new Date()) {
      await prisma.emailVerification.delete({ where: { id: pending.id } })
      return NextResponse.json({ error: 'Код истёк. Зарегистрируйтесь заново.' }, { status: 400 })
    }

    if (pending.code !== code) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 })
    }

    // Проверяем что пользователь не был создан пока мы проверяли
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      await prisma.emailVerification.delete({ where: { id: pending.id } })
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 400 })
    }

    // Создаём пользователя
    const pterodactylPassword = generatePterodactylPassword()
    // const userReferralCode = await generateUniqueReferralCode(normalizedEmail) // Убрано
    
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: pending.password!,
        name: pending.name,
        emailVerified: true,
        pterodactylPassword: encryptPassword(pterodactylPassword),
        firstOrderDiscount: true, // 🎯 Все новые пользователи получают скидку первого заказа
        // referralCode: userReferralCode, // Убрано - не используется
      },
    })

    // Создаём аккаунт в Pterodactyl (если настроен)
    const PTERODACTYL_URL = process.env.PTERODACTYL_URL
    const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY
    
    if (PTERODACTYL_URL && PTERODACTYL_API_KEY) {
      try {
        const pteroLib = await loadPterodactyl()
        if (pteroLib) {
          const { createPterodactylUser, findPterodactylUserByEmail } = pteroLib
          
          const existingPteroUser = await findPterodactylUserByEmail(normalizedEmail)
          if (!existingPteroUser) {
            const username = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + user.id
            await createPterodactylUser({
              email: normalizedEmail,
              username: username,
              firstName: pending.name || 'User',
              lastName: String(user.id),
              password: pterodactylPassword,
            })
            console.log('[VerifyEmail] Pterodactyl user created for:', normalizedEmail)
          }
        } else {
          console.log('[VerifyEmail] Pterodactyl library not available, skipping user creation')
        }
      } catch (pteroError) {
        console.error('[VerifyEmail] Failed to create Pterodactyl user:', pteroError)
        // Не блокируем регистрацию, если Pterodactyl недоступен
      }
    } else {
      console.log('[VerifyEmail] Pterodactyl not configured, skipping user creation')
    }

    // Удаляем pending регистрацию
    await prisma.emailVerification.delete({ where: { id: pending.id } })

    createAuditLog(request, 'REGISTER_SUCCESS', { userId: user.id, success: true })

    // Логирование для админки
    const userAgent = request.headers.get('user-agent') || 'unknown'
    await adminLogger.userRegister(user.id, normalizedEmail, clientIp, userAgent)

    // Сохраняем UTM данные
    await saveUTMToUser(user.id)

    // Отслеживаем событие регистрации
    await trackMarketingEvent({
      eventType: 'REGISTRATION',
      userId: user.id,
      ipAddress: clientIp,
      userAgent,
    })

    // Отправляем уведомление в Discord
    await notifyUserRegistered(user.id)

    // Отправляем лог в Discord
    await sendDiscordLog({
      type: 'REGISTER',
      userId: user.id,
      userEmail: user.email,
    })

    // Discord логирование
    await discordLogger.logAuth({
      type: 'register',
      userId: user.id,
      userName: pending.name || 'Unknown',
      userEmail: normalizedEmail,
      ipAddress: clientIp,
      userAgent,
    }).catch(err => console.error('Discord log error:', err))

    // Создаём запись о реферальной регистрации если есть код
    const refCodeToCheck = request.cookies.get('ref_code')?.value
    console.log('[VerifyEmail] Referral code from cookie:', refCodeToCheck)
    
    if (refCodeToCheck && typeof refCodeToCheck === 'string') {
      try {
        const referralLink = await prisma.referralLink.findUnique({
          where: { code: refCodeToCheck.toUpperCase() },
        })
        
        console.log('[VerifyEmail] Referral link found:', referralLink ? referralLink.id : 'not found')
        
        if (referralLink && referralLink.isActive) {
          // Проверяем срок действия
          if (!referralLink.expiresAt || new Date(referralLink.expiresAt) >= new Date()) {
            console.log('[VerifyEmail] Attempting to create referral registration...')
            console.log('[VerifyEmail] Data:', { linkId: referralLink.id, userId: user.id, ipAddress: clientIp })
            
            await prisma.referralRegistration.create({
              data: {
                linkId: referralLink.id,
                userId: user.id,
                ipAddress: clientIp,
                userAgent,
              },
            })
            console.log('[VerifyEmail] ✅ Referral registration created successfully for link:', referralLink.id)
          } else {
            console.log('[VerifyEmail] Referral link expired')
          }
        } else {
          console.log('[VerifyEmail] Referral link inactive or not found')
        }
      } catch (error) {
        console.error('[VerifyEmail] ❌ Error creating referral registration:', error)
        console.error('[VerifyEmail] Error details:', error instanceof Error ? error.message : 'Unknown error')
        // Не блокируем регистрацию из-за ошибки реферальной записи
      }
    } else {
      console.log('[VerifyEmail] ❌ No referral code - skipping referral registration creation')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Аккаунт создан',
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    console.error('[VerifyEmail] Error:', error)
    return NextResponse.json({ error: 'Ошибка подтверждения' }, { status: 500 })
  }
}

// PUT - повторная отправка кода
export async function PUT(request: NextRequest) {
  const clientIp = getClientIp(request)
  
  // Rate limiting: 3 запроса за 5 минут
  const rateLimit = checkRateLimit(`resend-code:${clientIp}`, { 
    maxRequests: 3, 
    windowMs: 5 * 60 * 1000 
  })
  
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt)
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const smtpConfigured = await isSmtpConfigured()
    if (!smtpConfigured) {
      return NextResponse.json({ error: 'Отправка email не настроена' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Ищем pending регистрацию
    const pending = await prisma.emailVerification.findUnique({
      where: { email: normalizedEmail }
    })

    if (!pending) {
      return NextResponse.json({ error: 'Регистрация не найдена. Начните заново.' }, { status: 400 })
    }

    // Генерируем новый код
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.emailVerification.update({
      where: { id: pending.id },
      data: { code, expiresAt },
    })

    const sent = await sendVerificationCode(normalizedEmail, code)

    if (!sent) {
      return NextResponse.json({ error: 'Ошибка отправки кода' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Код отправлен' })
  } catch (error) {
    console.error('[ResendCode] Error:', error)
    return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 })
  }
}
