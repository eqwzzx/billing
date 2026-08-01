import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/auth-admin"
import { prisma } from "@/lib/db"

// GET - получить все отзывы (для админки)
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const testimonials = await prisma.testimonials.findMany({
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' },
      ],
    })

    return NextResponse.json(testimonials)
  } catch (error) {
    console.error("Error fetching testimonials:", error)
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    )
  }
}

// POST - создать новый отзыв
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, avatar_url, game, price, rating, text, is_active, display_order } = body

    // Валидация
    if (!name || !text || !rating) {
      return NextResponse.json(
        { error: "Name, text and rating are required" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 10" },
        { status: 400 }
      )
    }

    // Генерируем уникальный ID
    const id = crypto.randomUUID()

    const testimonial = await prisma.testimonials.create({
      data: {
        id,
        name,
        avatar_url: avatar_url || null,
        game: game || null,
        price: price || null,
        rating,
        text,
        is_active: is_active ?? true,
        display_order: display_order || 0,
      },
    })

    return NextResponse.json(testimonial, { status: 201 })
  } catch (error) {
    console.error("Error creating testimonial:", error)
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 }
    )
  }
}

// PUT - обновить отзыв
export async function PUT(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, name, avatar_url, game, price, rating, text, is_active, display_order } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    if (rating && (rating < 1 || rating > 10)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 10" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (game !== undefined) updateData.game = game
    if (price !== undefined) updateData.price = price
    if (rating !== undefined) updateData.rating = rating
    if (text !== undefined) updateData.text = text
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order

    const testimonial = await prisma.testimonials.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(testimonial)
  } catch (error: any) {
    console.error("Error updating testimonial:", error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Failed to update testimonial" },
      { status: 500 }
    )
  }
}

// DELETE - удалить отзыв
export async function DELETE(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await prisma.testimonials.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: "Testimonial deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting testimonial:", error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Failed to delete testimonial" },
      { status: 500 }
    )
  }
}
