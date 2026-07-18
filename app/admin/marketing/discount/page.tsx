"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notify } from "@/lib/notify"
import { Percent, ArrowLeft, Save, Info } from "lucide-react"
import Link from "next/link"

interface DiscountSettings {
  id: string
  isEnabled: boolean
  discountPercent: number
  description: string | null
}

export default function FirstOrderDiscountPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<DiscountSettings | null>(null)

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
        if (data.user?.role !== 'ADMIN') {
          setIsAuthorized(false)
          router.push('/client')
          return
        }
        setIsAuthorized(true)
        loadSettings()
      } catch {
        setIsAuthorized(false)
        router.push('/client')
      }
    }
    checkAuth()
  }, [router])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/marketing/discount')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      } else {
        notify.error('Ошибка загрузки настроек')
      }
    } catch (error) {
      notify.error('Ошибка загрузки данных')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!settings) return

    if (settings.discountPercent < 0 || settings.discountPercent > 100) {
      notify.error('Скидка должна быть от 0 до 100%')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/marketing/discount', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: settings.isEnabled,
          discountPercent: settings.discountPercent,
          description: settings.description,
        }),
      })

      if (res.ok) {
        notify.success('Настройки сохранены')
        loadSettings()
      } else {
        const error = await res.json()
        notify.error(error.error || 'Ошибка сохранения')
      }
    } catch (error) {
      notify.error('Ошибка сохранения')
    }
    setSaving(false)
  }

  if (isAuthorized === null || loading) {
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
              <Percent className="size-8 text-foreground" />
              <div>
                <h1 className="text-2xl font-heading font-bold">Скидка первого заказа</h1>
                <p className="text-sm text-muted-foreground">Настройка автоматической скидки для новых клиентов</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Информация */}
        <div className="p-6 rounded-xl border border-blue-500/30 bg-blue-500/10">
          <div className="flex gap-3">
            <Info className="size-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-500">Как работает скидка первого заказа:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Скидка применяется автоматически при создании первого сервера</li>
                <li>Не требует ввода промокода</li>
                <li>Действует только для платных тарифов</li>
                <li>После использования скидки она больше не доступна пользователю</li>
                <li>Скидка применяется к итоговой цене после других скидок</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Форма настроек */}
        {settings && (
          <div className="p-6 rounded-xl border border-border bg-accent/30 space-y-6">
            <h2 className="text-xl font-semibold">Настройки скидки</h2>

            {/* Включение/Выключение */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                  className="size-5 rounded border-border bg-background cursor-pointer"
                />
                <div>
                  <p className="font-medium">Включить скидку первого заказа</p>
                  <p className="text-sm text-muted-foreground">
                    Автоматически применять скидку для новых пользователей
                  </p>
                </div>
              </label>
            </div>

            {/* Процент скидки */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium">Размер скидки (%)</span>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.discountPercent}
                    onChange={(e) => setSettings({ ...settings, discountPercent: parseInt(e.target.value) })}
                    disabled={!settings.isEnabled}
                    className="flex-1 h-2 rounded-lg bg-accent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.discountPercent}
                      onChange={(e) => setSettings({ ...settings, discountPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                      disabled={!settings.isEnabled}
                      className="w-20 px-3 py-2 rounded-xl border border-border bg-background text-center focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Скидка будет применена к итоговой стоимости первого сервера
                </p>
              </label>
            </div>

            {/* Описание */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium">Описание (опционально)</span>
                <textarea
                  value={settings.description || ''}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  disabled={!settings.isEnabled}
                  placeholder="Внутреннее описание для администраторов..."
                  rows={3}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground resize-none disabled:opacity-50"
                />
              </label>
            </div>

            {/* Предпросмотр */}
            {settings.isEnabled && settings.discountPercent > 0 && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Пример расчёта:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Цена тарифа:</span>
                    <span>1000 ₽</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                    <span>Скидка {settings.discountPercent}%:</span>
                    <span>-{(1000 * settings.discountPercent / 100).toFixed(0)} ₽</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border text-foreground font-bold">
                    <span>К оплате:</span>
                    <span>{(1000 - (1000 * settings.discountPercent / 100)).toFixed(0)} ₽</span>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопка сохранения */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="size-5" />
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
