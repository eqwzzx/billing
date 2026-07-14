# Применение всех исправлений Discord (настройки + редирект + отвязка)

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing"
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ПРИМЕНЕНИЕ ВСЕХ ИСПРАВЛЕНИЙ DISCORD   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Что будет исправлено:" -ForegroundColor Yellow
Write-Host "  1. Настройки Discord сохраняются после обновления страницы" -ForegroundColor White
Write-Host "  2. Редирект на правильный домен (не localhost)" -ForegroundColor White
Write-Host "  3. Discord не отвязывается" -ForegroundColor White
Write-Host ""

# Файлы для копирования
$FilesToCopy = @(
    @{
        Local = "app\api\auth\discord\callback\route.ts"
        Remote = "app/api/auth/discord/callback/"
        Description = "Discord callback (редирект)"
    },
    @{
        Local = "app\admin\page.tsx"
        Remote = "app/admin/"
        Description = "Admin page (настройки)"
    },
    @{
        Local = "discord-bot\utils\database.js"
        Remote = "discord-bot/utils/"
        Description = "Bot database (getDatabase fix)"
    },
    @{
        Local = "discord-bot\package.json"
        Remote = "discord-bot/"
        Description = "Bot package.json (@prisma/client)"
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
Write-Host "🔧 Настройка и сборка на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "cd $VDS_PATH",
    "echo '📝 Проверка .env...'",
    "grep -q 'NEXT_PUBLIC_APP_URL' .env || echo 'NEXT_PUBLIC_APP_URL=\"http://77.91.100.68:3000\"' >> .env",
    "echo '📦 Установка @prisma/client для бота...'",
    "cd discord-bot",
    "npm install @prisma/client",
    "cd ..",
    "echo '🔄 Генерация Prisma Client...'",
    "npx prisma generate",
    "echo '🧹 Очистка старой сборки...'",
    "rm -rf .next",
    "echo '🏗️ Сборка веб-приложения...'",
    "npm run build",
    "echo '🔄 Перезапуск всех сервисов...'",
    "pm2 restart fluxor-web",
    "pm2 restart fluxor-bot 2>/dev/null || (cd discord-bot && pm2 start index.js --name fluxor-bot)",
    "sleep 3",
    "echo ''",
    "echo '✅ ВСЕ ГОТОВО!'",
    "echo ''",
    "echo '📊 Статус PM2:'",
    "pm2 status | grep fluxor",
    "echo ''",
    "echo '📋 Последние логи веб-приложения:'",
    "pm2 logs fluxor-web --lines 15 --nostream",
    "echo ''",
    "echo '📋 Последние логи бота:'",
    "pm2 logs fluxor-bot --lines 15 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 ТЕСТИРОВАНИЕ:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Настройки Discord:" -ForegroundColor White
Write-Host "   • Откройте админ панель → Настройки" -ForegroundColor Gray
Write-Host "   • Включите 'Обязательная привязка Discord'" -ForegroundColor Gray
Write-Host "   • Обновите страницу (F5)" -ForegroundColor Gray
Write-Host "   • Настройка должна остаться включённой ✓" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Привязка Discord:" -ForegroundColor White
Write-Host "   • Перейдите в настройки профиля" -ForegroundColor Gray
Write-Host "   • Нажмите 'Привязать Discord'" -ForegroundColor Gray
Write-Host "   • После авторизации URL должен быть:" -ForegroundColor Gray
Write-Host "     http://77.91.100.68:3000/client/settings?discord=linked" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Discord не отвязывается:" -ForegroundColor White
Write-Host "   • Обновите страницу несколько раз" -ForegroundColor Gray
Write-Host "   • Discord должен оставаться привязанным ✓" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 Просмотр логов:" -ForegroundColor Yellow
Write-Host "  ssh $VDS" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-web | grep Discord" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-bot" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  ВАЖНО:" -ForegroundColor Yellow
Write-Host "  После настройки SSL/HTTPS измените в файле:" -ForegroundColor White
Write-Host "  app/api/auth/discord/callback/route.ts" -ForegroundColor Cyan
Write-Host "  secure: false → secure: true" -ForegroundColor Cyan
Write-Host ""

pause
