# Добавление функционала в Discord бот и исправление ошибок

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing"
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ДОБАВЛЕНИЕ ФУНКЦИОНАЛА В DISCORD БОТ  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "✨ Что будет добавлено:" -ForegroundColor Yellow
Write-Host "  1. /addbalance - добавление баланса пользователю" -ForegroundColor White
Write-Host "  2. /removebalance - убавление баланса пользователю" -ForegroundColor White
Write-Host "  3. /profile - просмотр профиля по email/Discord ID" -ForegroundColor White
Write-Host "  4. Исправлена команда /balance (ошибка getaddrinfo)" -ForegroundColor White
Write-Host "  5. Проверка Discord/Email при создании сервера" -ForegroundColor White
Write-Host ""

# Файлы для копирования
$FilesToCopy = @(
    @{
        Local = "discord-bot\commands\balance.js"
        Remote = "discord-bot/commands/"
        Description = "balance.js (исправлена ошибка)"
    },
    @{
        Local = "discord-bot\commands\addbalance.js"
        Remote = "discord-bot/commands/"
        Description = "addbalance.js (новая команда)"
    },
    @{
        Local = "discord-bot\commands\removebalance.js"
        Remote = "discord-bot/commands/"
        Description = "removebalance.js (новая команда)"
    },
    @{
        Local = "discord-bot\commands\profile.js"
        Remote = "discord-bot/commands/"
        Description = "profile.js (новая команда)"
    },
    @{
        Local = "app\api\servers\create\route.ts"
        Remote = "app/api/servers/create/"
        Description = "server create (проверка Discord/Email)"
    }
)

$AllSuccess = $true

foreach ($file in $FilesToCopy) {
    $localPath = Join-Path $PROJECT_DIR $file.Local
    $remotePath = "${VDS}:${VDS_PATH}/$($file.Remote)"
    
    Write-Host "📤 $($file.Description)..." -ForegroundColor Cyan
    
    if (-not (Test-Path $localPath)) {
        Write-Host "   ❌ Файл не найден: $($file.Local)" -ForegroundColor Red
        $AllSuccess = $false
        continue
    }
    
    scp $localPath $remotePath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Ошибка копирования" -ForegroundColor Red
        $AllSuccess = $false
    } else {
        Write-Host "   ✅ Скопировано" -ForegroundColor Green
    }
}

if (-not $AllSuccess) {
    Write-Host ""
    Write-Host "❌ Не все файлы скопированы. Продолжить?" -ForegroundColor Red
    $continue = Read-Host "Y/N"
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Настройка на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "cd $VDS_PATH",
    "echo '🔧 Регистрация новых команд Discord...'",
    "cd discord-bot",
    "node deploy-commands.js",
    "cd ..",
    "echo '🧹 Очистка старой сборки веб-приложения...'",
    "rm -rf .next",
    "echo '🏗️ Сборка веб-приложения...'",
    "npm run build",
    "echo '🔄 Перезапуск сервисов...'",
    "pm2 restart fluxor-web",
    "pm2 restart fluxor-bot",
    "sleep 3",
    "echo ''",
    "echo '✅ ВСЕ ГОТОВО!'",
    "echo ''",
    "echo '📊 Статус PM2:'",
    "pm2 status | grep fluxor",
    "echo ''",
    "echo '📋 Последние логи бота:'",
    "pm2 logs fluxor-bot --lines 20 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ ФУНКЦИОНАЛ ДОБАВЛЕН!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 НОВЫЕ КОМАНДЫ БОТА:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Для администраторов:" -ForegroundColor White
Write-Host "  /addbalance user:<email/discord_id> amount:<сумма> [reason:<причина>]" -ForegroundColor Cyan
Write-Host "  /removebalance user:<email/discord_id> amount:<сумма> [reason:<причина>]" -ForegroundColor Cyan
Write-Host "  /profile user:<email/discord_id>" -ForegroundColor Cyan
Write-Host ""
Write-Host "Для всех пользователей:" -ForegroundColor White
Write-Host "  /balance - проверить свой баланс" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚙️  НОВАЯ ЛОГИКА:" -ForegroundColor Yellow
Write-Host "  • Если Discord привязан → Email верифицировать необязательно" -ForegroundColor White
Write-Host "  • Если Discord не привязан → Нужна верификация Email" -ForegroundColor White
Write-Host "  • Если включена 'Обязательная привязка Discord' → Без Discord создать сервер нельзя" -ForegroundColor White
Write-Host ""

Write-Host "📊 Просмотр логов:" -ForegroundColor Yellow
Write-Host "  ssh $VDS" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-bot" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-web | grep 'Create Server'" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  ПРИМЕЧАНИЕ:" -ForegroundColor Yellow
Write-Host "  Для использования админских команд бота добавьте свой Discord ID в .env:" -ForegroundColor White
Write-Host "  ADMIN_DISCORD_IDS=\"your_discord_id_here\"" -ForegroundColor Cyan
Write-Host ""

pause
