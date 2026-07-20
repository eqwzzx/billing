#!/bin/bash
# Полное обновление Production сервера после изменений

set -e  # Остановить при ошибке

echo "=========================================="
echo "Полное обновление Production сервера"
echo "=========================================="
echo ""

# Переход в директорию проекта
cd /var/www/billing

echo "Шаг 1: Остановка приложения..."
pm2 stop 0 || true

echo ""
echo "Шаг 2: Применение SQL миграций..."

# Добавление роли PR_MANAGER
echo "  - Добавление роли PR_MANAGER..."
mysql -u fluxor -p fluxor < fix-pr-manager-role.sql

# Создание реферальных таблиц (если ещё не созданы)
echo "  - Создание реферальных таблиц..."
mysql -u fluxor -p fluxor < create-referral-tables-no-fk.sql 2>/dev/null || echo "    Таблицы уже существуют (это нормально)"

# Добавление поля userAgent
echo "  - Добавление поля userAgent..."
mysql -u fluxor -p fluxor < fix-referral-tracking-simple.sql 2>/dev/null || echo "    Поле уже существует (это нормально)"

echo ""
echo "Шаг 3: Очистка кэша..."
rm -rf .next
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo ""
echo "Шаг 4: Синхронизация Prisma с базой данных..."
npx prisma db pull
npx prisma generate

echo ""
echo "Шаг 5: Сборка приложения..."
npm run build

echo ""
echo "Шаг 6: Запуск приложения..."
pm2 start avelon-web

echo ""
echo "Шаг 7: Проверка статуса..."
pm2 list

echo ""
echo "=========================================="
echo "✅ Обновление завершено!"
echo "=========================================="
echo ""
echo "Проверьте логи:"
echo "  pm2 logs avelon-web --lines 50"
echo ""
echo "Проверьте сайт:"
echo "  https://fluxor.solutions/admin/referrals"
echo ""
