import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - публичный endpoint для получения видимости категорий
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.categoryVisibility.findMany({
      select: {
        category: true,
        isVisible: true,
        maintenanceMessage: true,
      }
    })

    // Если записей нет, возвращаем дефолтные значения (все видимы)
    if (categories.length === 0) {
      return NextResponse.json({
        MINECRAFT: { isVisible: true, maintenanceMessage: null },
        VDS: { isVisible: true, maintenanceMessage: null },
        CODING: { isVisible: true, maintenanceMessage: null },
      })
    }

    // Преобразуем в удобный формат
    const visibility = categories.reduce((acc, cat) => {
      acc[cat.category] = {
        isVisible: cat.isVisible,
        maintenanceMessage: cat.maintenanceMessage,
      }
      return acc
    }, {} as Record<string, { isVisible: boolean; maintenanceMessage: string | null }>)

    return NextResponse.json(visibility)
  } catch (error) {
    console.error('[Categories Visibility] Error:', error)
    // В случае ошибки возвращаем дефолтные значения
    return NextResponse.json({
      MINECRAFT: { isVisible: true, maintenanceMessage: null },
      VDS: { isVisible: true, maintenanceMessage: null },
      CODING: { isVisible: true, maintenanceMessage: null },
    })
  }
}
