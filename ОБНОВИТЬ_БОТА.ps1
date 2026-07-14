# Обновление Discord бота - использует mysql2 вместо Prisma

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing"
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ОБНОВЛЕНИЕ DISCORD БОТА (mysql2)       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Исправления:" -ForegroundColor Yellow
Write-Host "  • Все команды теперь используют mysql2" -ForegroundColor White
Write-Host "  • Убрана зависимость от Prisma" -ForegroundColor White
Write-Host "  • Используется пул подключений MySQL" -ForegroundColor White
Write-Host ""

# Файлы для копирования
$FilesToCopy = @(
    @{ Local = "discord-bot\utils\database.js"; Remote = "discord-bot/utils/"; Description = "database.js" },
    @{ Local = "discord-bot\commands\balance.js"; Remote = "discord-bot/commands/"; Description = "balance.js" },
    @{ Local = "discord-bot\commands\addbalance.js"; Remote = "discord-bot/commands/"; Description = "addbalance.js" },
    @{ Local = "discord-bot\commands\removebalance.js"; Remote = "discord-bot/commands/"; Description = "removebalance.js" },
    @{ Local = "discord-bot\commands\profile.js"; Remote = "discord-bot/commands/"; Description = "profile.js" },
    @{ Local = "discord-bot\utils\notifications.js"; Remote = "discord-bot/utils/"; Description = "notifications.js" }
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
    Write-Host "❌ Не все файлы скопированы!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "🔧 Перезапуск бота на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "cd $VDS_PATH",
    "pm2 restart fluxor-bot",
    "sleep 2",
    "echo ''",
    "echo '📊 Статус:'",
    "pm2 status | grep fluxor-bot",
    "echo ''",
    "echo '📋 Логи:'",
    "pm2 logs fluxor-bot --lines 15 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ БОТ ОБНОВЛЕН!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 Протестируйте в Discord:" -ForegroundColor Yellow
Write-Host "  /balance" -ForegroundColor Cyan
Write-Host "  /addbalance user:admin@eqwzzx.wtf amount:100 reason:Тест" -ForegroundColor Cyan
Write-Host "  /profile user:admin@eqwzzx.wtf" -ForegroundColor Cyan
Write-Host ""

pause