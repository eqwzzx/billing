import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerResources } from '@/lib/pterodactyl'
import { verifyAuth } from '@/lib/auth-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const userId = auth.userId

    const server = await prisma.server.findFirst({
      where: { 
        id: params.id,
        userId,
      },
      include: {
        plan: true,
      },
    })

    if (!server) {
      return NextResponse.json({ error: 'Сервер не найден' }, { status: 404 })
    }

    if (server.status === 'DELETED') {
      return NextResponse.json({ error: 'Сервер удалён' }, { status: 400 })
    }

    if (!server.pterodactylUuid) {
      return NextResponse.json({ 
        error: 'Сервер не связан с панелью управления' 
      }, { status: 500 })
    }

    // Получаем статистику использования ресурсов
    const resources = await getServerResources(server.pterodactylUuid)

    if (!resources) {
      return NextResponse.json({ 
        error: 'Не удалось получить статистику ресурсов' 
      }, { status: 500 })
    }

    // Конвертируем в удобный формат
    const usedDiskMB = Math.ceil(resources.disk_bytes / 1024 / 1024)
    const totalDiskMB = server.plan.disk
    const diskUsagePercent = Math.round((usedDiskMB / totalDiskMB) * 100)

    const usedMemoryMB = Math.ceil(resources.memory_bytes / 1024 / 1024)
    const totalMemoryMB = server.plan.ram
    const memoryUsagePercent = Math.round((usedMemoryMB / totalMemoryMB) * 100)

    return NextResponse.json({ 
      success: true,
      resources: {
        disk: {
          used: usedDiskMB,
          total: totalDiskMB,
          usagePercent: diskUsagePercent,
        },
        memory: {
          used: usedMemoryMB,
          total: totalMemoryMB,
          usagePercent: memoryUsagePercent,
        },
        cpu: {
          usage: resources.cpu_absolute,
        },
        network: {
          rxBytes: resources.network_rx_bytes,
          txBytes: resources.network_tx_bytes,
        },
        uptime: resources.uptime,
        state: resources.state,
      },
    })
  } catch (error) {
    console.error('[Server Resources] Error:', error)
    return NextResponse.json({ 
      error: 'Ошибка при получении статистики ресурсов' 
    }, { status: 500 })
  }
}
