"use client"

import { useState, useEffect } from "react"
import { Settings, Server, Cloud, Code, Eye, EyeOff, Save, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface CategoryVisibility {
  id: string
  category: 'MINECRAFT' | 'VDS' | 'CODING'
  isVisible: boolean
  maintenanceMessage: string | null
  updatedAt: string
  updatedBy: string | null
}

const categoryIcons = {
  MINECRAFT: Server,
  VDS: Cloud,
  CODING: Code,
}

const categoryLabels = {
  MINECRAFT: 'Minecraft',
  VDS: 'VDS',
  CODING: 'Coding',
}

const categoryColors = {
  MINECRAFT: 'emerald',
  VDS: 'blue',
  CODING: 'purple',
}

export function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryVisibility[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        
        // Инициализируем сообщения
        const messages: Record<string, string> = {}
        data.forEach((cat: CategoryVisibility) => {
          messages[cat.category] = cat.maintenanceMessage || ''
        })
        setEditingMessage(messages)
      }
    } catch (error) {
      toast.error('Ошибка загрузки категорий')
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (category: string, currentVisible: boolean) => {
    setSaving(category)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          isVisible: !currentVisible,
        })
      })

      if (res.ok) {
        toast.success(`${categoryLabels[category as keyof typeof categoryLabels]} ${!currentVisible ? 'включён' : 'скрыт'}`)
        loadCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка обновления')
      }
    } catch (error) {
      toast.error('Ошибка сети')
    } finally {
      setSaving(null)
    }
  }

  const saveMessage = async (category: string) => {
    setSaving(category)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          maintenanceMessage: editingMessage[category] || null,
        })
      })

      if (res.ok) {
        toast.success('Сообщение сохранено')
        loadCategories()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка сохранения')
      }
    } catch (error) {
      toast.error('Ошибка сети')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="size-6" />
            Управление категориями
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Скрывайте категории при технических работах
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="grid gap-4">
          {categories.map(category => {
            const Icon = categoryIcons[category.category]
            const label = categoryLabels[category.category]
            const color = categoryColors[category.category]
            const isVisible = category.isVisible

            return (
              <div
                key={category.id}
                className={`border rounded-xl p-6 transition-all ${
                  isVisible 
                    ? `border-${color}-500/20 bg-${color}-500/5` 
                    : 'border-border bg-muted/30 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      isVisible 
                        ? `bg-${color}-500/10` 
                        : 'bg-muted'
                    }`}>
                      <Icon className={`size-6 ${
                        isVisible 
                          ? `text-${color}-500` 
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isVisible ? 'Видимо пользователям' : 'Скрыто от пользователей'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleVisibility(category.category, isVisible)}
                    disabled={saving === category.category}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isVisible
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {saving === category.category ? (
                      <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isVisible ? (
                      <>
                        <EyeOff className="size-4" />
                        Скрыть
                      </>
                    ) : (
                      <>
                        <Eye className="size-4" />
                        Показать
                      </>
                    )}
                  </button>
                </div>

                {!isVisible && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertTriangle className="size-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-500">Категория скрыта</p>
                        <p className="text-xs text-amber-500/80 mt-1">
                          Пользователи не смогут создавать серверы этого типа
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Сообщение для пользователей (опционально)
                      </label>
                      <textarea
                        value={editingMessage[category.category] || ''}
                        onChange={(e) => setEditingMessage({
                          ...editingMessage,
                          [category.category]: e.target.value
                        })}
                        placeholder="Например: Технические работы. Категория будет доступна через 2 часа."
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                        rows={3}
                      />
                      <button
                        onClick={() => saveMessage(category.category)}
                        disabled={saving === category.category}
                        className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving === category.category ? (
                          <div className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="size-3" />
                        )}
                        Сохранить сообщение
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-2">ℹ️ Информация</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• Скрытые категории не будут отображаться на странице создания сервера</li>
          <li>• Существующие серверы скрытых категорий продолжат работать</li>
          <li>• Сообщение о технических работах отображается пользователям при попытке выбрать категорию</li>
          <li>• Изменения вступают в силу немедленно</li>
        </ul>
      </div>
    </div>
  )
}
