"use client"

import { useState, useEffect } from "react"
import { notify } from "@/lib/notify"
import { Plus, X, Save, Link as LinkIcon } from "lucide-react"
import { AdminReferralsTable } from "./admin-referrals-table"

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

export function ReferralsTab() {
  const [links, setLinks] = useState<ReferralLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewLink, setShowNewLink] = useState(false)
  const [editingLink, setEditingLink] = useState<ReferralLink | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    expiresAt: '',
  })

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/referrals')
      if (res.ok) {
        const data = await res.json()
        setLinks(data)
      } else {
        notify.error('Ошибка загрузки реферальных ссылок')
      }
    } catch (error) {
      notify.error('Ошибка загрузки данных')
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setShowNewLink(true)
    setEditingLink(null)
    setFormData({ code: '', name: '', expiresAt: '' })
  }

  const handleEdit = (link: ReferralLink) => {
    setEditingLink(link)
    setShowNewLink(true)
    setFormData({
      code: link.code,
      name: link.name,
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
    })
  }

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      notify.error('Заполните все обязательные поля')
      return
    }

    try {
      const url = '/api/admin/referrals'
      const method = editingLink ? 'PATCH' : 'POST'
      
      const body: any = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        expiresAt: formData.expiresAt || null,
      }

      if (editingLink) {
        body.id = editingLink.id
        delete body.code // Код нельзя изменить
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        notify.success(editingLink ? 'Ссылка обновлена' : 'Ссылка создана')
        setShowNewLink(false)
        setEditingLink(null)
        setFormData({ code: '', name: '', expiresAt: '' })
        loadLinks()
      } else {
        const data = await res.json()
        notify.error(data.error || 'Ошибка сохранения')
      }
    } catch (error) {
      notify.error('Ошибка сохранения')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить реферальную ссылку? Статистика будет утеряна.')) return

    try {
      const res = await fetch(`/api/admin/referrals?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        notify.success('Ссылка удалена')
        loadLinks()
      } else {
        const data = await res.json()
        notify.error(data.error || 'Ошибка удаления')
      }
    } catch (error) {
      notify.error('Ошибка удаления')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      })

      if (res.ok) {
        notify.success(isActive ? 'Ссылка активирована' : 'Ссылка деактивирована')
        loadLinks()
      } else {
        notify.error('Ошибка обновления статуса')
      }
    } catch (error) {
      notify.error('Ошибка обновления')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LinkIcon className="size-8 text-foreground" />
          <div>
            <h2 className="text-2xl font-heading font-bold">Реферальные ссылки</h2>
            <p className="text-sm text-muted-foreground">Управление и статистика</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="size-5" />
          Создать ссылку
        </button>
      </div>

      {/* Форма создания/редактирования */}
      {showNewLink && (
        <div className="p-6 rounded-xl border border-border bg-accent/30 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              {editingLink ? 'Редактировать ссылку' : 'Новая реферальная ссылка'}
            </h3>
            <button
              onClick={() => {
                setShowNewLink(false)
                setEditingLink(null)
                setFormData({ code: '', name: '', expiresAt: '' })
              }}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Код ссылки <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="PROMO2024"
                disabled={!!editingLink}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Уникальный код для ссылки (латиница, цифры)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Зимняя акция 2024"
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Описание для идентификации ссылки
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Срок действия (опционально)
              </label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Оставьте пустым для бессрочной ссылки
              </p>
            </div>
          </div>

          {editingLink && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Текущая ссылка:</strong> {editingLink.url}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              onClick={() => {
                setShowNewLink(false)
                setEditingLink(null)
                setFormData({ code: '', name: '', expiresAt: '' })
              }}
              className="px-4 py-2 rounded-xl border border-border hover:bg-accent transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity"
            >
              <Save className="size-4" />
              {editingLink ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      )}

      {/* Таблица ссылок */}
      <AdminReferralsTable
        links={links}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
    </div>
  )
}
