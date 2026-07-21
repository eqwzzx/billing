"use client"

import { useState, useEffect } from "react"
import { 
  CreditCard, RefreshCw, CheckCircle, XCircle, Clock, 
  DollarSign, Download, Eye, Ban, RotateCcw, AlertCircle
} from "lucide-react"
import { notify } from "@/lib/notify"

interface PlategaTransaction {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod?: string
  externalId?: string | null
  createdAt: string
  description: string
  user: { 
    id: string
    email: string
    name: string | null 
  }
}

interface PlategaBalance {
  currency: string
  amount: number
  hold: number
  available: number
}

interface AdminPlategaPaymentsTableProps {
  searchQuery: string
}

const statusColors: Record<string, string> = { 
  PENDING: 'bg-amber-500/20 text-amber-500', 
  PROCESSING: 'bg-blue-500/20 text-blue-500',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-500', 
  CANCELED: 'bg-red-500/20 text-red-500',
  CHARGEBACKED: 'bg-purple-500/20 text-purple-500',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидание',
  PROCESSING: 'Обработка',
  CONFIRMED: 'Подтверждено',
  CANCELED: 'Отменено',
  CHARGEBACKED: 'Возврат',
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'CONFIRMED': return <CheckCircle className="size-4 text-emerald-500" />
    case 'CANCELED': return <XCircle className="size-4 text-red-500" />
    case 'CHARGEBACKED': return <RotateCcw className="size-4 text-purple-500" />
    case 'PROCESSING': return <Clock className="size-4 text-blue-500 animate-spin" />
    default: return <Clock className="size-4 text-amber-500" />
  }
}

export function AdminPlategaPaymentsTable({ searchQuery }: AdminPlategaPaymentsTableProps) {
  const [transactions, setTransactions] = useState<PlategaTransaction[]>([])
  const [balances, setBalances] = useState<PlategaBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<PlategaTransaction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelInfo, setCancelInfo] = useState<any>(null)

  const loadTransactions = async () => {
    try {
      const r = await fetch('/api/admin/platega/transactions')
      if (r.ok) {
        const data = await r.json()
        setTransactions(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('[Admin] Error loading Platega transactions:', e)
      notify.error('Ошибка загрузки транзакций')
    }
  }

  const loadBalances = async () => {
    try {
      const r = await fetch('/api/admin/platega/balances')
      if (r.ok) {
        const data = await r.json()
        setBalances(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('[Admin] Error loading Platega balances:', e)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([loadTransactions(), loadBalances()])
      setLoading(false)
    }
    load()
  }, [])

  const handleRefresh = async () => {
    await loadTransactions()
    await loadBalances()
    notify.success('Данные обновлены')
  }

  const handleViewDetails = async (transaction: PlategaTransaction) => {
    setSelectedTransaction(transaction)
    
    // Проверяем возможность отмены
    if (transaction.externalId && transaction.status === 'CONFIRMED') {
      try {
        const r = await fetch(`/api/admin/platega/transaction/${transaction.externalId}/cancel-check`)
        if (r.ok) {
          const data = await r.json()
          setCancelInfo(data)
        }
      } catch (e) {
        console.error('[Admin] Error checking cancel:', e)
      }
    }
  }

  const handleCancelTransaction = async (transactionId: string) => {
    if (!confirm('Отменить транзакцию и вернуть средства плательщику?')) return

    setActionLoading(true)
    try {
      const r = await fetch(`/api/admin/platega/transaction/${transactionId}/cancel`, {
        method: 'POST',
      })
      
      if (r.ok) {
        const data = await r.json()
        notify.success(data.message || 'Запрос на отмену отправлен')
        setSelectedTransaction(null)
        setCancelInfo(null)
        await loadTransactions()
      } else {
        const data = await r.json()
        notify.error(data.error || 'Ошибка отмены')
      }
    } catch (e) {
      notify.error('Ошибка отмены транзакции')
    }
    setActionLoading(false)
  }

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const r = await fetch(`/api/admin/platega/export?format=${format}`)
      if (r.ok) {
        const data = await r.json()
        if (data.url) {
          window.open(data.url, '_blank')
          notify.success(`Экспорт в ${format.toUpperCase()} готов`)
        }
      } else {
        notify.error('Ошибка экспорта')
      }
    } catch (e) {
      notify.error('Ошибка экспорта')
    }
  }

  const filteredTransactions = transactions.filter(t => 
    !searchQuery || 
    t.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.externalId?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAmount = filteredTransactions
    .filter(t => t.status === 'CONFIRMED')
    .reduce((acc, t) => acc + t.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="size-8 text-muted-foreground animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Платежи Platega
          </h1>
          <p className="text-sm text-muted-foreground">
            Всего: {transactions.length} • Подтверждено: {totalAmount.toLocaleString()} ₽
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 rounded-xl bg-accent flex items-center gap-2 text-sm text-foreground hover:bg-accent/80 transition-colors"
          >
            <Download className="size-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-2 rounded-xl bg-accent flex items-center gap-2 text-sm text-foreground hover:bg-accent/80 transition-colors"
          >
            <Download className="size-4" />
            Excel
          </button>
          <button 
            onClick={handleRefresh}
            className="size-9 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Balances */}
      {balances.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {balances.map((balance) => (
            <div key={balance.currency} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Баланс {balance.currency}
                </span>
                <DollarSign className="size-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{balance.available.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Холд: {balance.hold.toFixed(2)} • Всего: {balance.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Подтверждено</span>
            <CheckCircle className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {transactions.filter(t => t.status === 'CONFIRMED').length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Ожидание</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {transactions.filter(t => t.status === 'PENDING').length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Отменено</span>
            <XCircle className="size-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {transactions.filter(t => t.status === 'CANCELED').length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Возвраты</span>
            <RotateCcw className="size-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {transactions.filter(t => t.status === 'CHARGEBACKED').length}
          </p>
        </div>
      </div>

      {/* Transactions table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Дата</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Пользователь</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Сумма</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Описание</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Статус</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {new Date(transaction.createdAt).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {transaction.user.name || transaction.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {transaction.user.email}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm font-medium text-emerald-500">
                    {transaction.amount.toLocaleString()} {transaction.currency}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground max-w-xs truncate">
                  {transaction.description || '—'}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={transaction.status} />
                    <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[transaction.status] || 'bg-gray-500/20 text-gray-500'}`}>
                      {statusLabels[transaction.status] || transaction.status}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleViewDetails(transaction)}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                    title="Подробности"
                  >
                    <Eye className="size-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTransactions.length === 0 && (
          <div className="px-5 py-12 text-center text-muted-foreground">
            <CreditCard className="size-12 mx-auto mb-3 opacity-50" />
            <p>Транзакции не найдены</p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Детали транзакции</h2>
              <button 
                onClick={() => { setSelectedTransaction(null); setCancelInfo(null) }}
                className="size-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <XCircle className="size-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID транзакции</p>
                  <p className="text-sm font-mono text-foreground">{selectedTransaction.externalId || selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Статус</p>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={selectedTransaction.status} />
                    <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[selectedTransaction.status]}`}>
                      {statusLabels[selectedTransaction.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Сумма</p>
                  <p className="text-lg font-bold text-emerald-500">
                    {selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Дата создания</p>
                  <p className="text-sm text-foreground">
                    {new Date(selectedTransaction.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Пользователь</p>
                <p className="text-sm font-medium text-foreground">{selectedTransaction.user.name || 'Без имени'}</p>
                <p className="text-sm text-muted-foreground">{selectedTransaction.user.email}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Описание</p>
                <p className="text-sm text-foreground">{selectedTransaction.description || '—'}</p>
              </div>

              {cancelInfo && (
                <div className="rounded-xl border border-border bg-accent/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">Информация о возврате</p>
                      {cancelInfo.supported ? (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>✅ Возврат доступен</p>
                          <p>Будет списано: {cancelInfo.totalDeductUsdt} USDT</p>
                          {cancelInfo.penaltyUsdt && (
                            <p>Штраф: {cancelInfo.penaltyUsdt} USDT</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>❌ Возврат недоступен</p>
                          {cancelInfo.blockReason && (
                            <p>Причина: {cancelInfo.blockReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedTransaction.externalId && selectedTransaction.status === 'CONFIRMED' && (
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => { setSelectedTransaction(null); setCancelInfo(null) }}
                  className="flex-1 px-4 py-2 rounded-xl bg-accent text-foreground hover:bg-accent/80 transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => handleCancelTransaction(selectedTransaction.externalId!)}
                  disabled={actionLoading || (cancelInfo && !cancelInfo.supported)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Ban className="size-4" />
                  {actionLoading ? 'Отмена...' : 'Отменить платёж'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
