import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - получить все реферальные ссылки с детальной статистикой
export async function GET(req: NextRequest) {
  try {
    // Авторизация с правильной обработкой ошибок
    let user
    try {
      user = await requireAuth(req)
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PR_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Only ADMIN or PR_MANAGER can access referral links' }, { status: 403 })
    }

    const links = await prisma.referralLink.findMany({
      include: {
        registrations: {
          select: {
            id: true,
            userId: true,
            hasDeposited: true,
            totalDeposits: true,
            registeredAt: true,
            firstDepositAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Подсчитываем детальную статистику для каждой ссылки
    const linksWithStats = links.map(link => {
      const registeredUsers = link.registrations.length
      const depositedUsers = link.registrations.filter(r => r.hasDeposited).length
      const totalRevenue = link.registrations.reduce((sum, r) => sum + r.totalDeposits, 0)
      
      return {
        id: link.id,
        code: link.code,
        name: link.name,
        url: link.url,
        views: link.views,
        isActive: link.isActive,
        expiresAt: link.expiresAt,
        createdBy: link.createdBy,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        stats: {
          views: link.views,
          registrations: registeredUsers,
          deposits: depositedUsers,
          totalRevenue,
          conversionRate: link.views > 0 ? ((registeredUsers / link.views) * 100).toFixed(2) : '0.00',
          depositRate: registeredUsers > 0 ? ((depositedUsers / registeredUsers) * 100).toFixed(2) : '0.00',
        },
      }
    })

    return NextResponse.json(linksWithStats)
  } catch (error) {
    console.error('[API] Error fetching referral links:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - создать новую реферальную ссылку
export async function POST(req: NextRequest) {
  console.log('[API] POST /api/admin/referrals - Start')
  
  try {
    // Авторизация с правильной обработкой ошибок
    let user
    try {
      user = await requireAuth(req)
      console.log('[API] User authenticated:', user.id, user.role)
    } catch (authError) {
      console.error('[API] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PR_MANAGER') {
      console.log('[API] Access denied for role:', user.role)
      return NextResponse.json({ error: 'Forbidden: Only ADMIN or PR_MANAGER can create referral links' }, { status: 403 })
    }

    const body = await req.json()
    console.log('[API] Request body:', body)
    const { code, name, expiresAt } = body

    if (!code || !name) {
      console.log('[API] Missing required fields')
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
    }

    // Проверяем, не существует ли уже такой код
    console.log('[API] Checking if code exists:', code.toUpperCase())
    const existing = await prisma.referralLink.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existing) {
      console.log('[API] Code already exists')
      return NextResponse.json({ error: 'Code already exists' }, { status: 400 })
    }

    // Получаем базовый URL сайта
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const url = `${baseUrl}?ref=${code.toUpperCase()}`

    console.log('[API] Creating referral link with data:', {
      code: code.toUpperCase(),
      name,
      url,
      expiresAt,
      createdBy: user.id,
    })

    const link = await prisma.referralLink.create({
      data: {
        code: code.toUpperCase(),
        name,
        url,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: user.id,
      },
    })

    console.log('[API] Referral link created successfully:', link.id)
    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating referral link:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH - обновить реферальную ссылку
export async function PATCH(req: NextRequest) {
  try {
    // Авторизация с правильной обработкой ошибок
    let user
    try {
      user = await requireAuth(req)
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PR_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Only ADMIN or PR_MANAGER can update referral links' }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, isActive, expiresAt } = body

    if (!id) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const link = await prisma.referralLink.update({
      where: { id },
      data: updateData,
    })

    console.log('[API] Referral link updated successfully:', link.id)
    return NextResponse.json(link)
  } catch (error) {
    console.error('[API] Error updating referral link:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - удалить реферальную ссылку
export async function DELETE(req: NextRequest) {
  try {
    // Авторизация с правильной обработкой ошибок
    let user
    try {
      user = await requireAuth(req)
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PR_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Only ADMIN or PR_MANAGER can delete referral links' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 })
    }

    await prisma.referralLink.delete({
      where: { id },
    })

    console.log('[API] Referral link deleted successfully:', id)
    return NextResponse.json({ message: 'Referral link deleted' })
  } catch (error) {
    console.error('[API] Error deleting referral link:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
