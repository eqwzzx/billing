# Исправление проблем с Discord

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing"
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ИСПРАВЛЕНИЕ ПРОБЛЕМ С DISCORD         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Исправляем:" -ForegroundColor Yellow
Write-Host "  1. Настройки Discord не сохраняются" -ForegroundColor White
Write-Host "  2. Редирект на localhost после привязки" -ForegroundColor White
Write-Host "  3. Discord отвязывается" -ForegroundColor White
Write-Host ""

# Копирование исправленного файла callback
$CallbackFile = Join-Path $PROJECT_DIR "app\api\auth\discord\callback\route.ts"

if (-not (Test-Path $CallbackFile)) {
    Write-Host "❌ Файл не найден: $CallbackFile" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "📤 Копирование исправленного Discord callback..." -ForegroundColor Yellow
scp $CallbackFile "${VDS}:${VDS_PATH}/app/api/auth/discord/callback/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка копирования" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  ✅ Callback скопирован" -ForegroundColor Green
Write-Host ""

# Настройка .env и пересборка на VDS
Write-Host "🔧 Настройка на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "cd $VDS_PATH",
    "echo '📝 Проверка NEXT_PUBLIC_APP_URL...'",
    "grep -q 'NEXT_PUBLIC_APP_URL' .env || echo 'NEXT_PUBLIC_APP_URL=\"http://77.91.100.68:3000\"' >> .env",
    "echo '🧹 Очистка старой сборки...'",
    "rm -rf .next",
    "echo '🏗️ Сборка проекта...'",
    "npm run build",
    "echo '🔄 Перезапуск...'",
    "pm2 restart fluxor-web",
    "sleep 2",
    "echo ''",
    "echo '✅ ГОТОВО!'",
    "echo ''",
    "echo '📊 Статус:'",
    "pm2 status | grep fluxor-web",
    "echo ''",
    "echo '📋 Последние логи:'",
    "pm2 logs fluxor-web --lines 20 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 ТЕСТИРОВАНИЕ:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Откройте админ панель → Настройки" -ForegroundColor White
Write-Host "2. Включите 'Обязательная привязка Discord'" -ForegroundColor White
Write-Host "3. Обновите страницу (F5)" -ForegroundColor White
Write-Host "4. Проверьте, что настройка осталась включённой" -ForegroundColor White
Write-Host ""
Write-Host "5. Попробуйте привязать Discord" -ForegroundColor White
Write-Host "6. После редиректа URL должен быть:" -ForegroundColor White
Write-Host "   http://77.91.100.68:3000/client/settings?discord=linked" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Для просмотра логов:" -ForegroundColor Yellow
Write-Host "  ssh $VDS" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-web | grep Discord" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  ПРИМЕЧАНИЕ:" -ForegroundColor Yellow
Write-Host "  Если настройки всё ещё не сохраняются," -ForegroundColor White
Write-Host "  см. ИСПРАВЛЕНИЕ_DISCORD_НАСТРОЕК.md" -ForegroundColor White
Write-Host ""

pause
