import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdminAuth, verifyAdminAuth } from "@/lib/auth-admin"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const session = await verifyAdminAuth(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params // ✅ await params
    const body = await request.json()
    const { reason, banType = "PERM_BAN", expiresAt } = body

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 })
    }

    // Проверяем что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Обновляем статус бана пользователя
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banType: banType,
        banReason: reason,
        bannedAt: new Date(),
        bannedBy: session.userId,
        banExpiresAt: expiresAt ? new Date(expiresAt) : null,
        banCount: {
          increment: 1,
        },
      },
    })

    // Создаём запись в истории банов
    await prisma.banHistory.create({
      data: {
        userId: userId,
        adminId: session.userId,
        banType: banType,
        reason: reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        action: "USER_BAN",
        description: `Пользователь ${user.email} заблокирован. Причина: ${reason}`,
        userId: userId,
        adminId: session.userId,
        metadata: JSON.stringify({
          banType,
          reason,
          expiresAt,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Пользователь заблокирован",
    })
  } catch (error) {
    console.error("[Admin] Error banning user:", error)
    return NextResponse.json(
      { error: "Failed to ban user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const session = await verifyAdminAuth(request)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params // ✅ await params

    // Проверяем что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Разбаниваем пользователя
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banType: "NONE",
        banReason: null,
        bannedAt: null,
        bannedBy: null,
        banExpiresAt: null,
      },
    })

    // Деактивируем все активные баны в истории
    await prisma.banHistory.updateMany({
      where: {
        userId: userId,
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    })

    // Логируем действие
    await prisma.adminLog.create({
      data: {
        action: "USER_UNBAN",
        description: `Пользователь ${user.email} разблокирован`,
        userId: userId,
        adminId: session.userId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Пользователь разблокирован",
    })
  } catch (error) {
    console.error("[Admin] Error unbanning user:", error)
    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 }
    )
  }
}
