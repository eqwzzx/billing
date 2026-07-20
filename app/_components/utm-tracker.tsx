'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Компонент для отслеживания UTM параметров
 * Сохраняет их в cookies и логирует событие просмотра
 */
export function UTMTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Проверяем наличие хотя бы одного UTM параметра
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')
    const utmContent = searchParams.get('utm_content')
    const utmTerm = searchParams.get('utm_term')

    const hasUTM = utmSource || utmMedium || utmCampaign || utmContent || utmTerm

    if (hasUTM) {
      console.log('[UTM] Detected UTM parameters:', {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        content: utmContent,
        term: utmTerm,
      })

      // Отправляем запрос на сохранение UTM параметров и логирование VIEW события
      fetch('/api/marketing/track-utm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.duplicate) {
              console.log('[UTM] ℹ️  View already tracked for this UTM combination (duplicate prevented)')
            } else {
              console.log('[UTM] ✅ Unique view tracked successfully')
            }
          } else {
            console.error('[UTM] Failed to track UTM:', data.error)
          }
        })
        .catch(error => {
          console.error('[UTM] Error tracking UTM:', error)
        })
    }
  }, [searchParams])

  return null // Компонент не рендерит ничего
}
