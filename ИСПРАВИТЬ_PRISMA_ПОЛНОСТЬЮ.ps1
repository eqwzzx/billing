# Полное исправление Prisma для Discord бота

# Вариант 1: Использовать Prisma Client из основного проекта
# Это проще и надежнее чем генерировать новый

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ПОЛНОЕ ИСПРАВЛЕНИЕ PRISMA ДЛЯ БОТА    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Вариант: Подключение Prisma из основного проекта" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 Выполнение на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "cd $VDS_PATH",
    "echo ''",
    "echo '🔍 Проверка наличия Prisma Client в основном проекте...'",
    "ls -la node_modules/.prisma/client/ | head -5",
    "echo ''",
    "echo '📦 Создание символической ссылки...'",
    "cd discord-bot",
    "rm -rf node_modules/.prisma",
    "ln -s ../node_modules/.prisma node_modules/.prisma",
    "ls -la node_modules/.prisma/",
    "echo ''",
    "echo '✅ Символическая ссылка создана!'",
    "echo ''",
    "echo '🔄 Перезапуск бота...'",
    "cd ..",
    "pm2 restart fluxor-bot",
    "sleep 3",
    "echo ''",
    "echo '📊 Статус:'",
    "pm2 status | grep fluxor",
    "echo ''",
    "echo '📋 Логи:'",
    "pm2 logs fluxor-bot --lines 15 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ ГОТОВО!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 Тестируйте в Discord:" -ForegroundColor Yellow
Write-Host "  /balance" -ForegroundColor Cyan
Write-Host "  /addbalance user:admin@eqwzzx.wtf amount:100 reason:Тест" -ForegroundColor Cyan
Write-Host ""

pause