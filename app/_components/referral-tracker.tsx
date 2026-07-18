'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get('ref')
    
    if (refCode) {
      // Отправляем запрос на трекинг просмотра
      fetch('/api/referral/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refCode }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('[Referral] View tracked successfully for:', refCode)
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
