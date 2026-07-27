import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/auth-admin"
import { exportTransactions } from "@/lib/platega"

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format") as "csv" | "excel" | "json" || "csv"
    const from = searchParams.get("from") || undefined
    const to = searchParams.get("to") || undefined

    // Экспортируем транзакции через Platega API
    const url = await exportTransactions({
      format,
      from,
      to,
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error("[Admin] Error exporting transactions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export transactions" },
      { status: 500 }
    )
  }
}
