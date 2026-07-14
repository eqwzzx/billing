/**
 * Скрипт для создания первого администратора
 * Запуск: node scripts/create-admin.mjs
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Требуем обязательные переменные окружения
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const name = process.env.ADMIN_NAME || 'Administrator'

if (!email || !password) {
  console.error('❌ ADMIN_EMAIL и ADMIN_PASSWORD обязательны!')
  console.error('Установите их в переменных окружения:')
  console.error('  ADMIN_EMAIL=your@email.com')
  console.error('  ADMIN_PASSWORD=YourSecurePassword123!')
  console.error('  ADMIN_NAME="Your Name" (опционально)')
  process.exit(1)
}

console.log('Creating admin user...')
console.log(`Email: ${email}`)

// Проверяем, настроен ли Pterodactyl
const PTERODACTYL_URL = process.env.PTERODACTYL_URL
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY
const isPterodactylConfigured = PTERODACTYL_URL && PTERODACTYL_API_KEY

if (!isPterodactylConfigured) {
  console.log('\n⚠️  Pterodactyl не настроен (пропуск интеграции)')
  console.log('   Администратор будет создан только в биллинге.')
  console.log('   Настройте PTERODACTYL_URL и PTERODACTYL_API_KEY в .env для интеграции.')
}

try {
  // 1. Работа с Pterodactyl (только если настроен)
  if (isPterodactylConfigured) {
    console.log('\n[Pterodactyl] Loading Pterodactyl integration...')
    
    // Динамически импортируем pterodactyl библиотеку только когда она нужна
    let pterodactylLib
    try {
      // Попробуем загрузить скомпилированную версию
      pterodactylLib = await import('../lib/pterodactyl.js').catch(async () => {
        // Если не получилось, пробуем TypeScript версию через require
        console.log('[Pterodactyl] Note: Using TypeScript file directly (consider running build)')
        return await import('../lib/pterodactyl.ts')
      })
    } catch (importError) {
      console.error('[Pterodactyl] ✗ Failed to load Pterodactyl library:', importError.message)
      console.log('[Pterodactyl] Skipping Pterodactyl integration. Continuing with billing only...')
      pterodactylLib = null
    }
    
    if (pterodactylLib) {
      const { findPterodactylUserByEmail, getPterodactylServers, deleteServer, createPterodactylUser } = pterodactylLib
      
      console.log('[Pterodactyl] Checking for existing user...')
      try {
        const pteroUser = await findPterodactylUserByEmail(email)
      
      if (pteroUser) {
        console.log(`[Pterodactyl] Found user: ${pteroUser.username} (ID: ${pteroUser.id})`)
        
        // Получить все серверы
        console.log('[Pterodactyl] Fetching all servers...')
        const allServers = await getPterodactylServers()
        const userServers = allServers.filter(s => s.user === pteroUser.id)
        
        if (userServers.length > 0) {
          console.log(`[Pterodactyl] Found ${userServers.length} servers, deleting...`)
          
          for (const server of userServers) {
            try {
              console.log(`[Pterodactyl] Deleting server: ${server.name} (ID: ${server.id})`)
              await deleteServer(server.id, true)
              console.log(`[Pterodactyl] ✓ Deleted server ${server.id}`)
            } catch (err) {
              console.error(`[Pterodactyl] ✗ Failed to delete server ${server.id}:`, err.message)
            }
          }
        } else {
          console.log('[Pterodactyl] No servers found for this user')
        }
        
        // Удалить пользователя из Pterodactyl
        console.log(`[Pterodactyl] Deleting user ${pteroUser.id}...`)
        try {
          const response = await fetch(`${PTERODACTYL_URL}/api/application/users/${pteroUser.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
              'Accept': 'application/json',
            },
          })
          
          if (response.ok || response.status === 204) {
            console.log('[Pterodactyl] ✓ User deleted successfully')
          } else {
            const errorText = await response.text()
            console.error(`[Pterodactyl] ✗ Failed to delete user: ${response.status}`)
            console.error(`[Pterodactyl] Error details:`, errorText)
            
            // Если не удалось удалить, попробуем обновить email чтобы освободить его
            if (response.status === 400) {
              console.log('[Pterodactyl] Trying to free email by updating user...')
              const randomSuffix = Date.now()
              const updateResponse = await fetch(`${PTERODACTYL_URL}/api/application/users/${pteroUser.id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  email: `deleted_${randomSuffix}@deleted.local`,
                  username: `deleted_${randomSuffix}`,
                  first_name: 'Deleted',
                  last_name: 'User',
                }),
              })
              
              if (updateResponse.ok) {
                console.log('[Pterodactyl] ✓ Email freed by renaming user')
              }
            }
          }
        } catch (err) {
          console.error('[Pterodactyl] ✗ Error deleting user:', err.message)
        }
      } else {
        console.log('[Pterodactyl] No existing user found')
      }
      
      // Создать нового пользователя в Pterodactyl с правами админа
      console.log('\n[Pterodactyl] Creating new admin user...')
      try {
        const [firstName, ...lastNameParts] = name.split(' ')
        const lastName = lastNameParts.join(' ') || 'Admin'
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
        
        const newPteroUser = await createPterodactylUser({
          email,
          username,
          firstName,
          lastName,
          password,
        })
        
        // Выдать права админа через прямой API запрос
        const updateResponse = await fetch(`${PTERODACTYL_URL}/api/application/users/${newPteroUser.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            email: newPteroUser.email,
            username: newPteroUser.username,
            first_name: newPteroUser.first_name,
            last_name: newPteroUser.last_name,
            root_admin: true,
          }),
        })
        
        if (updateResponse.ok) {
          console.log('[Pterodactyl] ✓ Admin user created with root privileges')
          console.log(`[Pterodactyl] ID: ${newPteroUser.id}`)
          console.log(`[Pterodactyl] Username: ${newPteroUser.username}`)
        } else {
          console.error('[Pterodactyl] ✗ Failed to set admin privileges')
        }
      } catch (err) {
        console.error('[Pterodactyl] ✗ Error creating user:', err.message)
      }
      
      } catch (pterodactylError) {
        console.error('[Pterodactyl] ✗ Pterodactyl integration error:', pterodactylError.message)
        console.log('[Pterodactyl] Продолжаем создание админа в биллинге...')
      }
    } // Закрываем if (pterodactylLib)
  } else {
    console.log('\n[Pterodactyl] Skipped (not configured)')
  }
  
  // 2. Работа с базой данных (биллинг)
  console.log('\n[Database] Checking for existing user...')
  const existing = await prisma.user.findUnique({ where: { email } })
  
  if (existing) {
    console.log(`[Database] Found existing user (ID: ${existing.id})`)
    
    // Удалить все серверы пользователя из биллинга
    const userServers = await prisma.server.findMany({
      where: { userId: existing.id }
    })
    
    if (userServers.length > 0) {
      console.log(`[Database] Deleting ${userServers.length} servers from billing...`)
      await prisma.server.deleteMany({
        where: { userId: existing.id }
      })
      console.log('[Database] ✓ Servers deleted from billing')
    }
    
    // Удалить пользователя из биллинга
    console.log('[Database] Deleting user from billing...')
    await prisma.user.delete({
      where: { email }
    })
    console.log('[Database] ✓ User deleted from billing')
  } else {
    console.log('[Database] No existing user found in billing')
  }
  
  // Создать нового пользователя в биллинге
  console.log('[Database] Creating new admin user in billing...')
  const hashedPassword = await bcrypt.hash(password, 10)
  
  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
      balance: 0,
      emailVerified: true,
    },
  })

  console.log('[Database] ✓ Admin created successfully in billing!')
  console.log(`[Database] ID: ${admin.id}`)
  
  console.log('\n✅ Admin setup completed!')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log('')
  console.log('⚠️  Change the password after first login!')
  
} catch (e) {
  console.error('Error:', e)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
