# Срочное обновление Discord бота с исправлениями

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing/discord-bot"
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║   СРОЧНОЕ ОБНОВЛЕНИЕ DISCORD БОТА       ║" -ForegroundColor Red
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

$BotDir = Join-Path $PROJECT_DIR "discord-bot"

# Копирование исправленных файлов
Write-Host "📤 Копирование исправленных файлов..." -ForegroundColor Yellow
Write-Host ""

$FilesToCopy = @(
    @{Local = "utils\database.js"; Remote = "utils/"},
    @{Local = "package.json"; Remote = ""}
)

foreach ($file in $FilesToCopy) {
    $localPath = Join-Path $BotDir $file.Local
    $remotePath = "${VDS_PATH}/$($file.Remote)"
    
    Write-Host "  → $($file.Local)..." -ForegroundColor Cyan
    scp $localPath "${VDS}:${remotePath}"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Ошибка копирования $($file.Local)" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "     ✅ Скопировано" -ForegroundColor Green
}

Write-Host ""

# Обновление на VDS
Write-Host "🔧 Обновление на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "cd $VDS_PATH",
    "echo '📦 Установка @prisma/client...'",
    "npm install @prisma/client",
    "echo '🔄 Генерация Prisma Client...'",
    "cd ..",
    "npx prisma generate",
    "cd discord-bot",
    "echo '🔧 Регистрация команд...'",
    "node deploy-commands.js",
    "echo '🔄 Перезапуск бота...'",
    "pm2 restart fluxor-bot",
    "sleep 3",
    "echo ''",
    "echo '✅ ГОТОВО!'",
    "echo ''",
    "echo '📊 Статус:'",
    "pm2 status | grep fluxor-bot",
    "echo ''",
    "echo '📋 Последние логи (нажмите Ctrl+C для выхода):'",
    "pm2 logs fluxor-bot --lines 30 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ БОТ ОБНОВЛЁН!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Для просмотра логов в реальном времени:" -ForegroundColor Yellow
Write-Host "  ssh $VDS" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-bot" -ForegroundColor Cyan
Write-Host ""

pause
