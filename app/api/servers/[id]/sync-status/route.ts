import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

const PTERODACTYL_URL = process.env.PTERODACTYL_URL
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY

interface PterodactylServer {
  attributes: {
    id: number
    uuid: string
    identifier: string
    status: string | null
    is_suspended: boolean
    is_installing: boolean
  }
}

/**
 * Синхронизация статуса конкретного сервера с Pterodactyl
 * POST /api/servers/[id]/sync-status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Получаем сервер
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server) {
      return NextResponse.json({ error: 'Сервер не найден' }, { status: 404 })
    }

    // Проверяем права доступа
    if (server.userId !== user.id) {
      return NextResponse.json({ error: 'Нет доступа к этому серверу' }, { status: 403 })
    }

    if (!server.pterodactylId) {
      return NextResponse.json({ 
        error: 'Сервер не связан с Pterodactyl' 
      }, { status: 400 })
    }

    // Получаем данные из Pterodactyl
    const response = await fetch(
      `${PTERODACTYL_URL}/api/application/servers/${server.pterodactylId}`,
      {
        headers: {
          'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          error: 'Сервер не найден в Pterodactyl'
        }, { status: 404 })
      }
      throw new Error(`Pterodactyl API error: ${response.status}`)
    }

    const data: PterodactylServer = await response.json()
    const pteroServer = data.attributes
    
    // Определяем новый статус
    let newStatus = server.status
    
    if (pteroServer.is_suspended) {
      newStatus = 'SUSPENDED'
    } else if (pteroServer.is_installing) {
      newStatus = 'INSTALLING'
    } else if (pteroServer.status === 'running') {
      newStatus = 'ACTIVE'
    } else if (pteroServer.status === 'offline') {
      newStatus = 'OFF'
    } else if (pteroServer.status === 'starting' || pteroServer.status === 'stopping') {
      newStatus = 'RESTARTING'
    } else {
      newStatus = 'READY'
    }

    // Обновляем статус если изменился
    if (newStatus !== server.status) {
      await prisma.server.update({
        where: { id },
        data: { status: newStatus }
      })

      console.log(`[Sync Status] Server ${id} updated: ${server.status} → ${newStatus}`)
    }

    return NextResponse.json({
      success: true,
      oldStatus: server.status,
      newStatus,
      pterodactylStatus: {
        status: pteroServer.status,
        is_installing: pteroServer.is_installing,
        is_suspended: pteroServer.is_suspended
      }
    })
  } catch (error) {
    console.error('[Sync Status] Error:', error)

    return NextResponse.json({
      error: 'Не удалось синхронизировать статус',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
