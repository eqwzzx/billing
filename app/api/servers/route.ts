import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getPterodactylServer, getPterodactylServerStatus, suspendServer } from '@/lib/pterodactyl'

// Таймаут для запросов к Pterodactyl (3 секунды)
const PTERODACTYL_TIMEOUT = 3000

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  )
  return Promise.race([promise, timeout])
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизованы' }, { status: 401 })
    }

    const servers = await prisma.server.findMany({
      where: { 
        userId: user.id,
      },
      include: {
        plan: { select: { id: true, name: true, ram: true, cpu: true, disk: true, price: true, category: true } },
        egg: { select: { id: true, name: true } },
        node: { select: { id: true, name: true, locationName: true, countryCode: true, priceModifier: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const updatedServers = await Promise.all(
      servers.map(async (server: typeof servers[0]) => {
        if (server.status === 'DELETED') {
          return server
        }

        // Проверка истечения срока аренды - автоматический suspend
        if (server.expiresAt && server.status !== 'SUSPENDED') {
          const expiresAt = new Date(server.expiresAt)
          const now = new Date()
          
          if (expiresAt <= now && server.pterodactylId) {
            try {
              await withTimeout(suspendServer(server.pterodactylId), PTERODACTYL_TIMEOUT)
              await prisma.server.update({
                where: { id: server.id },
                data: { status: 'SUSPENDED' }
              })
              console.log(`[Server ${server.id}] Auto-suspended due to expired rental`)
              return { ...server, status: 'SUSPENDED' as const }
            } catch (suspendError) {
              console.error(`[Server ${server.id}] Failed to auto-suspend:`, suspendError)
            }
          }
        }
        
        if (server.pterodactylId && server.pterodactylUuid) {
          try {
            const statusData = await withTimeout(
              getPterodactylServerStatus(server.pterodactylUuid),
              PTERODACTYL_TIMEOUT
            )
            
            let newStatus = server.status
            
            console.log(`[Server ${server.id}] DB status: ${server.status}, Pterodactyl state: ${statusData.state}, is_suspended: ${statusData.is_suspended}`)
            
            // Приоритет 1: Suspend статус - проверяем в первую очередь!
            if (statusData.is_suspended) {
              newStatus = 'SUSPENDED'
              console.log(`[Server ${server.id}] Pterodactyl reports suspended`)
            }
            // Приоритет 2: Pterodactyl говорит что установка в процессе
            else if (statusData.state === 'installing' || statusData.state === 'reinstalling') {
              newStatus = 'INSTALLING'
              console.log(`[Server ${server.id}] Pterodactyl reports installing`)
            }
            // Приоритет 3: Deleted статус
            else if (server.status === 'DELETED' as any) {
              newStatus = 'DELETED' as any
            }
            // Приоритет 4: Если в БД INSTALLING, но Pterodactyl говорит что не installing
            else if (server.status === 'INSTALLING') {
              if (statusData.state === 'running') {
                newStatus = 'ACTIVE'
                console.log(`[Server ${server.id}] Installation completed - server is running`)
              } else if (statusData.state === 'starting' || statusData.state === 'stopping' || statusData.state === 'restarting') {
                newStatus = 'RESTARTING'
                console.log(`[Server ${server.id}] Installation completed - server is restarting`)
              } else if (statusData.state === 'offline' || statusData.state === 'stopped') {
                const createdAt = new Date(server.createdAt)
                const now = new Date()
                const minutesAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60)
                
                // Увеличиваем таймаут до 10 минут для больших серверов
                if (minutesAgo > 10) {
                  newStatus = 'OFF'
                  console.log(`[Server ${server.id}] Installation completed (${minutesAgo.toFixed(1)} min ago) - server is OFF`)
                } else {
                  newStatus = 'INSTALLING'
                  console.log(`[Server ${server.id}] Still installing (${minutesAgo.toFixed(1)} min ago)`)
                }
              } else {
                newStatus = 'INSTALLING'
              }
            }
            // Приоритет 5: Обычные статусы работающего сервера
            else if (statusData.state === 'starting' || statusData.state === 'stopping' || statusData.state === 'restarting') {
              newStatus = 'RESTARTING'
            } else if (statusData.state === 'stopped' || statusData.state === 'offline') {
              newStatus = 'OFF'
            } else if (statusData.state === 'running') {
              newStatus = 'ACTIVE'
            } else {
              // Оставляем текущий статус если не можем определить
              newStatus = server.status
            }
            
            if (newStatus !== server.status) {
              console.log(`[Server ${server.id}] Status changed: ${server.status} -> ${newStatus}`)
              
              // Обновляем статус в БД если он изменился
              try {
                await prisma.server.update({
                  where: { id: server.id },
                  data: { status: newStatus }
                })
                console.log(`[Server ${server.id}] Status updated in DB: ${newStatus}`)
              } catch (updateError) {
                console.error(`[Server ${server.id}] Failed to update status in DB:`, updateError)
              }
            }
            
            return { ...server, status: newStatus }
          } catch (error: any) {
            // При таймауте или ошибке - возвращаем сервер с текущим статусом из БД
            if (error.message !== 'Timeout') {
              console.error(`[Server ${server.id}] Pterodactyl error:`, error.message)
            }
          }
        }
        return server
      })
    )

    return NextResponse.json(updatedServers)
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при загрузке серверов' }, { status: 500 })
  }
}
