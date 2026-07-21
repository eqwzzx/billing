import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/auth-admin"
import { getBalances } from "@/lib/platega"

export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    // Получаем балансы из Platega API
    const balances = await getBalances()

    return NextResponse.json(balances)
  } catch (error) {
    console.error("[Admin] Error fetching Platega balances:", error)
    return NextResponse.json(
      { error: "Failed to fetch balances" },
      { status: 500 }
    )
  }
}
