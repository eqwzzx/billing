// Тест проверки наличия таблицы Alert в БД
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAlerts() {
  try {
    console.log('Проверка таблицы Alert...')
    
    const alerts = await prisma.alert.findMany()
    console.log(`✅ Таблица Alert существует, найдено записей: ${alerts.length}`)
    
    if (alerts.length > 0) {
      console.log('\nАктивные alerts:')
      alerts.forEach(a => {
        console.log(`- [${a.isActive ? '✓' : '✗'}] ${a.type}: ${a.message.substring(0, 50)}...`)
      })
    } else {
      console.log('⚠️ Таблица пустая! Выполните SQL: create-alerts-table.sql')
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    if (error.code === 'P2021') {
      console.log('\n⚠️ Таблица Alert не существует в БД!')
      console.log('Выполните SQL файл: create-alerts-table.sql')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testAlerts()
