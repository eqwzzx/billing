/**
 * User VDS Purchase API
 * Покупка нового VDS сервера
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'
import { getVmManager } from '@/vm6/VmManager'
import { getVMManager6API } from '@/vm6/vmmanager6'
import { sendVmManagerAccountEmail } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const VDS_RENTAL_DAYS = 30

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

// Генерация безопасного пароля для VM
function generatePassword(): string {
  const api = getVMManager6API()
  return api.generateSecurePassword(12)
}

// Проверка лимита ядер VDS
async function checkCoreLimit(requestedCores: number): Promise<{ allowed: boolean; currentCores: number; limit: number }> {
  // Получаем лимит из настроек adminSettings
  const limitSetting = await prisma.adminSettings.findUnique({
    where: { key: 'vdsCoreLimit' }
  })
  const limit = limitSetting ? parseInt(limitSetting.value) : 100

  // Считаем текущие ядра из локальной JSON БД
  const { readDatabase } = await import('@/lib/local-db')
  const db = readDatabase()
  const rentals = (db.vmmanager6_rentals || []).filter(
    (r: { status: string }) => r.status === 'active'
  )
  // Примерный расчёт - по умолчанию 1 ядро на аренду
  const currentCores = rentals.length * (requestedCores || 1)

  return {
    allowed: (currentCores + requestedCores) <= limit,
    currentCores,
    limit
  }
}

// POST - купить VDS
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, osId, planName, autoRenew = false } = body

    if (!name || !osId || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields: name, osId, planName' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || name.length > 64) {
      return NextResponse.json({ error: 'Invalid server name' }, { status: 400 })
    }

    const plan = await prisma.plan.findFirst({
      where: { name: planName, category: 'VDS', isActive: true },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const price = plan.price
    const days = VDS_RENTAL_DAYS
    const preset = plan.vmPresetId ?? undefined
    const ram = plan.ram
    const cpu = plan.cpu
    const disk = plan.disk

    const osImage = await prisma.vdsOsImage.findFirst({
      where: { vmManagerId: Number(osId) },
    })
    if (!osImage) {
      return NextResponse.json({ error: 'OS image not found' }, { status: 400 })
    }

    // Проверяем лимит ядер
    const requestedCores = cpu || 1
    const coreCheck = await checkCoreLimit(requestedCores)
    if (!coreCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Сервер заполнен', 
          message: `Достигнут лимит ядер VDS (${coreCheck.currentCores}/${coreCheck.limit}). Попробуйте позже.`,
          currentCores: coreCheck.currentCores,
          limit: coreCheck.limit
        },
        { status: 503 }
      )
    }

    // Проверяем баланс пользователя
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { balance: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Генерируем пароль для VM
    const vmPassword = generatePassword()

    const charged = await prisma.user.updateMany({
      where: { id: auth.userId, balance: { gte: price } },
      data: { balance: { decrement: price } }
    })

    if (charged.count === 0) {
      return NextResponse.json(
        { error: 'Insufficient balance', required: price, current: user.balance },
        { status: 400 }
      )
    }

    const paymentTx = await prisma.transaction.create({
      data: {
        userId: auth.userId,
        type: 'PAYMENT',
        amount: -price,
        description: `Покупка VDS "${name}" на ${days} дней`,
        status: 'COMPLETED'
      }
    })

    try {
      // Создаём VM с арендой (автоматически создаст аккаунт в VMManager6)
      const vm = getVmManager()
      const { vm: createdVm, rental, vmAccountId, vmAccountPassword, isFirstVds } = await vm.createVmWithRental(
        auth.userId,
        {
          name,
          osId,
          password: vmPassword,
          preset,
          ram,
          cpu,
          disk
        },
        {
          planName,
          price,
          days,
          autoRenew
        },
        user.email // Передаём email для создания аккаунта в VMManager6
      )

      // Если это первая покупка VDS, отправляем данные VmManager аккаунта
      if (isFirstVds) {
        console.log('[VDS Purchase] First VDS purchase detected, sending VmManager credentials')
        await sendVmManagerAccountEmail(user.email, {
          vmEmail: user.email,
          vmPassword: vmAccountPassword
        }).catch(err => {
          console.error('[VDS Purchase] Failed to send VmManager credentials email:', err)
        })
      }

      return NextResponse.json({
        success: true,
        server: {
          id: createdVm.id,
          name: createdVm.name,
          status: createdVm.status,
          password: vmPassword // Показываем пароль только при создании!
        },
        rental,
        vmAccountId,
        charged: price,
        message: `VDS "${name}" успешно создан`
      })
    } catch (vmError) {
      // Возвращаем деньги если создание VM не удалось
      await prisma.user.update({
        where: { id: auth.userId },
        data: { balance: { increment: price } }
      })

      await prisma.transaction.update({
        where: { id: paymentTx.id },
        data: {
          status: 'FAILED',
          description: `Покупка VDS "${name}" - ОТМЕНЕНО (ошибка создания)`
        }
      })

      console.error('[VDS Purchase] VM creation failed:', vmError)
      return NextResponse.json(
        { error: vmError instanceof Error ? vmError.message : 'Failed to create VDS' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[VDS Purchase] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Purchase failed' },
      { status: 500 }
    )
  }
}
