import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth } from '@/lib/auth-admin'

const VALID_CATEGORIES = ['MINECRAFT', 'CODING', 'VDS', 'DEDICATED', 'DOMAIN', 'STORAGEBOX']

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function toFloat(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : fallback
}

function toOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function planErrorResponse(error: unknown, action: 'create' | 'update') {
  console.error(`${action === 'create' ? 'Create' : 'Update'} plan error:`, error)
  const code = (error as { code?: string })?.code
  const message = error instanceof Error ? error.message : String(error)

  if (code === 'P2002') {
    return NextResponse.json({ error: 'Тариф с таким slug уже существует' }, { status: 409 })
  }
  if (code === 'P2025') {
    return NextResponse.json({ error: 'Тариф не найден' }, { status: 404 })
  }
  return NextResponse.json(
    { error: `Failed to ${action} plan`, detail: message },
    { status: 500 },
  )
}

export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const plans = await prisma.plan.findMany({
      include: {
        egg: true,
        eggOptions: {
          include: {
            egg: true,
          },
        },
        _count: { select: { servers: true } },
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })
    return NextResponse.json(plans)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const allowedEggIds: string[] = Array.isArray(body.allowedEggIds)
      ? body.allowedEggIds.filter((id: unknown): id is string => typeof id === 'string')
      : []

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Название тарифа обязательно' }, { status: 400 })
    }
    if (!body.slug || typeof body.slug !== 'string') {
      return NextResponse.json({ error: 'Slug тарифа обязателен' }, { status: 400 })
    }

    // Проверяем существует ли уже тариф с таким slug
    const existingPlan = await prisma.plan.findUnique({
      where: { slug: body.slug },
      select: { id: true, name: true }
    })

    if (existingPlan) {
      return NextResponse.json(
        { error: `Тариф с slug "${body.slug}" уже существует (${existingPlan.name})` },
        { status: 409 }
      )
    }

    const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'MINECRAFT'

    const plan = await prisma.plan.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        category,
        ram: toInt(body.ram),
        cpu: toInt(body.cpu),
        disk: toInt(body.disk),
        databases: toInt(body.databases, 1),
        backups: toInt(body.backups, 3),
        allocations: toInt(body.allocations, 1),
        price: toFloat(body.price),
        isFree: body.isFree ?? false,
        eggId: allowedEggIds[0] ?? body.eggId ?? null,
        mobIcon: body.mobIcon ?? null,
        customIcon: body.customIcon ?? null,
        isActive: body.isActive ?? true,
        sortOrder: toInt(body.sortOrder, 0),
        // VDS-specific fields
        vmPresetId: toOptionalInt(body.vmPresetId),
        vmClusterId: toOptionalInt(body.vmClusterId),
        vmIpPoolId: toOptionalInt(body.vmIpPoolId),
        vdsCustomSpecs: body.vdsCustomSpecs ?? null,
        // Node selection fields
        vmNodeId: toOptionalInt(body.vmNodeId),
        vmNodeStrategy: body.vmNodeStrategy ?? null,
      },
    })

    if (allowedEggIds.length > 0) {
      await prisma.planEggOption.createMany({
        data: allowedEggIds.map((eggId) => ({ planId: plan.id, eggId })),
        skipDuplicates: true,
      })
    }

    const fullPlan = await prisma.plan.findUnique({
      where: { id: plan.id },
      include: {
        egg: true,
        eggOptions: { include: { egg: true } },
        _count: { select: { servers: true } },
      },
    })

    return NextResponse.json(fullPlan)
  } catch (error) {
    return planErrorResponse(error, 'create')
  }
}

export async function PATCH(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, allowedEggIds, ...data } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    const normalizedEggIds: string[] = Array.isArray(allowedEggIds)
      ? allowedEggIds.filter((v: unknown): v is string => typeof v === 'string')
      : []
    
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.ram !== undefined && { ram: toInt(data.ram) }),
        ...(data.cpu !== undefined && { cpu: toInt(data.cpu) }),
        ...(data.disk !== undefined && { disk: toInt(data.disk) }),
        ...(data.databases !== undefined && { databases: toInt(data.databases, 1) }),
        ...(data.backups !== undefined && { backups: toInt(data.backups, 3) }),
        ...(data.allocations !== undefined && { allocations: toInt(data.allocations, 1) }),
        ...(data.price !== undefined && { price: toFloat(data.price) }),
        ...(data.isFree !== undefined && { isFree: data.isFree }),
        ...(normalizedEggIds.length > 0 && { eggId: normalizedEggIds[0] }),
        ...(data.eggId !== undefined && normalizedEggIds.length === 0 && { eggId: data.eggId }),
        ...(data.mobIcon !== undefined && { mobIcon: data.mobIcon }),
        ...(data.customIcon !== undefined && { customIcon: data.customIcon }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: toInt(data.sortOrder, 0) }),
        // VDS-specific fields
        ...(data.vmPresetId !== undefined && { vmPresetId: toOptionalInt(data.vmPresetId) }),
        ...(data.vmClusterId !== undefined && { vmClusterId: toOptionalInt(data.vmClusterId) }),
        ...(data.vmIpPoolId !== undefined && { vmIpPoolId: toOptionalInt(data.vmIpPoolId) }),
        ...(data.vdsCustomSpecs !== undefined && { vdsCustomSpecs: data.vdsCustomSpecs }),
        // Node selection fields
        ...(data.vmNodeId !== undefined && { vmNodeId: toOptionalInt(data.vmNodeId) }),
        ...(data.vmNodeStrategy !== undefined && { vmNodeStrategy: data.vmNodeStrategy }),
      },
    })

    if (Array.isArray(allowedEggIds)) {
      await prisma.planEggOption.deleteMany({ where: { planId: id } })

      if (normalizedEggIds.length > 0) {
        await prisma.planEggOption.createMany({
          data: normalizedEggIds.map((eggId) => ({ planId: id, eggId })),
          skipDuplicates: true,
        })
      }
    }

    const fullPlan = await prisma.plan.findUnique({
      where: { id: plan.id },
      include: {
        egg: true,
        eggOptions: { include: { egg: true } },
        _count: { select: { servers: true } },
      },
    })
    
    return NextResponse.json(fullPlan)
  } catch (error) {
    return planErrorResponse(error, 'update')
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    const activeServersCount = await prisma.server.count({
      where: { planId: id, status: { not: 'DELETED' } },
    })

    if (activeServersCount > 0) {
      return NextResponse.json(
        {
          error: `Нельзя удалить тариф: к нему привязано ${activeServersCount} активных серверов`,
        },
        { status: 400 },
      )
    }

    await prisma.server.deleteMany({
      where: { planId: id, status: 'DELETED' },
    })

    await prisma.plan.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
