"use client"

import { useClientContext } from "./layout"
import { DashboardTab, AlertsBanner } from "./_components"

export default function ClientPage() {
  const ctx = useClientContext()
  
  return (
    <>
      <AlertsBanner />
      <DashboardTab
        user={ctx.user}
        servers={ctx.servers}
        vdsServers={ctx.vdsServers}
      />
    </>
  )
}
