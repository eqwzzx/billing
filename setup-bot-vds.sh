#!/bin/bash
# Автоматическая настройка и запуск Discord бота на VDS

set -e  # Остановка при ошибке

echo "╔══════════════════════════════════════════╗"
echo "║   НАСТРОЙКА DISCORD БОТА НА VDS         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Переменные (ИЗМЕНИТЕ ПОД СЕБЯ!)
DB_PASSWORD="YOUR_DB_PASSWORD_HERE"
ADMIN_DISCORD_ID="YOUR_DISCORD_ID_HERE"
SERVER_IP="77.91.100.68"

PROJECT_DIR="/var/www/billing"
BOT_DIR="$PROJECT_DIR/discord-bot"

# Проверка директории
if [ ! -d "$BOT_DIR" ]; then
    echo "❌ Директория $BOT_DIR не найдена"
    exit 1
fi

cd "$BOT_DIR"
echo "✅ Перешли в $BOT_DIR"
echo ""

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install
echo "✅ Зависимости установлены"
echo ""

# Создание .env файла
echo "📝 Создание .env файла..."
cat > .env << EOF
# Discord Bot Configuration
DISCORD_TOKEN="MTUyNTc3MzI3NjY0MTQ5NzIzMA.G4ACSu.MkwSznJVDwgEeWmq8Ok1th93gq441wK4NfSiF0"
DISCORD_CLIENT_ID="1525773276641497230"
DISCORD_GUILD_ID="1525774593355419669"
DISCORD_OAUTH_CLIENT_SECRET="y8mpn4Gm-wx2-cgaR-oATxrTeI3Z9GdM"

# Verified Role
DISCORD_VERIFIED_ROLE_ID="1525774705955573760"

# Database
DATABASE_URL="mysql://fluxor:${DB_PASSWORD}@localhost:3306/fluxor"

# Bot Settings
BOT_PREFIX="!"
ADMIN_DISCORD_IDS="${ADMIN_DISCORD_ID}"

# Website URL
NEXT_PUBLIC_APP_URL="http://${SERVER_IP}:3000"
EOF

echo "✅ .env файл создан"
echo ""

# Регистрация команд Discord
echo "🔧 Регистрация команд Discord..."
node deploy-commands.js
echo "✅ Команды зарегистрированы"
echo ""

# Проверка, запущен ли уже бот
if pm2 list | grep -q "fluxor-bot"; then
    echo "♻️  Бот уже существует в PM2, перезапускаем..."
    pm2 restart fluxor-bot
else
    echo "🚀 Запуск бота через PM2..."
    pm2 start index.js --name fluxor-bot
fi

echo "✅ Бот запущен"
echo ""

# Сохранение конфигурации
pm2 save

# Показать статус
echo ""
echo "📊 Статус PM2:"
pm2 status

echo ""
echo "📋 Последние логи:"
pm2 logs fluxor-bot --lines 20 --nostream

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║            ✅ ГОТОВО!                    ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "📊 Для просмотра логов: pm2 logs fluxor-bot"
echo "🔄 Для перезапуска: pm2 restart fluxor-bot"
echo "🛑 Для остановки: pm2 stop fluxor-bot"
echo ""
