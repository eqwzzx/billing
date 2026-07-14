# Автоматическое исправление синтаксических ошибок и развёртывание

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing"
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ИСПРАВЛЕНИЕ СИНТАКСИЧЕСКИХ ОШИБОК     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Проверка файлов
$MeRoute = Join-Path $PROJECT_DIR "app\api\auth\me\route.ts"
$LoginRoute = Join-Path $PROJECT_DIR "app\api\auth\login\route.ts"

if (-not (Test-Path $MeRoute)) {
    Write-Host "❌ Файл не найден: $MeRoute" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path $LoginRoute)) {
    Write-Host "❌ Файл не найден: $LoginRoute" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Файлы найдены" -ForegroundColor Green
Write-Host ""

# Копирование файлов
Write-Host "📤 Копирование исправленных файлов на VDS..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  → me/route.ts..." -ForegroundColor Cyan
scp $MeRoute "${VDS}:${VDS_PATH}/app/api/auth/me/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка копирования me/route.ts" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "     ✅ Скопировано" -ForegroundColor Green

Write-Host "  → login/route.ts..." -ForegroundColor Cyan
scp $LoginRoute "${VDS}:${VDS_PATH}/app/api/auth/login/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка копирования login/route.ts" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "     ✅ Скопировано" -ForegroundColor Green
Write-Host ""

# Сборка и перезапуск на VDS
Write-Host "🏗️ Сборка проекта на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "cd $VDS_PATH",
    "echo '🧹 Очистка старой сборки...'",
    "rm -rf .next",
    "echo '🏗️ Сборка проекта...'",
    "npm run build",
    "echo '🔄 Перезапуск PM2...'",
    "pm2 restart fluxor-web",
    "sleep 2",
    "echo ''",
    "echo '✅ ГОТОВО!'",
    "echo ''",
    "echo '📊 Последние логи:'",
    "pm2 logs fluxor-web --lines 30 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ ИСПРАВЛЕНИЕ ПРИМЕНЕНО!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 Проверка:" -ForegroundColor Yellow
Write-Host "  1. Откройте браузер (инкогнито)" -ForegroundColor White
Write-Host "  2. http://77.91.100.68:3000" -ForegroundColor Cyan
Write-Host "  3. Попробуйте войти" -ForegroundColor White
Write-Host ""

Write-Host "📊 Для просмотра логов в реальном времени:" -ForegroundColor Yellow
Write-Host "  ssh $VDS" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-web" -ForegroundColor Cyan
Write-Host ""

pause
