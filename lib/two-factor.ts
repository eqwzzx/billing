import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'

// Настройка TOTP
authenticator.options = {
  window: 1, // Разрешить 1 шаг назад/вперед (30 сек)
  step: 30, // Шаг времени в секундах
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
  const secret = authenticator.generateSecret()

  // Создаем OTP Auth URL
  const otpauthUrl = authenticator.keyuri(userEmail, appName, secret)

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
    return authenticator.verify({ token, secret })
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
  return authenticator.generate(secret)
}
