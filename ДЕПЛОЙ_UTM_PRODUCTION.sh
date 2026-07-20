#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║           ДЕПЛОЙ UTM ТРЕКИНГА НА PRODUCTION (Ubuntu 22.04)           ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -e  # Остановить при ошибке

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                    ДЕПЛОЙ UTM ТРЕКИНГА - START                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ========================================
# ШАГ 1: ПЕРЕХОДИМ В ДИРЕКТОРИЮ ПРОЕКТА
# ========================================
echo "📁 [1/6] Переход в директорию проекта..."
cd ~/Avelon-Web-main || { echo "❌ Директория не найдена!"; exit 1; }
pwd
echo "✅ В директории проекта"
echo ""

# ========================================
# ШАГ 2: СОЗДАЁМ BACKUP (НА ВСЯКИЙ СЛУЧАЙ)
# ========================================
echo "💾 [2/6] Создание backup текущей версии..."
BACKUP_DIR=~/backups/avelon-$(date +%Y%m%d_%H%M%S)
mkdir -p ~/backups
cp -r ~/Avelon-Web-main $BACKUP_DIR
echo "✅ Backup создан: $BACKUP_DIR"
echo ""

# ========================================
# ШАГ 3: ПОЛУЧАЕМ ИЗМЕНЕНИЯ ИЗ GIT
# ========================================
echo "📥 [3/6] Получение изменений из Git..."
git fetch origin
git pull origin main
echo "✅ Изменения получены"
echo ""

# ========================================
# ШАГ 4: ПРОВЕРЯЕМ БАЗУ ДАННЫХ
# ========================================
echo "🗄️  [4/6] Проверка структуры БД..."
echo "ℹ️  Проверяем наличие таблицы MarketingEvent и enum marketing_event_type..."

# Проверяем наличие таблицы
mysql -u root -p$(grep DATABASE_PASSWORD .env | cut -d '=' -f2) \
      -D $(grep DATABASE_NAME .env | cut -d '=' -f2) \
      -e "DESCRIBE MarketingEvent;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Таблица MarketingEvent существует"
    
    # Проверяем enum marketing_event_type
    mysql -u root -p$(grep DATABASE_PASSWORD .env | cut -d '=' -f2) \
          -D $(grep DATABASE_NAME .env | cut -d '=' -f2) \
          -e "SHOW COLUMNS FROM MarketingEvent LIKE 'eventType';" | grep -q "VIEW"
    
    if [ $? -eq 0 ]; then
        echo "✅ Enum marketing_event_type содержит VIEW"
    else
        echo "⚠️  VIEW может отсутствовать в enum, но это не критично"
    fi
else
    echo "⚠️  Таблица MarketingEvent не найдена!"
    echo "ℹ️  Запусти миграцию: npx prisma migrate deploy"
    exit 1
fi
echo ""

# ========================================
# ШАГ 5: УСТАНОВКА ЗАВИСИМОСТЕЙ И СБОРКА
# ========================================
echo "📦 [5/6] Установка зависимостей и сборка..."

# Очищаем кэш (опционально, но безопасно)
echo "🧹 Очистка кэша..."
rm -rf .next
rm -rf node_modules/.cache

# Обновляем зависимости (если нужно)
echo "📦 Проверка зависимостей..."
npm install --production=false

# Генерируем Prisma Client (ВАЖНО!)
echo "🔄 Генерация Prisma Client..."
npx prisma generate

# Собираем проект
echo "🏗️  Сборка проекта..."
npm run build

echo "✅ Проект собран"
echo ""

# ========================================
# ШАГ 6: ПЕРЕЗАПУСК СЕРВИСА
# ========================================
echo "🔄 [6/6] Перезапуск приложения..."

# Определяем менеджер процессов (PM2 или systemd)
if command -v pm2 &> /dev/null; then
    echo "ℹ️  Используется PM2"
    pm2 restart avelon-web
    pm2 save
    echo "✅ PM2: Приложение перезапущено"
elif systemctl is-active --quiet avelon-web; then
    echo "ℹ️  Используется systemd"
    sudo systemctl restart avelon-web
    echo "✅ Systemd: Приложение перезапущено"
else
    echo "⚠️  Менеджер процессов не найден!"
    echo "ℹ️  Запусти вручную: npm run start"
fi
echo ""

# ========================================
# ФИНАЛ: ПРОВЕРКА СТАТУСА
# ========================================
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                         ✅ ДЕПЛОЙ ЗАВЕРШЁН                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 ПРОВЕРЬ СТАТУС:"
if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
    echo "📝 ЛОГИ (последние 20 строк):"
    pm2 logs avelon-web --lines 20 --nostream
fi
echo ""
echo "✅ ИЗМЕНЕНИЯ:"
echo "   → Добавлен UTM трекинг для маркетинговой аналитики"
echo "   → Защита от дублирования просмотров (1 человек = 1 просмотр)"
echo "   → Исправлены async/await для cookies() (Next.js 15+)"
echo ""
echo "🧪 ТЕСТИРОВАНИЕ:"
echo "   1. Зайди на https://yourdomain.com/admin/marketing/utm-generator"
echo "   2. Создай UTM ссылку"
echo "   3. Открой в инкогнито"
echo "   4. Проверь /admin/marketing - должны появиться данные"
echo ""
echo "📚 ДОКУМЕНТАЦИЯ:"
echo "   → ТЕСТ_UTM_ТРЕКИНГА.md - как тестировать"
echo "   → УНИКАЛЬНОСТЬ_ПРОСМОТРОВ_UTM.md - про защиту от дубликатов"
echo "   → ИСПРАВЛЕНИЕ_UTM_SUMMARY.md - полное описание системы"
echo ""
echo "🎉 ГОТОВО!"
