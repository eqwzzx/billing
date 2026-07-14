'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, MessageSquare, ExternalLink, Clock } from 'lucide-react'

interface BanInfo {
  banned: boolean
  banType: string
  banReason: string
  bannedAt: string
  banExpiresAt?: string
  banCount: number
}

export default function BannedPage() {
  const router = useRouter()
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanInfo()
  }, [])

  const fetchBanInfo = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()
      
      // Проверяем что пользователь действительно заблокирован
      if (!data.user || !data.user.banned) {
        router.push('/client')
        return
      }

      setBanInfo({
        banned: data.user.banned,
        banType: data.user.banType,
        banReason: data.user.banReason,
        bannedAt: data.user.bannedAt,
        banExpiresAt: data.user.banExpiresAt,
        banCount: data.user.banCount || 0,
      })
    } catch (error) {
      console.error('Failed to fetch ban info:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeUntilUnban = () => {
    if (!banInfo?.banExpiresAt) return null

    const now = new Date()
    const expiresAt = new Date(banInfo.banExpiresAt)
    const diff = expiresAt.getTime() - now.getTime()

    if (diff <= 0) return 'Блокировка истекла'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days} дн. ${hours} ч.`
    if (hours > 0) return `${hours} ч. ${minutes} мин.`
    return `${minutes} мин.`
  }

  const getBanTypeInfo = () => {
    switch (banInfo?.banType) {
      case 'WARNING':
        return {
          color: 'border-orange-500/20 bg-orange-500/5',
          iconColor: 'text-orange-500',
          emoji: '⚠️',
          title: 'Предупреждение'
        }
      case 'TEMP_BAN':
        return {
          color: 'border-red-500/20 bg-red-500/5',
          iconColor: 'text-red-500',
          emoji: '🚫',
          title: 'Временная блокировка'
        }
      case 'PERM_BAN':
        return {
          color: 'border-red-700/20 bg-red-700/5',
          iconColor: 'text-red-700',
          emoji: '⛔',
          title: 'Постоянная блокировка'
        }
      default:
        return {
          color: 'border-border/50 bg-card/30',
          iconColor: 'text-muted-foreground',
          emoji: '🔒',
          title: 'Аккаунт заблокирован'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (!banInfo) {
    return null
  }

  const banTypeInfo = getBanTypeInfo()
  const timeLeft = getTimeUntilUnban()
  const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/your-server'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Основная карточка */}
        <div className={`rounded-2xl border p-8 mb-6 ${banTypeInfo.color}`}>
          <div className="flex items-start gap-4 mb-6">
            <div className={`size-14 rounded-2xl bg-background/50 flex items-center justify-center ${banTypeInfo.iconColor}`}>
              <Shield className="size-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{banTypeInfo.emoji}</span>
                <h1 className="font-heading text-2xl font-bold text-foreground">{banTypeInfo.title}</h1>
              </div>
              <p className="text-muted-foreground text-sm">Ваш доступ к панели ограничен</p>
            </div>
          </div>

          {/* Информация о блокировке */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border/50 bg-background/30 p-4">
              <p className="text-xs text-muted-foreground mb-1">Причина блокировки</p>
              <p className="text-sm text-foreground">{banInfo.banReason}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                <p className="text-xs text-muted-foreground mb-1">Дата блокировки</p>
                <p className="text-sm text-foreground font-medium">{formatDate(banInfo.bannedAt)}</p>
              </div>

              {banInfo.banExpiresAt && (
                <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Истекает через</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-foreground" />
                    <p className="text-sm text-foreground font-medium">{timeLeft}</p>
                  </div>
                </div>
              )}

              {banInfo.banCount > 1 && (
                <div className="rounded-xl border border-border/50 bg-background/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Всего блокировок</p>
                  <p className="text-sm text-foreground font-medium">{banInfo.banCount}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Апелляция через Discord */}
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="size-4 text-muted-foreground" />
            <h2 className="font-heading font-semibold text-foreground">Не согласны с блокировкой?</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Вы можете подать апелляцию через наш Discord сервер. Администрация рассмотрит ваше обращение.
          </p>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium transition-all duration-200 hover:scale-[1.02]"
          >
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Перейти в Discord
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
