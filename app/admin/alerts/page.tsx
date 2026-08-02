"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Bell, Plus, Edit, Trash2, Eye, EyeOff, AlertTriangle, Info, X, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Alert {
  id: string
  type: 'INFO' | 'WARNING' | 'ERROR'
  message: string
  actionLabel: string | null
  actionUrl: string | null
  isActive: boolean
  isSystem: boolean
  systemType: string | null
  priority: number
  hideAfterFirstDiscount: boolean
  createdAt: string
  updatedAt: string
}

export default function AlertsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)

  const [formData, setFormData] = useState({
    type: 'INFO' as 'INFO' | 'WARNING' | 'ERROR',
    message: '',
    actionLabel: '',
    actionUrl: '',
    isActive: true,
    priority: 0,
    hideAfterFirstDiscount: false,
  })

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
        loadAlerts()
      } catch {
        setIsAuthorized(false)
        router.push('/client')
      }
    }
    checkAuth()
  }, [router])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch (error) {
      toast.error('Ошибка загрузки alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAlert(null)
    setFormData({
      type: 'INFO',
      message: '',
      actionLabel: '',
      actionUrl: '',
      isActive: true,
      priority: 0,
      hideAfterFirstDiscount: false,
    })
    setShowModal(true)
  }

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert)
    setFormData({
      type: alert.type,
      message: alert.message,
      actionLabel: alert.actionLabel || '',
      actionUrl: alert.actionUrl || '',
      isActive: alert.isActive,
      priority: alert.priority,
      hideAfterFirstDiscount: alert.hideAfterFirstDiscount,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editingAlert 
        ? `/api/admin/alerts/${editingAlert.id}`
        : '/api/admin/alerts'
      
      const res = await fetch(url, {
        method: editingAlert ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          actionLabel: formData.actionLabel || null,
          actionUrl: formData.actionUrl || null,
        })
      })

      if (res.ok) {
        toast.success(editingAlert ? 'Alert обновлён' : 'Alert создан')
        setShowModal(false)
        loadAlerts()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка')
      }
    } catch (error) {
      toast.error('Ошибка сохранения')
    }
  }

  const toggleActive = async (alert: Alert) => {
    try {
      const res = await fetch(`/api/admin/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !alert.isActive })
      })

      if (res.ok) {
        toast.success(alert.isActive ? 'Alert отключён' : 'Alert включён')
        loadAlerts()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка обновления')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error('Ошибка обновления')
    }
  }

  const handleDelete = async (alert: Alert) => {
    if (!confirm('Удалить этот alert?')) return

    try {
      const res = await fetch(`/api/admin/alerts/${alert.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Alert удалён')
        loadAlerts()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка удаления')
      }
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Проверка доступа...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-auto max-w-[calc(100%-1rem)]">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/80 px-4 py-2 shadow-lg backdrop-blur-md">
          <Link href="/admin" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="size-4" />
            <span className="text-sm font-medium">Назад</span>
          </Link>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          <Link href="/admin" className="flex items-center gap-2 px-2">
            <Image src="/logo.svg" alt="Fluxor" width={24} height={24} className="size-6 brightness-0 dark:brightness-100" />
            <span className="font-heading font-bold text-foreground">Admin</span>
          </Link>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-foreground text-background">
            <Bell className="size-4" />
            <span className="text-sm font-medium">Alerts</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="size-6" />
              Управление Alerts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Системные и кастомные уведомления для пользователей
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Создать Alert
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const typeColors = {
                INFO: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                WARNING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                ERROR: 'bg-red-500/10 text-red-500 border-red-500/20',
              }

              return (
                <div
                  key={alert.id}
                  className={`border rounded-xl p-4 ${!alert.isActive ? 'opacity-50' : ''} ${typeColors[alert.type]}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {alert.type === 'INFO' && <Info className="size-4" />}
                        {alert.type === 'WARNING' && <AlertTriangle className="size-4" />}
                        {alert.type === 'ERROR' && <AlertTriangle className="size-4" />}
                        <span className="font-semibold text-sm">
                          {alert.type}
                          {alert.isSystem && (
                            <span className="ml-2 text-xs bg-foreground/10 px-2 py-0.5 rounded">
                              System: {alert.systemType}
                            </span>
                          )}
                          {alert.hideAfterFirstDiscount && (
                            <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded" title="Скрывается после использования скидки первого заказа">
                              🎁 Для новых
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      {alert.actionLabel && (
                        <div className="text-xs text-muted-foreground">
                          Действие: {alert.actionLabel} → {alert.actionUrl}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Приоритет: {alert.priority}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(alert)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                        title={alert.isActive ? 'Отключить' : 'Включить'}
                      >
                        {alert.isActive ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(alert)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                        title="Редактировать"
                      >
                        <Edit className="size-4" />
                      </button>
                      {!alert.isSystem && (
                        <button
                          onClick={() => handleDelete(alert)}
                          className="p-2 hover:bg-white/10 rounded-lg"
                          title="Удалить"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {alerts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Нет alerts. Создайте первый!
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingAlert ? 'Редактировать Alert' : 'Создать Alert'}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Тип</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    disabled={editingAlert?.isSystem}
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Сообщение</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    rows={3}
                    placeholder="Текст уведомления..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Кнопка (необязательно)</label>
                  <input
                    type="text"
                    value={formData.actionLabel}
                    onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg mb-2"
                    placeholder="Текст кнопки"
                  />
                  <input
                    type="text"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    placeholder="URL или путь"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Приоритет (0 = высший)</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="size-4"
                  />
                  <label className="text-sm">Активен</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hideAfterFirstDiscount}
                    onChange={(e) => setFormData({ ...formData, hideAfterFirstDiscount: e.target.checked })}
                    className="size-4"
                  />
                  <label className="text-sm">
                    Скрывать после использования скидки первого заказа
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted/50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {editingAlert ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
