#!/bin/bash

# 🚀 Скрипт быстрого развёртывания: Уникальность просмотров + PR_MANAGER
# Автор: Kiro AI
# Дата: 2026-07-19
# Версия: 1.0

set -e  # Остановка при ошибке

echo "════════════════════════════════════════════════════════════════"
echo "🚀 Развёртывание: Уникальность просмотров + Роль PR_MANAGER"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Переменные
DB_USER="fluxor"
DB_NAME="fluxor"
APP_DIR="/var/www/billing"

echo "📁 Переход в директорию приложения..."
cd $APP_DIR

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Шаг 1/6: Создание таблицы ReferralView"
echo "════════════════════════════════════════════════════════════════"

# Проверка существования таблицы
TABLE_EXISTS=$(mysql -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_name = 'referralview';")

if [ "$TABLE_EXISTS" -eq "1" ]; then
    echo "⚠️  Таблица referralview уже существует. Пропускаю создание."
else
    echo "📊 Создание таблицы referralview..."
    mysql -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME <<EOF
CREATE TABLE IF NOT EXISTS \`referralview\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`linkId\` VARCHAR(191) NOT NULL,
  \`ipAddress\` VARCHAR(191) NULL,
  \`fingerprint\` VARCHAR(191) NULL,
  \`userAgent\` TEXT NULL,
  \`viewedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (\`id\`),
  INDEX \`referralview_linkId_idx\` (\`linkId\`),
  INDEX \`referralview_ipAddress_idx\` (\`ipAddress\`),
  INDEX \`referralview_fingerprint_idx\` (\`fingerprint\`),
  INDEX \`referralview_viewedAt_idx\` (\`viewedAt\`),
  
  CONSTRAINT \`referralview_linkId_fkey\` 
    FOREIGN KEY (\`linkId\`) 
    REFERENCES \`referrallink\`(\`id\`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
    echo "✅ Таблица referralview создана!"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Шаг 2/6: Проверка роли PR_MANAGER в enum"
echo "════════════════════════════════════════════════════════════════"

# Проверка наличия PR_MANAGER в enum
ENUM_CHECK=$(mysql -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME -sse "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'role';" | grep -c "PR_MANAGER" || echo "0")

if [ "$ENUM_CHECK" -eq "1" ]; then
    echo "✅ Роль PR_MANAGER уже есть в enum"
else
    echo "⚠️  Добавление PR_MANAGER в enum роли..."
    mysql -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME <<EOF
ALTER TABLE \`User\` MODIFY COLUMN \`role\` ENUM('USER', 'ADMIN', 'PR_MANAGER') NOT NULL DEFAULT 'USER';
EOF
    echo "✅ Роль PR_MANAGER добавлена в enum!"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Шаг 3/6: Регенерация Prisma Client"
echo "════════════════════════════════════════════════════════════════"

echo "🔄 Запуск npx prisma generate..."
npx prisma generate
echo "✅ Prisma Client обновлён с моделью ReferralView!"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Шаг 4/6: Очистка кэша Next.js"
echo "════════════════════════════════════════════════════════════════"

echo "🗑️  Удаление .next директории..."
rm -rf .next
echo "✅ Кэш очищен!"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Шаг 5/6: Сборка приложения"
echo "════════════════════════════════════════════════════════════════"

echo "🔨 Запуск npm run build..."
npm run build
echo "✅ Приложение собрано!"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Шаг 6/6: Перезапуск PM2"
echo "════════════════════════════════════════════════════════════════"

echo "♻️  Перезапуск avelon-web..."
pm2 restart avelon-web
echo "✅ PM2 перезапущен!"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Развёртывание завершено успешно!"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📋 Что было сделано:"
echo "  ✅ Таблица ReferralView создана"
echo "  ✅ Роль PR_MANAGER добавлена в enum"
echo "  ✅ Prisma Client перегенерирован"
echo "  ✅ Next.js кэш очищен"
echo "  ✅ Приложение пересобрано"
echo "  ✅ PM2 перезапущен"
echo ""

echo "🔍 Проверка логов (последние 30 строк):"
echo "════════════════════════════════════════════════════════════════"
pm2 logs avelon-web --lines 30 --nostream

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 Проверка базы данных:"
echo "════════════════════════════════════════════════════════════════"

echo ""
echo "Таблицы реферальной системы:"
mysql -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME -e "SHOW TABLES LIKE 'referral%';"

echo ""
echo "Структура таблицы ReferralView:"
mysql -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME -e "DESCRIBE referralview;"

echo ""
echo "Enum роли User:"
mysql -u $DB_USER -p$MYSQL_PASSWORD $DB_NAME -e "SHOW COLUMNS FROM User LIKE 'role';"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎉 Готово! Теперь проверьте:"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Тест уникальности просмотров:"
echo "   - Создайте реферальную ссылку в /admin/referrals"
echo "   - Откройте инкогнито: https://fluxor.solutions?ref=YOURCODE"
echo "   - Обновите страницу (F5)"
echo "   - Проверьте DevTools Console - должно быть 'duplicate: true'"
echo ""
echo "2️⃣  Тест роли PR_MANAGER:"
echo "   - Зайдите в /admin → Пользователи"
echo "   - Нажмите редактировать → выберите роль PR_MANAGER"
echo "   - Проверьте что роль отображается оранжевым цветом"
echo ""
echo "📖 Полная документация: НОВЫЕ_ФИЧИ_REFERRAL_AND_ROLES.md"
echo ""
echo "════════════════════════════════════════════════════════════════"
