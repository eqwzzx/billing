import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdminAuth } from '@/lib/auth-admin'

// PATCH - обновить alert
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { type, message, actionLabel, actionUrl, isActive, priority } = body

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(message && { message }),
        ...(actionLabel !== undefined && { actionLabel }),
        ...(actionUrl !== undefined && { actionUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(priority !== undefined && { priority }),
      }
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('[Admin Alerts] Update error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

// DELETE - удалить alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    const alert = await prisma.alert.findUnique({
      where: { id }
    })

    if (alert?.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system alerts' }, { status: 400 })
    }

    await prisma.alert.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Alerts] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
