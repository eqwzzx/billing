# Исправление ошибки Prisma в Discord боте

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║   ИСПРАВЛЕНИЕ ОШИБКИ PRISMA В БОТЕ      ║" -ForegroundColor Red
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

Write-Host "❌ Ошибка: @prisma/client did not initialize yet" -ForegroundColor Red
Write-Host "✅ Решение: Запустить prisma generate в discord-bot/" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Исправление на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "cd $VDS_PATH/discord-bot",
    "echo '📦 Копирование schema.prisma из основного проекта...'",
    "cp ../prisma/schema.prisma ./prisma/schema.prisma 2>/dev/null || mkdir -p prisma && cp ../prisma/schema.prisma ./prisma/schema.prisma",
    "echo '🔧 Генерация Prisma Client...'",
    "npx prisma generate",
    "echo '📦 Установка @prisma/client (если нужно)...'",
    "npm install @prisma/client",
    "echo '🔄 Перезапуск бота...'",
    "cd ..",
    "pm2 restart fluxor-bot",
    "sleep 2",
    "echo ''",
    "echo '✅ ГОТОВО!'",
    "echo ''",
    "echo '📊 Статус бота:'",
    "pm2 status | grep fluxor-bot",
    "echo ''",
    "echo '📋 Последние логи:'",
    "pm2 logs fluxor-bot --lines 20 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ ИСПРАВЛЕНО!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 Проверьте команду в Discord:" -ForegroundColor Yellow
Write-Host "  /balance" -ForegroundColor Cyan
Write-Host "  /addbalance user:admin@eqwzzx.wtf amount:100 reason:Тест" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Если всё ещё есть ошибки, посмотрите логи:" -ForegroundColor Yellow
Write-Host "  ssh $VDS" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-bot" -ForegroundColor Cyan
Write-Host ""

pause
