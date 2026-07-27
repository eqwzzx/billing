"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Info, X } from "lucide-react"

interface Alert {
  id: string
  type: 'warning' | 'info' | 'error'
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function AlertsBanner() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    console.log('[AlertsBanner] Loading alerts...')
    fetch("/api/user/alerts")
      .then(r => {
        console.log('[AlertsBanner] Response status:', r.status)
        return r.json()
      })
      .then(data => {
        console.log('[AlertsBanner] Alerts received:', data)
        if (Array.isArray(data) && data.length > 0) {
          const mappedAlerts = data.map((a: any) => ({
            id: a.id,
            type: a.type?.toLowerCase() as 'warning' | 'info' | 'error',
            message: a.message,
            action: a.actionLabel && a.actionUrl ? {
              label: a.actionLabel,
              onClick: () => {
                if (a.actionUrl.startsWith('http')) {
                  window.open(a.actionUrl, '_blank')
                } else if (a.actionUrl.startsWith('#')) {
                  document.getElementById(a.actionUrl.substring(1))?.scrollIntoView({ behavior: 'smooth' })
                } else {
                  router.push(a.actionUrl)
                }
              }
            } : undefined
          }))
          setAlerts(mappedAlerts)
          console.log('[AlertsBanner] Alerts set:', mappedAlerts.length)
        } else {
          console.log('[AlertsBanner] No alerts')
        }
      })
      .catch(err => {
        console.error('[AlertsBanner] Error:', err)
      })
  }, [router])

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2 mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {alerts.map((alert, index) => (
        <div 
          key={alert.id}
          className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${
            alert.type === 'warning' 
              ? 'bg-amber-500/5 border-amber-500/20' 
              : alert.type === 'error'
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-blue-500/5 border-blue-500/20'
          }`}
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
        >
          <div className={`size-5 sm:size-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
            alert.type === 'warning' 
              ? 'bg-amber-500/10' 
              : alert.type === 'error'
              ? 'bg-red-500/10'
              : 'bg-blue-500/10'
          }`}>
            {alert.type === 'warning' || alert.type === 'error' ? (
              <AlertTriangle className={`size-3 sm:size-3.5 ${alert.type === 'warning' ? 'text-amber-500' : 'text-red-500'}`} />
            ) : (
              <Info className="size-3 sm:size-3.5 text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-foreground">{alert.message}</p>
          </div>
          {alert.action && (
            <button
              onClick={alert.action.onClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 flex-shrink-0 ${
                alert.type === 'warning'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {alert.action.label}
            </button>
          )}
          <button
            onClick={() => dismissAlert(alert.id)}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
