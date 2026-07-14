import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY_SALT = 'pterodactyl-password-key-salt'

function getEncryptionKey(): Buffer {
  const encryptionKey = process.env.PTERODACTYL_PASSWORD_KEY

  if (!encryptionKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PTERODACTYL_PASSWORD_KEY environment variable is required in production')
    }

    console.warn(
      'Warning: PTERODACTYL_PASSWORD_KEY is not set. Using development fallback key. Configure PTERODACTYL_PASSWORD_KEY in production.'
    )
    return crypto.scryptSync('development-fallback-key-change-in-production', KEY_SALT, 32)
  }

  return crypto.scryptSync(encryptionKey, KEY_SALT, 32)
}

export function generatePterodactylPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const bytes = crypto.randomBytes(12)
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(bytes[i] % chars.length)
  }
  return password
}

export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decryptPassword(encryptedPassword: string): string {
  try {
    const [ivHex, encrypted] = encryptedPassword.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Failed to decrypt password:', error)
    return ''
  }
}

export function isEncryptedPassword(password: string): boolean {
  return password.includes(':') && password.length > 32
}
