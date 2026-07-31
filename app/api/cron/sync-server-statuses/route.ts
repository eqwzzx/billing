import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import axios from 'axios'

const PTERODACTYL_URL = process.env.PTERODACTYL_URL
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY

// Защита cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production'

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
 * Синхронизация статусов серверов с Pterodactyl
 * Вызывается cron-задачей каждую минуту
 * 
 * GET /api/cron/sync-server-statuses?secret=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка секрета для защиты endpoint
    const secret = request.nextUrl.searchParams.get('secret')
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting server status sync...')

    // Получаем серверы, которые находятся в процессе установки или активны
    const servers = await prisma.server.findMany({
      where: {
        status: {
          in: ['INSTALLING', 'ACTIVE', 'READY', 'OFF', 'RESTARTING']
        },
        pterodactylId: { not: null }
      },
      select: {
        id: true,
        pterodactylId: true,
        pterodactylUuid: true,
        status: true,
        name: true
      }
    })

    console.log(`[Cron] Found ${servers.length} servers to check`)

    let updated = 0
    let errors = 0
    const updates: Array<{ serverId: string; oldStatus: string; newStatus: string }> = []

    for (const server of servers) {
      if (!server.pterodactylId) continue

      try {
        // Получаем данные сервера из Pterodactyl
        const response = await axios.get<PterodactylServer>(
          `${PTERODACTYL_URL}/api/application/servers/${server.pterodactylId}`,
          {
            headers: {
              'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        )

        const pteroServer = response.data.attributes
        const newStatus = mapPterodactylStatus(pteroServer)

        // Обновляем только если статус изменился
        if (newStatus !== server.status) {
          await prisma.server.update({
            where: { id: server.id },
            data: { status: newStatus }
          })

          updates.push({
            serverId: server.id,
            oldStatus: server.status,
            newStatus
          })
          updated++
          
          console.log(`[Cron] Updated server ${server.name} (${server.id}): ${server.status} → ${newStatus}`)
        }
      } catch (error) {
        errors++
        console.error(`[Cron] Error checking server ${server.id}:`, error)
      }
    }

    console.log(`[Cron] Sync complete: ${updated} updated, ${errors} errors`)

    return NextResponse.json({
      success: true,
      checked: servers.length,
      updated,
      errors,
      updates
    })
  } catch (error) {
    console.error('[Cron] Sync error:', error)
    return NextResponse.json({
      error: 'Failed to sync server statuses',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Преобразует статус Pterodactyl в статус нашей системы
 */
function mapPterodactylStatus(server: PterodactylServer['attributes']): string {
  // Если сервер приостановлен
  if (server.is_suspended) {
    return 'SUSPENDED'
  }

  // Если сервер устанавливается
  if (server.is_installing) {
    return 'INSTALLING'
  }

  // Маппинг статусов Pterodactyl
  const statusMap: Record<string, string> = {
    'running': 'ACTIVE',
    'offline': 'OFF',
    'starting': 'RESTARTING',
    'stopping': 'RESTARTING',
  }

  // Если статус известен - используем маппинг
  if (server.status && statusMap[server.status]) {
    return statusMap[server.status]
  }

  // Если установка завершена и статус неизвестен - считаем готовым
  if (!server.is_installing && !server.status) {
    return 'READY'
  }

  // По умолчанию - готов к использованию
  return 'READY'
}
