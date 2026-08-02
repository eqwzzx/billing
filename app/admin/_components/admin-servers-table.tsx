"use client"

import { Server, RefreshCw, DollarSign, Trash2 } from "lucide-react"
import { useState } from "react"

interface ServerData {
  id: string
  name: string
  status: string
  pterodactylId: number | null
  pterodactylIdentifier: string | null
  expiresAt: string | null
  createdAt: string
  user: { id: string; email: string; name: string | null }
  plan: { id: string; name: string; price: number }
  node: { id: string; name: string; locationName: string | null } | null
  egg: { id: string; name: string } | null
  refundedAmount?: number | null
  refundedAt?: string | null
}

interface AdminServersTableProps {
  servers: ServerData[]
  searchQuery: string
  onRefresh: () => void
  onServerAction: (serverId: string, action: string, force?: boolean) => void
}

interface RefundModalData {
  serverId: string
  serverName: string
  userEmail: string
  refundAmount: number
  refundPercentage: number
  usedDays: number
  remainingDays: number
  totalDays: number
}

const statusColors: Record<string, string> = { 
  PENDING: 'bg-amber-500/20 text-amber-500', 
  INSTALLING: 'bg-blue-500/20 text-blue-500', 
  ACTIVE: 'bg-emerald-500/20 text-emerald-500', 
  SUSPENDED: 'bg-red-500/20 text-red-500', 
  OFF: 'bg-gray-500/20 text-gray-500',
  RESTARTING: 'bg-blue-500/20 text-blue-500',
  DELETED: 'bg-gray-500/20 text-gray-500' 
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидание',
  INSTALLING: 'Установка',
  ACTIVE: 'Онлайн',
  SUSPENDED: 'Заморожен',
  OFF: 'Выключен',
  RESTARTING: 'Перезагружается',
  DELETED: 'Удален'
}

export function AdminServersTable({ 
  servers, 
  searchQuery, 
  onRefresh, 
  onServerAction 
}: AdminServersTableProps) {
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [refundData, setRefundData] = useState<RefundModalData | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [loadingRefund, setLoadingRefund] = useState(false)
  const [calculatingRefund, setCalculatingRefund] = useState(false)
  
  // Permanent delete modal state
  const [permanentDeleteModalOpen, setPermanentDeleteModalOpen] = useState(false)
  const [permanentDeleteData, setPermanentDeleteData] = useState<RefundModalData & { 
    alreadyRefunded: boolean
    previousRefundAmount?: number 
  } | null>(null)
  const [permanentDeleteReason, setPermanentDeleteReason] = useState("")
  const [loadingPermanentDelete, setLoadingPermanentDelete] = useState(false)
  const [calculatingPermanentDelete, setCalculatingPermanentDelete] = useState(false)

  const activeServers = servers.filter(s => s.status !== 'DELETED').length
  
  const filteredServers = servers.filter(s => 
    !searchQuery || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRefundClick = async (serverId: string, serverName: string, userEmail: string) => {
    setCalculatingRefund(true)
    try {
      const response = await fetch(`/api/admin/servers/refund?serverId=${serverId}`)
      if (response.ok) {
        const data = await response.json()
        setRefundData({
          serverId,
          serverName,
          userEmail,
          refundAmount: data.refund.refundAmount,
          refundPercentage: data.refund.refundPercentage,
          usedDays: data.refund.usedDays,
          remainingDays: data.refund.remainingDays,
          totalDays: data.refund.totalDays,
        })
        setRefundModalOpen(true)
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error("Error calculating refund:", error)
      alert("Ошибка при расчете возврата")
    } finally {
      setCalculatingRefund(false)
    }
  }

  const handleRefundConfirm = async () => {
    if (!refundData) return
    
    setLoadingRefund(true)
    try {
      const response = await fetch('/api/admin/servers/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: refundData.serverId,
          reason: refundReason,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message}`)
        setRefundModalOpen(false)
        setRefundData(null)
        setRefundReason("")
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error("Error processing refund:", error)
      alert("Ошибка при возврате средств")
    } finally {
      setLoadingRefund(false)
    }
  }

  const handlePermanentDeleteClick = async (serverId: string, serverName: string, userEmail: string) => {
    setCalculatingPermanentDelete(true)
    try {
      const response = await fetch(`/api/admin/servers/permanent-delete?serverId=${serverId}`)
      if (response.ok) {
        const data = await response.json()
        setPermanentDeleteData({
          serverId,
          serverName,
          userEmail,
          refundAmount: data.refund?.refundAmount || 0,
          refundPercentage: data.refund?.refundPercentage || 0,
          usedDays: data.refund?.usedDays || 0,
          remainingDays: data.refund?.remainingDays || 0,
          totalDays: data.refund?.totalDays || 0,
          alreadyRefunded: data.alreadyRefunded,
          previousRefundAmount: data.previousRefundAmount,
        })
        setPermanentDeleteModalOpen(true)
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error("Error calculating permanent delete:", error)
      alert("Ошибка при расчете возврата")
    } finally {
      setCalculatingPermanentDelete(false)
    }
  }

  const handlePermanentDeleteConfirm = async () => {
    if (!permanentDeleteData) return
    
    setLoadingPermanentDelete(true)
    try {
      const response = await fetch('/api/admin/servers/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: permanentDeleteData.serverId,
          reason: permanentDeleteReason,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message}`)
        setPermanentDeleteModalOpen(false)
        setPermanentDeleteData(null)
        setPermanentDeleteReason("")
        onRefresh()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error("Error processing permanent delete:", error)
      alert("Ошибка при удалении сервера")
    } finally {
      setLoadingPermanentDelete(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">{activeServers} серверов</h1>
        <button 
          onClick={onRefresh} 
          className="size-9 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>
      
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Сервер</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Владелец</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Тариф</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Нода</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Статус</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredServers.map((server) => (
              <tr key={server.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-accent flex items-center justify-center">
                      <Server className="size-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{server.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{server.user.email}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{server.plan.name}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{server.node?.name || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[server.status]}`}>
                    {statusLabels[server.status] || server.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    {server.status === 'DELETED' ? (
                      <button 
                        onClick={() => handlePermanentDeleteClick(server.id, server.name, server.user.email)}
                        disabled={calculatingPermanentDelete}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Полностью удалить с возвратом средств"
                      >
                        <Trash2 className="size-3" />
                        Удалить полностью
                      </button>
                    ) : (
                      <>
                        {(server.status === 'ACTIVE' || server.status === 'OFF') && (
                          <button 
                            onClick={() => onServerAction(server.id, 'suspend')} 
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {server.status === 'SUSPENDED' && (
                          <button 
                            onClick={() => onServerAction(server.id, 'unsuspend')} 
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                          >
                            Unsuspend
                          </button>
                        )}
                        <button 
                          onClick={() => handleRefundClick(server.id, server.name, server.user.email)}
                          disabled={calculatingRefund}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                          title="Удалить с возвратом средств"
                        >
                          <DollarSign className="size-3" />
                          Возврат
                        </button>
                        <button 
                          onClick={() => onServerAction(server.id, 'delete')} 
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={() => onServerAction(server.id, 'force_delete')} 
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors" 
                          title="Принудительное удаление (только из БД)"
                        >
                          Force
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredServers.length === 0 && (
          <div className="px-5 py-12 text-center text-muted-foreground">
            <Server className="size-12 mx-auto mb-3 opacity-50" />
            <p>Серверы не найдены</p>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundModalOpen && refundData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Возврат средств и удаление сервера
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Server Info */}
              <div className="rounded-xl bg-accent/30 p-4">
                <p className="text-sm text-muted-foreground mb-1">Сервер</p>
                <p className="font-semibold text-foreground">{refundData.serverName}</p>
                <p className="text-sm text-muted-foreground mt-2">Пользователь</p>
                <p className="text-sm text-foreground">{refundData.userEmail}</p>
              </div>

              {/* Refund Calculation */}
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Сумма возврата</span>
                  <span className="text-2xl font-bold text-green-500">{refundData.refundAmount} ₽</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Использовано</p>
                    <p className="font-semibold text-foreground">{refundData.usedDays} дн.</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Осталось</p>
                    <p className="font-semibold text-green-500">{refundData.remainingDays} дн.</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Всего</p>
                    <p className="font-semibold text-foreground">{refundData.totalDays} дн.</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-500/20">
                  <p className="text-xs text-muted-foreground">
                    Процент возврата: <span className="font-semibold text-green-500">{refundData.refundPercentage.toFixed(1)}%</span>
                  </p>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Причина удаления <span className="text-muted-foreground">(опционально)</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Например: Нарушение правил - спам..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              {/* Warning */}
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs text-red-500">
                  ⚠️ Это действие нельзя отменить. Сервер будет удален из Pterodactyl, 
                  средства будут возвращены на баланс пользователя.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleRefundConfirm}
                disabled={loadingRefund}
                className="flex-1 px-4 py-2.5 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRefund ? "Обработка..." : "Подтвердить возврат"}
              </button>
              <button
                onClick={() => {
                  setRefundModalOpen(false)
                  setRefundData(null)
                  setRefundReason("")
                }}
                disabled={loadingRefund}
                className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {permanentDeleteModalOpen && permanentDeleteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Полное удаление сервера
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Server Info */}
              <div className="rounded-xl bg-accent/30 p-4">
                <p className="text-sm text-muted-foreground mb-1">Сервер (Удален)</p>
                <p className="font-semibold text-foreground">{permanentDeleteData.serverName}</p>
                <p className="text-sm text-muted-foreground mt-2">Пользователь</p>
                <p className="text-sm text-foreground">{permanentDeleteData.userEmail}</p>
              </div>

              {/* Refund Info */}
              {permanentDeleteData.alreadyRefunded ? (
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-500 text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium text-blue-500">Средства уже возвращены</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ранее возвращено: <span className="font-semibold text-foreground">{permanentDeleteData.previousRefundAmount} ₽</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Сервер будет полностью удален из базы данных без дополнительного возврата.
                  </p>
                </div>
              ) : permanentDeleteData.refundAmount > 0 ? (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Сумма возврата</span>
                    <span className="text-2xl font-bold text-green-500">{permanentDeleteData.refundAmount} ₽</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Использовано</p>
                      <p className="font-semibold text-foreground">{permanentDeleteData.usedDays} дн.</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Осталось</p>
                      <p className="font-semibold text-green-500">{permanentDeleteData.remainingDays} дн.</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Всего</p>
                      <p className="font-semibold text-foreground">{permanentDeleteData.totalDays} дн.</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-500/20">
                    <p className="text-xs text-muted-foreground">
                      Процент возврата: <span className="font-semibold text-green-500">{permanentDeleteData.refundPercentage.toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-gray-500/10 border border-gray-500/20 p-4">
                  <p className="text-sm text-muted-foreground">
                    Возврат средств не требуется (срок истек или сумма = 0)
                  </p>
                </div>
              )}

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Причина удаления <span className="text-muted-foreground">(опционально)</span>
                </label>
                <textarea
                  value={permanentDeleteReason}
                  onChange={(e) => setPermanentDeleteReason(e.target.value)}
                  placeholder="Например: Очистка удаленных серверов..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              {/* Warning */}
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-xs text-red-500">
                  ⚠️ Это действие безвозвратно удалит сервер из базы данных. 
                  {!permanentDeleteData.alreadyRefunded && permanentDeleteData.refundAmount > 0 && 
                    " Средства будут возвращены на баланс пользователя."
                  }
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handlePermanentDeleteConfirm}
                disabled={loadingPermanentDelete}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPermanentDelete ? "Удаление..." : "Подтвердить удаление"}
              </button>
              <button
                onClick={() => {
                  setPermanentDeleteModalOpen(false)
                  setPermanentDeleteData(null)
                  setPermanentDeleteReason("")
                }}
                disabled={loadingPermanentDelete}
                className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export for use in dashboard recent servers
export function RecentServersTable({ 
  servers, 
  onViewAll 
}: { 
  servers: ServerData[]
  onViewAll: () => void 
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-medium text-foreground">Последние серверы</h3>
        <button onClick={onViewAll} className="text-sm text-primary hover:underline">Все →</button>
      </div>
      <div className="divide-y divide-border">
        {servers.slice(0, 5).map((server) => (
          <div key={server.id} className="px-5 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-accent flex items-center justify-center">
                <Server className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{server.name}</p>
                <p className="text-xs text-muted-foreground">{server.user.email}</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[server.status]}`}>
              {server.status}
            </span>
          </div>
        ))}
        {servers.length === 0 && (
          <div className="px-5 py-8 text-center text-muted-foreground">Нет серверов</div>
        )}
      </div>
    </div>
  )
}
