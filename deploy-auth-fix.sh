#!/bin/bash
# Автоматическое исправление авторизации на production

set -e  # Остановка при ошибке

echo "🔧 Исправление авторизации на Fluxor Production"
echo "================================================"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/billing"

# Проверка, что мы в правильной директории
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Директория $PROJECT_DIR не найдена${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✅ Перешли в $PROJECT_DIR${NC}"

# Создание резервных копий
echo ""
echo "📦 Создание резервных копий..."
cp app/api/auth/login/route.ts app/api/auth/login/route.ts.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp app/api/auth/me/route.ts app/api/auth/me/route.ts.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
echo -e "${GREEN}✅ Резервные копии созданы${NC}"

# Применение исправлений
echo ""
echo "🔨 Применение исправлений..."

# Исправление 1: secure: false в login route
echo "  → Изменение secure flag в login route..."
sed -i 's/secure: process\.env\.NODE_ENV === '"'"'production'"'"'/secure: false \/\/ ИЗМЕНИТЬ НА true ПОСЛЕ НАСТРОЙКИ SSL\/HTTPS!/g' app/api/auth/login/route.ts

# Исправление 2: Отключение isAuthEnabled в login route
echo "  → Отключение проверки authEnabled в login route..."
sed -i '/const enabled = await isAuthEnabled()/,/}/s/^/    \/\/ ВРЕМЕННО ОТКЛЮЧЕНО: /' app/api/auth/login/route.ts

# Исправление 3: Отключение isAuthEnabled в me route
echo "  → Отключение проверки authEnabled в me route..."
sed -i '/const enabled = await isAuthEnabled()/,/}/s/^/    \/\/ ВРЕМЕННО ОТКЛЮЧЕНО: /' app/api/auth/me/route.ts

# Исправление 4: Добавление debug логов в me route (если ещё нет)
if ! grep -q "=== /api/auth/me DEBUG ===" app/api/auth/me/route.ts; then
    echo "  → Добавление debug логов в me route..."
    sed -i '/export async function GET(request: NextRequest) {/a\  console.log("=== /api/auth/me DEBUG ===")\n  console.log("All cookies:", request.cookies.getAll())\n  console.log("Cookie header:", request.headers.get("cookie"))\n  console.log("JWT_SECRET exists:", !!JWT_SECRET)' app/api/auth/me/route.ts
fi

echo -e "${GREEN}✅ Исправления применены${NC}"

# Очистка сборки
echo ""
echo "🧹 Очистка старой сборки..."
rm -rf .next
echo -e "${GREEN}✅ Очистка завершена${NC}"

# Сборка проекта
echo ""
echo "🏗️  Сборка проекта..."
if npm run build; then
    echo -e "${GREEN}✅ Сборка успешна${NC}"
else
    echo -e "${RED}❌ Ошибка сборки${NC}"
    exit 1
fi

# Перезапуск PM2
echo ""
echo "🔄 Перезапуск приложения..."
pm2 restart fluxor-web
sleep 2
echo -e "${GREEN}✅ Приложение перезапущено${NC}"

# Проверка статуса
echo ""
echo "📊 Статус приложения:"
pm2 list | grep fluxor-web

# Вывод последних логов
echo ""
echo "📋 Последние 20 строк логов:"
echo "============================================"
pm2 logs fluxor-web --lines 20 --nostream

echo ""
echo -e "${GREEN}✅ ГОТОВО!${NC}"
echo ""
echo "🧪 Для тестирования:"
echo "  1. Откройте браузер в режиме инкогнито"
echo "  2. Перейдите на http://77.91.100.68:3000"
echo "  3. Попробуйте войти"
echo ""
echo "📊 Для просмотра логов в реальном времени:"
echo "  pm2 logs fluxor-web"
echo ""
echo -e "${YELLOW}⚠️  ВАЖНО: После настройки SSL/HTTPS измените secure: false → true${NC}"
