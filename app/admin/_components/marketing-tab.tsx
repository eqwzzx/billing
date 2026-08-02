"use client"

import Link from "next/link"
import { TrendingUp, BarChart3, Percent, Link2 } from "lucide-react"

export function MarketingTab() {
  const marketingPages = [
    {
      title: "Аналитика",
      description: "UTM метки, источники трафика и конверсии",
      href: "/admin/marketing",
      icon: BarChart3,
      color: "blue"
    },
    {
      title: "Генератор UTM",
      description: "Создание ссылок с UTM метками",
      href: "/admin/marketing/utm-generator",
      icon: Link2,
      color: "emerald"
    },
    {
      title: "Глобальная скидка",
      description: "Управление общей скидкой на все тарифы",
      href: "/admin/marketing/discount",
      icon: Percent,
      color: "orange"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="size-6" />
          Маркетинг
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Аналитика, UTM метки и промо-акции
        </p>
      </div>

      {/* Marketing Pages Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketingPages.map((page) => {
          const Icon = page.icon
          const colorClasses = {
            blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            orange: "bg-orange-500/10 text-orange-500 border-orange-500/20"
          }

          return (
            <Link
              key={page.href}
              href={page.href}
              className="group relative rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-foreground/20 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${colorClasses[page.color as keyof typeof colorClasses]}`}>
                  <Icon className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-foreground transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {page.description}
                  </p>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="size-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">ℹ️ Информация</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• Аналитика показывает статистику по источникам трафика и конверсиям</li>
          <li>• UTM генератор помогает создавать ссылки для отслеживания рекламных кампаний</li>
          <li>• Глобальная скидка применяется ко всем тарифам на сайте</li>
        </ul>
      </div>
    </div>
  )
}
