/**
 * Hook для проверки блокировки пользователя
 * Автоматически редиректит на /banned если пользователь заблокирован
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useBanCheck() {
  const router = useRouter()

  useEffect(() => {
    const checkBan = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          
          // Если пользователь заблокирован - редирект
          if (data.user?.banned) {
            router.push('/banned')
          }
        }
      } catch (error) {
        console.error('[useBanCheck] Error:', error)
      }
    }

    checkBan()
  }, [router])
}
