import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Получить настройки скидки первого заказа
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const discount = await prisma.firstOrderDiscount.findFirst()
    
    if (!discount) {
      // Создаём настройки по умолчанию если их нет
      const newDiscount = await prisma.firstOrderDiscount.create({
        data: {
          id: 'default',
          isEnabled: true,
          discountPercent: 50,
          description: 'Скидка 50% на первый заказ',
        },
      })
      return NextResponse.json(newDiscount)
    }

    return NextResponse.json(discount)
  } catch (error) {
    console.error('[API] Error fetching first order discount:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Обновить настройки скидки
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { isEnabled, discountPercent, description } = body

    if (discountPercent !== undefined && (discountPercent < 0 || discountPercent > 100)) {
      return NextResponse.json({ error: 'Discount percent must be between 0 and 100' }, { status: 400 })
    }

    // Ищем существующую запись
    const existing = await prisma.firstOrderDiscount.findFirst()

    let discount
    if (existing) {
      // Обновляем существующую
      discount = await prisma.firstOrderDiscount.update({
        where: { id: existing.id },
        data: {
          isEnabled: isEnabled !== undefined ? isEnabled : existing.isEnabled,
          discountPercent: discountPercent !== undefined ? discountPercent : existing.discountPercent,
          description: description !== undefined ? description : existing.description,
        },
      })
    } else {
      // Создаём новую
      discount = await prisma.firstOrderDiscount.create({
        data: {
          id: 'default',
          isEnabled: isEnabled !== undefined ? isEnabled : true,
          discountPercent: discountPercent !== undefined ? discountPercent : 50,
          description: description || 'Скидка на первый заказ',
        },
      })
    }

    return NextResponse.json(discount)
  } catch (error) {
    console.error('[API] Error updating first order discount:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Обновить настройки скидки (alias для POST)
export async function PUT(req: NextRequest) {
  return POST(req)
}
