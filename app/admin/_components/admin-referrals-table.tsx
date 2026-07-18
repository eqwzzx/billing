"use client"

import { useState } from "react"
import { Edit, Trash2, Copy, CheckCircle, XCircle, Eye, TrendingUp, Users, DollarSign, Link as LinkIcon } from "lucide-react"
import { notify } from "@/lib/notify"

interface ReferralLink {
  id: string
  code: string
  name: string
  url: string
  isActive: boolean
  expiresAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  stats: {
    views: number
    registrations: number
    deposits: number
    totalRevenue: number
    conversionRate: string
    depositRate: string
  }
}

interface AdminReferralsTableProps {
  links: ReferralLink[]
  onEdit: (link: ReferralLink) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

export function AdminReferralsTable({ links, onEdit, onDelete, onToggleActive }: AdminReferralsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      notify.success("Ссылка скопирована!")
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      notify.error("Ошибка копирования")
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="space-y-4">
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="size-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Всего переходов</span>
          </div>
          <p className="text-2xl font-bold">
            {links.reduce((sum, link) => sum + link.stats.views, 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <Users className="size-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Регистраций</span>
          </div>
          <p className="text-2xl font-bold">
            {links.reduce((sum, link) => sum + link.stats.registrations, 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Пополнений</span>
          </div>
          <p className="text-2xl font-bold">
            {links.reduce((sum, link) => sum + link.stats.deposits, 0).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="size-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Доход</span>
          </div>
          <p className="text-2xl font-bold">
            {links.reduce((sum, link) => sum + link.stats.totalRevenue, 0).toFixed(2)} ₽
          </p>
        </div>
      </div>

      {/* Таблица ссылок */}
      <div className="rounded-xl border border-border overflow-hidden bg-background/50 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-accent/30">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Код</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Название</th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">Статус</th>
                <th className="p-4 text-center text-sm font-medium text-muted-foreground">Переходы</th>
                <th className="p-4 text-center text-sm font-medium text-muted-foreground">Регистрации</th>
                <th className="p-4 text-center text-sm font-medium text-muted-foreground">Пополнения</th>
                <th className="p-4 text-center text-sm font-medium text-muted-foreground">Доход</th>
                <th className="p-4 text-center text-sm font-medium text-muted-foreground">Конверсия</th>
                <th className="p-4 text-right text-sm font-medium text-muted-foreground">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Нет реферальных ссылок
                  </td>
                </tr>
              ) : (
                links.map((link) => {
                  const expired = isExpired(link.expiresAt)
                  return (
                    <tr key={link.id} className="hover:bg-accent/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-accent rounded text-sm font-mono">
                            {link.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(link.url, link.id)}
                            className="p-1 hover:bg-accent rounded transition-colors"
                            title="Копировать ссылку"
                          >
                            {copiedId === link.id ? (
                              <CheckCircle className="size-4 text-green-500" />
                            ) : (
                              <Copy className="size-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{link.name}</p>
                          {link.expiresAt && (
                            <p className={`text-xs mt-1 ${expired ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {expired ? 'Истекла: ' : 'Истекает: '}
                              {formatDate(link.expiresAt)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => onToggleActive(link.id, !link.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            link.isActive && !expired
                              ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                          }`}
                        >
                          {link.isActive && !expired ? 'Активна' : expired ? 'Истекла' : 'Неактивна'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="size-4 text-muted-foreground" />
                          <span className="font-medium">{link.stats.views.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="size-4 text-muted-foreground" />
                          <span className="font-medium">{link.stats.registrations.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="size-4 text-muted-foreground" />
                          <span className="font-medium">{link.stats.deposits.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {link.stats.totalRevenue.toFixed(2)} ₽
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Рег: {link.stats.conversionRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Поп: {link.stats.depositRate}%
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(link)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="size-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => onDelete(link.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
