"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "../_components/admin-layout"
import { AdminPlategaPaymentsTable } from "../_components/admin-platega-payments-table"

export default function PlategaPaymentsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

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
        if (data.user?.role !== 'ADMIN' && data.user?.role !== 'PR_MANAGER') {
          setIsAuthorized(false)
          router.push('/client')
          return
        }
        setIsAuthorized(true)
      } catch {
        setIsAuthorized(false)
        router.push('/client')
      }
    }
    checkAuth()
  }, [router])

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AdminLayout activeTab="platega-payments" searchQuery={searchQuery} setSearchQuery={setSearchQuery}>
      <AdminPlategaPaymentsTable searchQuery={searchQuery} />
    </AdminLayout>
  )
}
