"use client"

import { useState } from "react"
import { X, RefreshCw, Wallet, TrendingDown, Calendar } from "lucide-react"

interface RenewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (days: number) => Promise<void>
  serviceName: string
  pricePerMonth: number
  currentBalance: number
  minDays?: number
  maxDays?: number
}

export function RenewModal({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
  pricePerMonth,
  currentBalance,
  minDays = 1,
  maxDays = 365,
}: RenewModalProps) {
  const [days, setDays] = useState(30)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  // Расчёт стоимости за выбранный период
  const totalCost = (pricePerMonth / 30) * days
  const balanceAfter = currentBalance - totalCost
  const isInsufficientBalance = balanceAfter < 0

  const handleConfirm = async () => {
    if (isInsufficientBalance || isProcessing) return
    
    setIsProcessing(true)
    try {
      await onConfirm(days)
      onClose()
    } catch (error) {
      console.error('Renewal error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDaysChange = (value: string) => {
    const numValue = parseInt(value) || minDays
    const clampedValue = Math.max(minDays, Math.min(maxDays, numValue))
    setDays(clampedValue)
  }

  // Быстрый выбор периода
  const quickPeriods = [
    { label: '30 дней', days: 30 },
    { label: '60 дней', days: 60 },
    { label: '90 дней', days: 90 },
    { label: '180 дней', days: 180 },
  ]

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <RefreshCw className="size-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Продление сервиса</h2>
              <p className="text-sm text-muted-foreground">{serviceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Срок продления */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="size-4" />
              Срок продления
            </label>
            
            {/* Быстрый выбор */}
            <div className="grid grid-cols-4 gap-2">
              {quickPeriods.map((period) => (
                <button
                  key={period.days}
                  onClick={() => setDays(period.days)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    days === period.days
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Ручной ввод */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={minDays}
                max={maxDays}
                value={days}
                onChange={(e) => handleDaysChange(e.target.value)}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">дней</span>
            </div>

            {days < minDays || days > maxDays ? (
              <p className="text-xs text-amber-500">
                Срок должен быть от {minDays} до {maxDays} дней
              </p>
            ) : null}
          </div>

          {/* Информация о стоимости */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Цена за месяц:</span>
              <span className="font-medium text-foreground">{pricePerMonth.toFixed(2)} ₽</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Стоимость продления ({days} дн.):</span>
              <span className="font-bold text-lg text-foreground">{totalCost.toFixed(2)} ₽</span>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Wallet className="size-4" />
                Текущий баланс:
              </span>
              <span className="font-medium text-foreground">{currentBalance.toFixed(2)} ₽</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingDown className="size-4" />
                Баланс после продления:
              </span>
              <span className={`font-medium ${isInsufficientBalance ? 'text-red-500' : 'text-emerald-500'}`}>
                {balanceAfter.toFixed(2)} ₽
              </span>
            </div>

            {isInsufficientBalance && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-500 font-medium">
                  ⚠️ Недостаточно средств на балансе
                </p>
                <p className="text-xs text-red-400 mt-1">
                  Необходимо пополнить на {Math.abs(balanceAfter).toFixed(2)} ₽
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={isInsufficientBalance || isProcessing}
            className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Подтвердить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
