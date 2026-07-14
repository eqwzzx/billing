import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { isAuthEnabled } from '@/lib/auth'
import { sendVerificationCode, isSmtpConfigured, generateVerificationCode } from '@/lib/email'
import { 
  checkRateLimit, 
  rateLimitResponse, 
  getClientIp, 
  createAuditLog,
  validateEmail,
  validatePassword,
  sanitizeString,
  isEmailFromTrustedDomain,
  getEmailDomain
} from '@/lib/security'
import { adminLogger } from '@/lib/admin-logger'
import { encryptPassword, generatePterodactylPassword } from '@/lib/pterodactyl-password'
import { notifyUserRegistered } from '@/lib/discord-notifications'

// Динамически импортируем pterodactyl функции только когда они нужны
let pterodactylLib: any = null
async function loadPterodactyl() {
  if (pterodactylLib === null) {
    try {
      pterodactylLib = await import('@/lib/pterodactyl')
    } catch (error) {
      console.log('[Register] Pterodactyl library not available')
      pterodactylLib = false // помечаем как недоступное
    }
  }
  return pterodactylLib || null
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  
  // Rate limiting: 5 регистраций за 1 час с одного IP
  const rateLimit = checkRateLimit(`register:${clientIp}`, { 
    maxRequests: 5, 
    windowMs: 60 * 60 * 1000 
  })
  
  if (!rateLimit.allowed) {
    createAuditLog(request, 'REGISTER_RATE_LIMITED', { success: false })
    return rateLimitResponse(rateLimit.resetAt)
  }

  try {
    const enabled = await isAuthEnabled()
    if (!enabled) {
      return NextResponse.json({ error: 'Регистрация отключена администратором' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name } = body

    // Валидация email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }
    
    const normalizedEmail = email.toLowerCase().trim()
    
    // Запрет на использование "+" в email (например, user+1@gmail.com)
    if (normalizedEmail.includes('+')) {
      return NextResponse.json({ error: 'Email не может содержать символ "+"' }, { status: 400 })
    }
    
    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Некорректный формат email' }, { status: 400 })
    }

    // Валидация пароля
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Пароль обязателен' }, { status: 400 })
    }
    
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ 
        error: passwordValidation.errors[0],
        errors: passwordValidation.errors 
      }, { status: 400 })
    }

    // Санитизация имени
    const sanitizedName = name ? sanitizeString(name, 100) : null

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      createAuditLog(request, 'REGISTER_FAILED', { 
        details: { reason: 'email_exists' },
        success: false 
      })
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 })
    }

    // Проверяем, является ли домен доверенным
    const isTrustedDomain = isEmailFromTrustedDomain(normalizedEmail)
    const emailDomain = getEmailDomain(normalizedEmail)
    
    // Логируем регистрацию с нестандартным доменом
    if (!isTrustedDomain) {
      console.log(`[Register] Non-trusted domain registration: ${normalizedEmail} (${emailDomain})`)
    }

    // Проверяем настроен ли SMTP
    const smtpConfigured = await isSmtpConfigured()

    // Если SMTP не настроен — создаём аккаунт сразу
    if (!smtpConfigured) {
      const hashedPassword = await bcrypt.hash(password, 12)
      const pterodactylPassword = encryptPassword(password)
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: sanitizedName,
          emailVerified: isTrustedDomain, // Доверенные домены сразу верифицированы
          pterodactylPassword,
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
                firstName: sanitizedName || 'User',
                lastName: String(user.id),
                password: password,
              })
              console.log('[Register] Pterodactyl user created for:', normalizedEmail)
            }
          } else {
            console.log('[Register] Pterodactyl library not available, skipping user creation')
          }
        } catch (pteroError) {
          console.error('[Register] Failed to create Pterodactyl user:', pteroError)
          // Не блокируем регистрацию, если Pterodactyl недоступен
        }
      } else {
        console.log('[Register] Pterodactyl not configured, skipping user creation')
      }

      createAuditLog(request, 'REGISTER_SUCCESS', { userId: user.id, success: true })

      // Логирование для админки
      const userAgent = request.headers.get('user-agent') || 'unknown'
      await adminLogger.userRegister(user.id, normalizedEmail, clientIp, userAgent)

      // Отправляем уведомление в Discord
      await notifyUserRegistered(user)

      return NextResponse.json({ 
        success: true, 
        requiresVerification: false,
        emailVerified: isTrustedDomain,
        needsVerificationForPurchase: !isTrustedDomain,
        user: { id: user.id, email: user.email, name: user.name },
      })
    }

    // SMTP настроен — создаём pending регистрацию
    const hashedPassword = await bcrypt.hash(password, 12)
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 минут

    // Удаляем старую pending регистрацию если есть
    await prisma.emailVerification.deleteMany({ where: { email: normalizedEmail } })

    // Создаём новую pending регистрацию без хранения оригинального пароля
    await prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        code,
        password: hashedPassword,
        name: sanitizedName,
        expiresAt,
      },
    })

    // Отправляем код
    const sent = await sendVerificationCode(normalizedEmail, code)

    if (!sent) {
      await prisma.emailVerification.deleteMany({ where: { email: normalizedEmail } })
      return NextResponse.json({ error: 'Ошибка отправки кода. Попробуйте позже.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      requiresVerification: true,
      email: normalizedEmail,
    })
  } catch (error) {
    console.error('[Register] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Ошибка регистрации' }, { status: 500 })
  }
}
