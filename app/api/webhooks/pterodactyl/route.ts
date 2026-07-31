import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Секрет для проверки webhook (должен совпадать с настройкой в Pterodactyl)
const WEBHOOK_SECRET = process.env.PTERODACTYL_WEBHOOK_SECRET || 'change-me-in-production'

interface PterodactylWebhook {
  event: string
  server: {
    id: number
    uuid: string
    identifier: string
    status: string | null
    is_suspended: boolean
    is_installing: boolean
  }
  user?: {
    id: number
    email: string
  }
}

/**
 * Webhook endpoint для получения обновлений от Pterodactyl
 * 
 * События:
 * - server.created - сервер создан
 * - server.updated - сервер обновлён
 * - server.installed - установка завершена
 * - server.started - сервер запущен
 * - server.stopped - сервер остановлен
 * - server.suspended - сервер приостановлен
 * - server.unsuspended - сервер возобновлён
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка секрета из заголовка
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')
    
    if (providedSecret !== WEBHOOK_SECRET) {
      console.log('[Pterodactyl Webhook] Unauthorized attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PterodactylWebhook = await request.json()
    console.log('[Pterodactyl Webhook] Received event:', body.event, 'for server:', body.server.id)

    // Находим сервер по pterodactylId
    const server = await prisma.server.findFirst({
      where: { pterodactylId: body.server.id }
    })

    if (!server) {
      console.log('[Pterodactyl Webhook] Server not found in database:', body.server.id)
      return NextResponse.json({ 
        success: true, 
        message: 'Server not found in our database' 
      })
    }

    // Определяем новый статус на основе события и данных
    let newStatus = server.status
    
    switch (body.event) {
      case 'server.installed':
        newStatus = 'READY'
        console.log(`[Pterodactyl Webhook] Server ${server.id} installation complete`)
        break
        
      case 'server.started':
        newStatus = 'ACTIVE'
        console.log(`[Pterodactyl Webhook] Server ${server.id} started`)
        break
        
      case 'server.stopped':
        newStatus = 'OFF'
        console.log(`[Pterodactyl Webhook] Server ${server.id} stopped`)
        break
        
      case 'server.suspended':
        newStatus = 'SUSPENDED'
        console.log(`[Pterodactyl Webhook] Server ${server.id} suspended`)
        break
        
      case 'server.unsuspended':
        newStatus = 'READY'
        console.log(`[Pterodactyl Webhook] Server ${server.id} unsuspended`)
        break
        
      case 'server.updated':
      case 'server.created':
        // Определяем статус на основе данных сервера
        if (body.server.is_suspended) {
          newStatus = 'SUSPENDED'
        } else if (body.server.is_installing) {
          newStatus = 'INSTALLING'
        } else if (body.server.status === 'running') {
          newStatus = 'ACTIVE'
        } else if (body.server.status === 'offline') {
          newStatus = 'OFF'
        } else {
          newStatus = 'READY'
        }
        console.log(`[Pterodactyl Webhook] Server ${server.id} ${body.event}: status → ${newStatus}`)
        break
    }

    // Обновляем статус только если он изменился
    if (newStatus !== server.status) {
      await prisma.server.update({
        where: { id: server.id },
        data: { status: newStatus }
      })
      
      console.log(`[Pterodactyl Webhook] Updated server ${server.id} status: ${server.status} → ${newStatus}`)
    }

    return NextResponse.json({ 
      success: true,
      serverId: server.id,
      oldStatus: server.status,
      newStatus
    })
  } catch (error) {
    console.error('[Pterodactyl Webhook] Error:', error)
    return NextResponse.json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
