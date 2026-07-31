import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdminAuth } from '@/lib/auth-admin'

// GET - получить настройки видимости всех категорий
export async function GET(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const categories = await prisma.categoryVisibility.findMany({
      orderBy: { category: 'asc' }
    })

    // Если записей нет, создаём дефолтные
    if (categories.length === 0) {
      const defaultCategories = ['MINECRAFT', 'VDS', 'CODING'] as const
      
      for (const category of defaultCategories) {
        await prisma.categoryVisibility.create({
          data: {
            category,
            isVisible: true,
          }
        })
      }

      const newCategories = await prisma.categoryVisibility.findMany({
        orderBy: { category: 'asc' }
      })

      return NextResponse.json(newCategories)
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error('[Admin Categories] Get error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// PATCH - обновить видимость категории
export async function PATCH(request: NextRequest) {
  const auth = verifyAdminAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { category, isVisible, maintenanceMessage } = body

    if (!category || !['MINECRAFT', 'VDS', 'CODING'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Пытаемся найти существующую запись
    let categoryRecord = await prisma.categoryVisibility.findUnique({
      where: { category }
    })

    if (!categoryRecord) {
      // Создаём если не существует
      categoryRecord = await prisma.categoryVisibility.create({
        data: {
          category,
          isVisible: isVisible !== undefined ? isVisible : true,
          maintenanceMessage,
          updatedBy: auth.userId,
        }
      })
    } else {
      // Обновляем существующую
      categoryRecord = await prisma.categoryVisibility.update({
        where: { category },
        data: {
          ...(isVisible !== undefined && { isVisible }),
          ...(maintenanceMessage !== undefined && { maintenanceMessage }),
          updatedBy: auth.userId,
        }
      })
    }

    return NextResponse.json(categoryRecord)
  } catch (error) {
    console.error('[Admin Categories] Update error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}
