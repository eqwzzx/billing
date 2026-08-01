import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - получить все активные отзывы (публичный)
export async function GET(request: NextRequest) {
  try {
    const testimonials = await prisma.testimonials.findMany({
      where: {
        is_active: true,
      },
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        avatar_url: true,
        game: true,
        price: true,
        rating: true,
        text: true,
        display_order: true,
      },
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
