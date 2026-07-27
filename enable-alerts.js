// Скрипт для включения всех системных alerts
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function enableAlerts() {
  try {
    console.log('Включаем системные alerts...')
    
    const result = await prisma.alert.updateMany({
      where: {
        isSystem: true
      },
      data: {
        isActive: true
      }
    })
    
    console.log(`✅ Включено ${result.count} системных alerts`)
    
    const allAlerts = await prisma.alert.findMany({
      orderBy: { priority: 'asc' }
    })
    
    console.log('\nВсе alerts:')
    allAlerts.forEach(a => {
      const status = a.isActive ? '✅' : '❌'
      const systemTag = a.isSystem ? `[SYSTEM:${a.systemType}]` : '[CUSTOM]'
      console.log(`${status} ${systemTag} ${a.type}: ${a.message.substring(0, 60)}...`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

enableAlerts()
