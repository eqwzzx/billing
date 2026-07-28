import { NextResponse } from 'next/server'
import { getFirstOrderDiscount } from '@/lib/marketing'

// GET - Публичный endpoint для получения настроек скидки первого заказа
export async function GET() {
  try {
    const discount = await getFirstOrderDiscount()
    
    return NextResponse.json({
      isEnabled: discount.isEnabled,
      discountPercent: discount.discountPercent,
    })
  } catch (error) {
    console.error('[API] Error fetching public first order discount:', error)
    return NextResponse.json({ 
      isEnabled: false,
      discountPercent: 0,
    }, { status: 500 })
  }
}
