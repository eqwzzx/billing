# Скрипт для копирования исправленных файлов на VDS

$VDS_IP = "77.91.100.68"
$VDS_USER = "root"
$VDS_PATH = "/var/www/billing"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  КОПИРОВАНИЕ ФАЙЛОВ НА VDS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Параметры:" -ForegroundColor Yellow
Write-Host "   IP: $VDS_IP"
Write-Host "   Пользователь: $VDS_USER"
Write-Host "   Путь: $VDS_PATH"
Write-Host ""

$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "📂 Локальный путь: $ProjectPath" -ForegroundColor Yellow
Write-Host ""

# Проверка наличия файлов
$LoginRoute = Join-Path $ProjectPath "app\api\auth\login\route.ts"
$MeRoute = Join-Path $ProjectPath "app\api\auth\me\route.ts"

if (-not (Test-Path $LoginRoute)) {
    Write-Host "❌ Файл не найден: $LoginRoute" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path $MeRoute)) {
    Write-Host "❌ Файл не найден: $MeRoute" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Все файлы найдены" -ForegroundColor Green
Write-Host ""

# Копирование файлов
Write-Host "📦 Начинаем копирование..." -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣ Копирование login route..." -ForegroundColor Cyan
scp $LoginRoute "${VDS_USER}@${VDS_IP}:${VDS_PATH}/app/api/auth/login/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при копировании login route" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "   ✅ login route скопирован" -ForegroundColor Green
Write-Host ""

Write-Host "2️⃣ Копирование me route..." -ForegroundColor Cyan
scp $MeRoute "${VDS_USER}@${VDS_IP}:${VDS_PATH}/app/api/auth/me/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при копировании me route" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "   ✅ me route скопирован" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ВСЕ ФАЙЛЫ УСПЕШНО СКОПИРОВАНЫ!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 СЛЕДУЮЩИЕ ШАГИ:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Подключитесь к VDS и выполните:" -ForegroundColor White
Write-Host ""
Write-Host "   ssh ${VDS_USER}@${VDS_IP}" -ForegroundColor Cyan
Write-Host "   cd ${VDS_PATH}" -ForegroundColor Cyan
Write-Host "   rm -rf .next" -ForegroundColor Cyan
Write-Host "   npm run build" -ForegroundColor Cyan
Write-Host "   pm2 restart fluxor-web" -ForegroundColor Cyan
Write-Host "   pm2 logs fluxor-web" -ForegroundColor Cyan
Write-Host ""

Write-Host "ИЛИ выполните одной командой:" -ForegroundColor Yellow
Write-Host ""
$OneLineCommand = "cd ${VDS_PATH} && rm -rf .next && npm run build && pm2 restart fluxor-web && pm2 logs fluxor-web --lines 30"
Write-Host "   $OneLineCommand" -ForegroundColor Cyan
Write-Host ""

# Опция для автоматического выполнения команд на VDS
$AutoDeploy = Read-Host "Выполнить сборку и перезапуск автоматически? (y/N)"

if ($AutoDeploy -eq "y" -or $AutoDeploy -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Выполнение команд на VDS..." -ForegroundColor Yellow
    Write-Host ""
    
    # Команды для выполнения
    $Commands = @(
        "cd ${VDS_PATH}",
        "rm -rf .next",
        "npm run build",
        "pm2 restart fluxor-web",
        "echo ''",
        "echo '✅ Готово! Проверьте логи:'",
        "pm2 logs fluxor-web --lines 30 --nostream"
    )
    
    $FullCommand = $Commands -join " && "
    
    ssh "${VDS_USER}@${VDS_IP}" $FullCommand
    
    Write-Host ""
    Write-Host "✅ Развёртывание завершено!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "ℹ️  Скопируйте и выполните команды вручную" -ForegroundColor Cyan
}

pause
