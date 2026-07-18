"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notify } from "@/lib/notify"
import { Link as LinkIcon, ArrowLeft, Copy, Check, ExternalLink } from "lucide-react"
import Link from "next/link"

interface UTMParams {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
}

const PRESETS = {
  google_cpc: {
    label: 'Google Ads',
    source: 'google',
    medium: 'cpc',
    campaign: '',
    content: '',
    term: '',
  },
  vk_cpc: {
    label: 'VK Реклама',
    source: 'vk',
    medium: 'cpc',
    campaign: '',
    content: '',
    term: '',
  },
  telegram_post: {
    label: 'Telegram Пост',
    source: 'telegram',
    medium: 'social',
    campaign: '',
    content: '',
    term: '',
  },
  youtube_video: {
    label: 'YouTube Видео',
    source: 'youtube',
    medium: 'video',
    campaign: '',
    content: '',
    term: '',
  },
  email_newsletter: {
    label: 'Email Рассылка',
    source: 'email',
    medium: 'newsletter',
    campaign: '',
    content: '',
    term: '',
  },
}

export default function UTMGeneratorPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [baseUrl, setBaseUrl] = useState('')
  const [params, setParams] = useState<UTMParams>({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          setIsAuthorized(false)
          router.push('/client')
          return
        }
        const data = await res.json()
        if (data.user?.role !== 'ADMIN' && data.user?.role !== 'PR_MANAGER') {
          setIsAuthorized(false)
          router.push('/client')
          return
        }
        setIsAuthorized(true)
      } catch {
        setIsAuthorized(false)
        router.push('/client')
      }
    }
    checkAuth()
    
    // Устанавливаем базовый URL
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [router])

  const generateUrl = () => {
    if (!baseUrl) return ''
    
    const url = new URL(baseUrl)
    
    if (params.utm_source) url.searchParams.set('utm_source', params.utm_source)
    if (params.utm_medium) url.searchParams.set('utm_medium', params.utm_medium)
    if (params.utm_campaign) url.searchParams.set('utm_campaign', params.utm_campaign)
    if (params.utm_content) url.searchParams.set('utm_content', params.utm_content)
    if (params.utm_term) url.searchParams.set('utm_term', params.utm_term)
    
    return url.toString()
  }

  const generatedUrl = generateUrl()

  const handleCopy = async () => {
    if (!generatedUrl) return
    
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      notify.success('Ссылка скопирована')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      notify.error('Ошибка копирования')
    }
  }

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey]
    setParams({
      utm_source: preset.source,
      utm_medium: preset.medium,
      utm_campaign: preset.campaign,
      utm_content: preset.content,
      utm_term: preset.term,
    })
  }

  const clearForm = () => {
    setParams({
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
    })
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    )
  }

  if (isAuthorized === false) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/marketing"
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="flex items-center gap-3">
              <LinkIcon className="size-8 text-foreground" />
              <div>
                <h1 className="text-2xl font-heading font-bold">Генератор UTM ссылок</h1>
                <p className="text-sm text-muted-foreground">Создание ссылок для отслеживания источников трафика</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Пресеты */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Быстрые шаблоны</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key as keyof typeof PRESETS)}
                className="px-4 py-2 rounded-xl border border-border bg-accent/30 hover:bg-accent transition-colors text-sm font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Форма */}
        <div className="p-6 rounded-xl border border-border bg-accent/30 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Параметры UTM</h2>
            <button
              onClick={clearForm}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Очистить
            </button>
          </div>

          {/* Базовый URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Базовый URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>

          {/* UTM Source */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              utm_source <span className="text-red-500">*</span>
              <span className="text-muted-foreground font-normal ml-2">(Источник трафика)</span>
            </label>
            <input
              type="text"
              value={params.utm_source}
              onChange={(e) => setParams({ ...params, utm_source: e.target.value })}
              placeholder="google, vk, telegram"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <p className="text-xs text-muted-foreground">Откуда пришёл трафик (google, vk, newsletter, etc.)</p>
          </div>

          {/* UTM Medium */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              utm_medium <span className="text-red-500">*</span>
              <span className="text-muted-foreground font-normal ml-2">(Канал)</span>
            </label>
            <input
              type="text"
              value={params.utm_medium}
              onChange={(e) => setParams({ ...params, utm_medium: e.target.value })}
              placeholder="cpc, banner, email"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <p className="text-xs text-muted-foreground">Тип канала (cpc, banner, social, email, etc.)</p>
          </div>

          {/* UTM Campaign */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              utm_campaign <span className="text-red-500">*</span>
              <span className="text-muted-foreground font-normal ml-2">(Кампания)</span>
            </label>
            <input
              type="text"
              value={params.utm_campaign}
              onChange={(e) => setParams({ ...params, utm_campaign: e.target.value })}
              placeholder="winter2024, blackfriday"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <p className="text-xs text-muted-foreground">Название рекламной кампании</p>
          </div>

          {/* UTM Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              utm_content
              <span className="text-muted-foreground font-normal ml-2">(Контент - опционально)</span>
            </label>
            <input
              type="text"
              value={params.utm_content}
              onChange={(e) => setParams({ ...params, utm_content: e.target.value })}
              placeholder="banner-top, video-intro"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <p className="text-xs text-muted-foreground">Тип контента или A/B вариант</p>
          </div>

          {/* UTM Term */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              utm_term
              <span className="text-muted-foreground font-normal ml-2">(Ключевое слово - опционально)</span>
            </label>
            <input
              type="text"
              value={params.utm_term}
              onChange={(e) => setParams({ ...params, utm_term: e.target.value })}
              placeholder="minecraft hosting"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
            />
            <p className="text-xs text-muted-foreground">Ключевое слово для поиска (для PPC)</p>
          </div>
        </div>

        {/* Результат */}
        {generatedUrl && params.utm_source && params.utm_medium && params.utm_campaign && (
          <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-green-600 dark:text-green-400">
                Готовая ссылка
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                >
                  <ExternalLink className="size-5" />
                </a>
              </div>
            </div>
            
            <div className="p-4 bg-background rounded-lg break-all text-sm font-mono">
              {generatedUrl}
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>💡 <strong>Как использовать:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Скопируйте ссылку и используйте её в рекламе</li>
                <li>Все переходы по этой ссылке будут отслеживаться</li>
                <li>Статистика доступна в разделе "Маркетинг"</li>
                <li>UTM метки сохраняются в cookies на 30 дней</li>
              </ul>
            </div>
          </div>
        )}

        {/* Подсказки */}
        <div className="p-6 rounded-xl border border-border bg-accent/30 space-y-4">
          <h3 className="font-semibold">📚 Примеры использования</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Google Ads:</p>
              <code className="text-xs bg-background px-2 py-1 rounded">
                ?utm_source=google&utm_medium=cpc&utm_campaign=minecraft_hosting&utm_term=майнкрафт+хостинг
              </code>
            </div>

            <div>
              <p className="font-medium mb-1">VK Реклама:</p>
              <code className="text-xs bg-background px-2 py-1 rounded">
                ?utm_source=vk&utm_medium=cpc&utm_campaign=winter2024&utm_content=banner_blue
              </code>
            </div>

            <div>
              <p className="font-medium mb-1">Telegram Пост:</p>
              <code className="text-xs bg-background px-2 py-1 rounded">
                ?utm_source=telegram&utm_medium=social&utm_campaign=channel_promo&utm_content=post_123
              </code>
            </div>

            <div>
              <p className="font-medium mb-1">Email Рассылка:</p>
              <code className="text-xs bg-background px-2 py-1 rounded">
                ?utm_source=email&utm_medium=newsletter&utm_campaign=december_sale&utm_content=button_cta
              </code>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
