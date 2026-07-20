import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Получить настройки скидки первого заказа (публичный endpoint для клиентов)
export async function GET(req: NextRequest) {
  try {
    // Проверяем авторизацию
    const authUser = await requireAuth(req)

    // Загружаем полные данные пользователя из БД, включая firstOrderDiscount
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        firstOrderDiscount: true,
      },
    })

    if (!user) {
      return NextResponse.json({ 
        isEnabled: false,
        discountPercent: 0,
        message: 'Пользователь не найден'
      }, { status: 404 })
    }

    console.log('[Discount API] User:', user.email, 'firstOrderDiscount:', user.firstOrderDiscount)

    // Только пользователи с флагом firstOrderDiscount могут видеть настройки
    if (!user.firstOrderDiscount) {
      return NextResponse.json({ 
        isEnabled: false,
        discountPercent: 0,
        message: 'Скидка первого заказа недоступна для этого пользователя'
      })
    }

    // Получаем настройки скидки из базы
    const discount = await prisma.firstOrderDiscount.findFirst()
    
    console.log('[Discount API] Discount settings:', discount)
    
    if (!discount || !discount.isEnabled) {
      return NextResponse.json({ 
        isEnabled: false,
        discountPercent: 0,
        message: 'Скидка первого заказа отключена'
      })
    }

    return NextResponse.json({
      isEnabled: true,
      discountPercent: discount.discountPercent,
      description: discount.description,
    })
  } catch (error) {
    console.error('[API] Error fetching first order discount:', error)
    return NextResponse.json({ 
      isEnabled: false,
      discountPercent: 0,
      error: 'Failed to load discount settings'
    }, { status: 500 })
  }
}
