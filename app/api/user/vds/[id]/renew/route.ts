/**
 * VDS Renew API
 * Продление аренды VDS сервера
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'
import { 
  getVMManager6Rentals, 
  renewVMManager6Rental 
} from '@/vm6/vmmanager6-rentals'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

interface AuthPayload {
  userId: string
  email: string
  role: string
}

function getAuthFromRequest(request: NextRequest): AuthPayload | null {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

// POST - продлить VDS на выбранное количество дней
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthFromRequest(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const hostId = parseInt(id)
  
  if (isNaN(hostId)) {
    return NextResponse.json({ error: 'Invalid host ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { days = 30 } = body

    // Валидация количества дней
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return NextResponse.json({ 
        error: 'Некорректный срок продления. Допустимо от 1 до 365 дней.' 
      }, { status: 400 })
    }

    const rentals = getVMManager6Rentals(auth.userId)
    const rental = rentals.find(r => r.vmmanager6_host_id === hostId)
    
    if (!rental) {
      return NextResponse.json({ error: 'VDS not found' }, { status: 404 })
    }

    const plan = await prisma.plan.findFirst({
      where: { name: rental.plan_name, category: 'VDS' }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Тариф не найден, продление недоступно' },
        { status: 404 }
      )
    }
    
    // Расчёт стоимости за выбранный период
    const pricePerMonth = plan.price
    const price = (pricePerMonth / 30) * days

    const user = await prisma.user.findUnique({
      where: { id: auth.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const charged = await prisma.user.updateMany({
      where: { id: auth.userId, balance: { gte: price } },
      data: { balance: { decrement: price } }
    })

    if (charged.count === 0) {
      return NextResponse.json({ 
        error: 'Недостаточно средств',
        required: price,
        balance: user.balance
      }, { status: 400 })
    }

    const updatedRental = renewVMManager6Rental(rental.id, days)
    
    if (!updatedRental) {
      await prisma.user.update({
        where: { id: auth.userId },
        data: { balance: { increment: price } }
      })
      return NextResponse.json({ error: 'Failed to renew rental' }, { status: 500 })
    }

    const daysLabel = days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'
    await prisma.transaction.create({
      data: {
        userId: auth.userId,
        amount: -price,
        type: 'PAYMENT',
        description: `Продление VDS: ${rental.plan_name} на ${days} ${daysLabel}`,
        status: 'COMPLETED'
      }
    })

    console.log(`[VDS Renew] User ${auth.userId} renewed VDS ${hostId} for ${days} days (${price} RUB)`)

    return NextResponse.json({
      success: true,
      message: `VDS продлён на ${days} ${daysLabel}`,
      expiresAt: updatedRental.expires_at,
      price
    })
  } catch (error) {
    console.error('[VDS Renew] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to renew VDS' },
      { status: 500 }
    )
  }
}
