import QRCode from 'qrcode'
import crypto from 'crypto'

// Простая реализация TOTP без otplib
// Используем стандартный алгоритм TOTP (RFC 6238)

const TOTP_WINDOW = 1 // Разрешить 1 шаг назад/вперед (30 сек)
const TOTP_STEP = 30 // Шаг времени в секундах
const TOTP_DIGITS = 6 // Количество цифр в коде

/**
 * Генерирует base32 секрет
 */
function generateSecret(): string {
  const buffer = crypto.randomBytes(20)
  return base32Encode(buffer)
}

/**
 * Кодирование в base32
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31]
  }

  return output
}

/**
 * Декодирование из base32
 */
function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleanedInput = base32.toUpperCase().replace(/=+$/, '')
  
  let bits = 0
  let value = 0
  let index = 0
  const output = Buffer.alloc(((cleanedInput.length * 5) / 8) | 0)

  for (let i = 0; i < cleanedInput.length; i++) {
    const idx = alphabet.indexOf(cleanedInput[i])
    if (idx === -1) throw new Error('Invalid base32 character')
    
    value = (value << 5) | idx
    bits += 5

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }

  return output
}

/**
 * Генерирует HMAC для временной метки
 */
function generateHOTP(secret: string, counter: number): string {
  const decodedSecret = base32Decode(secret)
  const buffer = Buffer.alloc(8)
  
  for (let i = 0; i < 8; i++) {
    buffer[7 - i] = counter & 0xff
    counter = counter >> 8
  }

  const hmac = crypto.createHmac('sha1', decodedSecret)
  hmac.update(buffer)
  const hash = hmac.digest()

  const offset = hash[hash.length - 1] & 0xf
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)

  const otp = binary % Math.pow(10, TOTP_DIGITS)
  return otp.toString().padStart(TOTP_DIGITS, '0')
}

/**
 * Генерирует TOTP код для текущего времени
 */
function generateTOTP(secret: string, time?: number): string {
  const now = time || Math.floor(Date.now() / 1000)
  const counter = Math.floor(now / TOTP_STEP)
  return generateHOTP(secret, counter)
}

/**
 * Проверяет TOTP код
 */
function verifyTOTP(token: string, secret: string): boolean {
  const now = Math.floor(Date.now() / 1000)
  
  // Проверяем текущее время и окно (±TOTP_WINDOW)
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const time = now + i * TOTP_STEP
    const validToken = generateTOTP(secret, time)
    if (token === validToken) {
      return true
    }
  }
  
  return false
}

/**
 * Генерирует OTP Auth URI
 */
function generateKeyURI(user: string, service: string, secret: string): string {
  const encodedUser = encodeURIComponent(user)
  const encodedService = encodeURIComponent(service)
  return `otpauth://totp/${encodedService}:${encodedUser}?secret=${secret}&issuer=${encodedService}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP}`
}

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

/**
 * Генерирует секрет и QR код для настройки 2FA
 */
export async function generateTwoFactorSetup(
  userEmail: string,
  appName: string = 'Avelon Billing'
): Promise<TwoFactorSetup> {
  // Генерируем секретный ключ
  const secret = generateSecret()

  // Создаем OTP Auth URL
  const otpauthUrl = generateKeyURI(userEmail, appName, secret)

  // Генерируем QR код
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl)

  // Генерируем backup коды
  const backupCodes = generateBackupCodes()

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  }
}

/**
 * Проверяет TOTP код
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    return verifyTOTP(token, secret)
  } catch (error) {
    console.error('2FA verification error:', error)
    return false
  }
}

/**
 * Генерирует резервные коды
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Генерируем 8-значный код
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

/**
 * Хеширует резервные коды для безопасного хранения
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) =>
    crypto.createHash('sha256').update(code).digest('hex')
  )
}

/**
 * Проверяет резервный код
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): boolean {
  const hashedInput = crypto.createHash('sha256').update(code).digest('hex')
  return hashedCodes.includes(hashedInput)
}

/**
 * Удаляет использованный резервный код
 */
export function removeUsedBackupCode(
  code: string,
  hashedCodes: string[]
): string[] {
  const hashedInput = crypto.createHash('sha256').update(code).digest('hex')
  return hashedCodes.filter((hash) => hash !== hashedInput)
}

/**
 * Получает текущий TOTP токен (для тестирования)
 */
export function getCurrentToken(secret: string): string {
  return generateTOTP(secret)
}
