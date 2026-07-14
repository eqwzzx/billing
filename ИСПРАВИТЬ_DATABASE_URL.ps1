# Исправление DATABASE_URL в Discord боте

$VDS = "root@77.91.100.68"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║   ИСПРАВЛЕНИЕ DATABASE_URL               ║" -ForegroundColor Red
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

Write-Host "🔍 Проверка DATABASE_URL на VDS..." -ForegroundColor Yellow
Write-Host ""

ssh $VDS "cat /var/www/billing/discord-bot/.env | grep DATABASE_URL"

Write-Host ""
Write-Host "❓ DATABASE_URL правильный?" -ForegroundColor Yellow
Write-Host "   Должно быть:" -ForegroundColor White
Write-Host "   DATABASE_URL=`"mysql://avelon:123456@localhost:3306/avelon`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Или:" -ForegroundColor White
Write-Host "   DATABASE_URL=`"mysql://user:password@localhost:3306/database`"" -ForegroundColor Cyan
Write-Host ""

$fix = Read-Host "Исправить? (Y/N)"

if ($fix -eq "Y" -or $fix -eq "y") {
    Write-Host ""
    Write-Host "🔧 Исправление DATABASE_URL..." -ForegroundColor Yellow
    
    $Commands = @(
        "cd /var/www/billing/discord-bot",
        "echo ''",
        "echo '🔍 Старое значение:'",
        "grep DATABASE_URL .env",
        "echo ''",
        "echo '🔧 Исправление...'",
        # Копируем из основного .env
        "sed -i 's|^DATABASE_URL=.*|DATABASE_URL=\"mysql://avelon:123456@localhost:3306/avelon\"|' .env",
        "echo '✅ Исправлено!'",
        "echo ''",
        "echo '🔍 Новое значение:'",
        "grep DATABASE_URL .env",
        "echo ''",
        "echo '🔄 Перезапуск бота...'",
        "cd /var/www/billing",
        "pm2 restart fluxor-bot",
        "sleep 2",
        "pm2 logs fluxor-bot --lines 10 --nostream"
    )
    
    $FullCommand = $Commands -join " && "
    ssh $VDS $FullCommand
    
    Write-Host ""
    Write-Host "✅ ГОТОВО!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Протестируйте /balance в Discord" -ForegroundColor Yellow
}

Write-Host ""
pause
