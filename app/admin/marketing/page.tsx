"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notify } from "@/lib/notify"
import { TrendingUp, Users, DollarSign, Eye, ArrowLeft, Calendar, Filter, Percent, Link as LinkIcon } from "lucide-react"
import Link from "next/link"

interface AnalyticsData {
  source: string
  medium: string
  campaign: string
  views: number
  registrations: number
  planSelects: number
  paymentStarts: number
  payments: number
  revenue: number
  serverCreates: number
  serverRenews: number
  conversionRate: number
  paymentRate: number
  avgRevenue: number
  totalValue: number
}

interface Totals {
  views: number
  registrations: number
  payments: number
  revenue: number
  serverCreates: number
  serverRenews: number
}

export default function MarketingAnalyticsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [campaignFilter, setCampaignFilter] = useState("")
  const [userRole, setUserRole] = useState<string>("")

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
        setUserRole(data.user.role)
        loadAnalytics()
      } catch {
        setIsAuthorized(false)
        router.push('/client')
      }
    }
    checkAuth()
  }, [router])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (sourceFilter) params.append('source', sourceFilter)
      if (campaignFilter) params.append('campaign', campaignFilter)

      const res = await fetch(`/api/admin/marketing/analytics?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics || [])
        setTotals(data.totals || null)
      } else {
        const err = await res.json().catch(() => null)
        notify.error(err?.error || `Ошибка загрузки аналитики (${res.status})`)
        setAnalytics([])
        setTotals(null)
      }
    } catch (error) {
      notify.error('Ошибка загрузки данных')
    }
    setLoading(false)
  }

  const handleFilter = () => {
    loadAnalytics()
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setSourceFilter("")
    setCampaignFilter("")
    setTimeout(loadAnalytics, 100)
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/client"
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="flex items-center gap-3">
              <TrendingUp className="size-8 text-foreground" />
              <div>
                <h1 className="text-2xl font-heading font-bold">Маркетинговая аналитика</h1>
                <p className="text-sm text-muted-foreground">Эффективность рекламных кампаний</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Быстрые действия */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/marketing/utm-generator"
            className="p-6 rounded-xl border border-border bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <LinkIcon className="size-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Генератор UTM ссылок</h3>
                <p className="text-sm text-muted-foreground">Создать отслеживаемые ссылки для рекламы</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/referrals"
            className="p-6 rounded-xl border border-border bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <Users className="size-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Реферальные ссылки</h3>
                <p className="text-sm text-muted-foreground">Управление партнёрской программой</p>
              </div>
            </div>
          </Link>

          {/* Скидка первого заказа - только для ADMIN */}
          {userRole === 'ADMIN' && (
            <Link
              href="/admin/marketing/discount"
              className="p-6 rounded-xl border border-border bg-gradient-to-br from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                  <Percent className="size-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Скидка первого заказа</h3>
                  <p className="text-sm text-muted-foreground">Настроить автоматическую скидку</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Фильтры */}
        <div className="p-6 rounded-xl border border-border bg-accent/30">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="size-5" />
            <h2 className="text-lg font-semibold">Фильтры</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="size-4 inline mr-1" />
                Дата начала
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="size-4 inline mr-1" />
                Дата окончания
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Источник</label>
              <input
                type="text"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                placeholder="google, vk, etc."
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Кампания</label>
              <input
                type="text"
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                placeholder="winter2024, etc."
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity"
            >
              Применить
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-border rounded-xl hover:bg-accent transition-colors"
            >
              Сбросить
            </button>
          </div>
        </div>

        {/* Общая статистика */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="size-6 text-blue-500" />
                <span className="text-sm text-muted-foreground">Переходы</span>
              </div>
              <p className="text-3xl font-bold">{totals.views.toLocaleString()}</p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-green-500/10 to-green-600/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="size-6 text-green-500" />
                <span className="text-sm text-muted-foreground">Регистрации</span>
              </div>
              <p className="text-3xl font-bold">{totals.registrations.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totals.views > 0 ? ((totals.registrations / totals.views) * 100).toFixed(1) : 0}% конверсия
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-purple-500/10 to-purple-600/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-6 text-purple-500" />
                <span className="text-sm text-muted-foreground">Оплаты</span>
              </div>
              <p className="text-3xl font-bold">{totals.payments.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totals.registrations > 0 ? ((totals.payments / totals.registrations) * 100).toFixed(1) : 0}% от регистраций
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="size-6 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Выручка</span>
              </div>
              <p className="text-3xl font-bold">{totals.revenue.toLocaleString()} ₽</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totals.payments > 0 ? (totals.revenue / totals.payments).toFixed(0) : 0} ₽ средний чек
              </p>
            </div>
          </div>
        )}

        {/* Таблица по источникам */}
        <div className="rounded-xl border border-border overflow-hidden bg-background/50 backdrop-blur">
          <div className="p-4 border-b border-border bg-accent/30">
            <h2 className="text-lg font-semibold">Статистика по источникам</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-accent/20">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Источник</th>
                  <th className="p-4 text-left text-sm font-medium">Канал</th>
                  <th className="p-4 text-left text-sm font-medium">Кампания</th>
                  <th className="p-4 text-center text-sm font-medium">Переходы</th>
                  <th className="p-4 text-center text-sm font-medium">Регистрации</th>
                  <th className="p-4 text-center text-sm font-medium">Оплаты</th>
                  <th className="p-4 text-center text-sm font-medium">Выручка</th>
                  <th className="p-4 text-center text-sm font-medium">Конверсия</th>
                  <th className="p-4 text-center text-sm font-medium">Средний чек</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Нет данных за выбранный период
                    </td>
                  </tr>
                ) : (
                  analytics.map((item, idx) => (
                    <tr key={idx} className="hover:bg-accent/10 transition-colors">
                      <td className="p-4">
                        <code className="px-2 py-1 bg-accent rounded text-sm">
                          {item.source}
                        </code>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{item.medium}</td>
                      <td className="p-4 text-sm">{item.campaign}</td>
                      <td className="p-4 text-center font-medium">{item.views.toLocaleString()}</td>
                      <td className="p-4 text-center font-medium text-green-600 dark:text-green-400">
                        {item.registrations.toLocaleString()}
                      </td>
                      <td className="p-4 text-center font-medium text-purple-600 dark:text-purple-400">
                        {item.payments.toLocaleString()}
                      </td>
                      <td className="p-4 text-center font-bold text-yellow-600 dark:text-yellow-400">
                        {item.totalValue.toLocaleString()} ₽
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.conversionRate >= 10 ? 'bg-green-500/20 text-green-600' :
                          item.conversionRate >= 5 ? 'bg-yellow-500/20 text-yellow-600' :
                          'bg-red-500/20 text-red-600'
                        }`}>
                          {item.conversionRate}%
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium">
                        {item.avgRevenue.toLocaleString()} ₽
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
