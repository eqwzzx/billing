import { prisma } from './db'

const UNBAN_DATA = {
  banned: false,
  banType: 'NONE',
  banReason: null,
  bannedAt: null,
  bannedBy: null,
  banExpiresAt: null,
} as const

type MinimalBanUser = {
  id: string
  banned?: boolean | null
  banExpiresAt?: Date | string | null
}

function isBanExpired(user: MinimalBanUser): boolean {
  return (
    user.banned === true &&
    user.banExpiresAt != null &&
    new Date(user.banExpiresAt).getTime() <= Date.now()
  )
}

export async function liftExpiredBanForUser<T extends MinimalBanUser>(
  user: T,
): Promise<T> {
  if (!isBanExpired(user)) return user

  await prisma.user.update({
    where: { id: user.id },
    data: UNBAN_DATA,
  })

  await prisma.banHistory.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false, endedAt: new Date() },
  })

  return { ...user, ...UNBAN_DATA } as unknown as T
}

export async function liftAllExpiredBans(): Promise<number> {
  const now = new Date()

  const expired = await prisma.user.findMany({
    where: {
      banned: true,
      banExpiresAt: { not: null, lte: now },
    },
    select: { id: true },
  })

  if (expired.length === 0) return 0

  const ids = expired.map((u) => u.id)

  await prisma.user.updateMany({
    where: { id: { in: ids } },
    data: UNBAN_DATA,
  })

  await prisma.banHistory.updateMany({
    where: { userId: { in: ids }, isActive: true },
    data: { isActive: false, endedAt: now },
  })

  return ids.length
}
