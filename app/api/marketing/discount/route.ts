import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Получить настройки скидки первого заказа (публичный endpoint для клиентов)
export async function GET(req: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = await requireAuth(req)

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
