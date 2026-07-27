import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth, verifyAdminAuth } from "@/lib/auth-admin"
import { checkCancelSupported } from "@/lib/platega"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const { id: transactionId } = await params // ✅ await params

    // Проверяем возможность отмены через Platega API
    const result = await checkCancelSupported(transactionId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Admin] Error checking cancel support:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check cancel support" },
      { status: 500 }
    )
  }
}
