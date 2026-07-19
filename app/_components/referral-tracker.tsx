'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Генерация простого fingerprint на основе характеристик браузера
function generateFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  let fingerprint = ''
  
  // Screen
  fingerprint += `${screen.width}x${screen.height}x${screen.colorDepth}`
  
  // Timezone
  fingerprint += `|${new Date().getTimezoneOffset()}`
  
  // Language
  fingerprint += `|${navigator.language}`
  
  // Platform
  fingerprint += `|${navigator.platform}`
  
  // Canvas fingerprint
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Browser fingerprint', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Browser fingerprint', 4, 17)
    fingerprint += `|${canvas.toDataURL().slice(-50)}`
  }
  
  // Simple hash
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36)
}

export function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get('ref')
    
    if (refCode) {
      // Генерируем fingerprint
      const fingerprint = generateFingerprint()
      
      console.log('[Referral] Tracking view with fingerprint:', fingerprint)
      
      // Отправляем запрос на трекинг просмотра с fingerprint
      fetch('/api/referral/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refCode, fingerprint }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.duplicate) {
              console.log('[Referral] View already tracked (duplicate):', refCode)
            } else {
              console.log('[Referral] ✅ Unique view tracked successfully for:', refCode)
            }
          } else {
            console.error('[Referral] Failed to track view:', data.error)
          }
        })
        .catch(error => {
          console.error('[Referral] Error tracking view:', error)
        })
    }
  }, [searchParams])

  return null // Этот компонент не рендерит ничего
}
