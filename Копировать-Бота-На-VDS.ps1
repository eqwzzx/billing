# Копирование Discord бота на VDS

$VDS = "root@77.91.100.68"
$VDS_PATH = "/var/www/billing"
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   КОПИРОВАНИЕ DISCORD БОТА НА VDS       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Параметры:" -ForegroundColor Yellow
Write-Host "   VDS: $VDS"
Write-Host "   Путь: $VDS_PATH"
Write-Host ""

$BotDir = Join-Path $PROJECT_DIR "discord-bot"

if (-not (Test-Path $BotDir)) {
    Write-Host "❌ Папка discord-bot не найдена: $BotDir" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Папка бота найдена" -ForegroundColor Green
Write-Host ""

# Создание временного архива
$TempZip = Join-Path $env:TEMP "discord-bot-$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"

Write-Host "📦 Создание архива бота..." -ForegroundColor Yellow

# Исключаем node_modules из архива
$FilesToZip = Get-ChildItem -Path $BotDir -Recurse -Exclude "node_modules" | Where-Object { 
    $_.FullName -notmatch "\\node_modules\\"
}

# Используем .NET для создания архива
Add-Type -AssemblyName System.IO.Compression.FileSystem

try {
    # Создаём временную директорию для архива
    $TempDir = Join-Path $env:TEMP "discord-bot-temp"
    if (Test-Path $TempDir) {
        Remove-Item -Path $TempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $TempDir | Out-Null
    
    # Копируем файлы во временную директорию (исключая node_modules)
    Write-Host "  → Подготовка файлов..." -ForegroundColor Cyan
    
    $ExcludeDirs = @("node_modules", ".git")
    
    Get-ChildItem -Path $BotDir -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($BotDir.Length + 1)
        $shouldExclude = $false
        
        foreach ($exclude in $ExcludeDirs) {
            if ($relativePath -like "*$exclude*") {
                $shouldExclude = $true
                break
            }
        }
        
        if (-not $shouldExclude) {
            $destPath = Join-Path $TempDir $relativePath
            $destDir = Split-Path -Parent $destPath
            
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            
            if (-not $_.PSIsContainer) {
                Copy-Item -Path $_.FullName -Destination $destPath -Force
            }
        }
    }
    
    Write-Host "  → Создание ZIP архива..." -ForegroundColor Cyan
    [System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $TempZip)
    
    Write-Host "  ✅ Архив создан: $TempZip" -ForegroundColor Green
    
    # Очистка временной директории
    Remove-Item -Path $TempDir -Recurse -Force
    
} catch {
    Write-Host "❌ Ошибка создания архива: $_" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# Копирование архива на VDS
Write-Host "📤 Копирование архива на VDS..." -ForegroundColor Yellow
scp $TempZip "${VDS}:/tmp/discord-bot.zip"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка копирования архива" -ForegroundColor Red
    Remove-Item -Path $TempZip -Force
    pause
    exit 1
}

Write-Host "  ✅ Архив скопирован" -ForegroundColor Green

# Удаление временного архива
Remove-Item -Path $TempZip -Force

Write-Host ""

# Распаковка и настройка на VDS
Write-Host "🔧 Настройка на VDS..." -ForegroundColor Yellow
Write-Host ""

$Commands = @(
    "echo '🗑️  Удаление старых файлов бота...'",
    "rm -rf $VDS_PATH/discord-bot/commands",
    "rm -rf $VDS_PATH/discord-bot/handlers",
    "rm -rf $VDS_PATH/discord-bot/utils",
    "rm -f $VDS_PATH/discord-bot/*.js",
    "rm -f $VDS_PATH/discord-bot/*.md",
    "echo '📦 Распаковка архива...'",
    "cd /tmp",
    "unzip -o discord-bot.zip -d discord-bot-new",
    "echo '📋 Копирование файлов...'",
    "cp -r discord-bot-new/* $VDS_PATH/discord-bot/",
    "rm -rf discord-bot-new",
    "rm -f discord-bot.zip",
    "echo '📦 Установка зависимостей...'",
    "cd $VDS_PATH/discord-bot",
    "npm install --production",
    "echo '🔧 Регистрация команд Discord...'",
    "node deploy-commands.js",
    "echo '🔄 Перезапуск бота...'",
    "pm2 restart fluxor-bot 2>/dev/null || pm2 start index.js --name fluxor-bot",
    "sleep 2",
    "echo ''",
    "echo '✅ ГОТОВО!'",
    "echo ''",
    "echo '📊 Статус:'",
    "pm2 status | grep fluxor",
    "echo ''",
    "echo '📋 Последние логи:'",
    "pm2 logs fluxor-bot --lines 20 --nostream"
)

$FullCommand = $Commands -join " && "

ssh $VDS $FullCommand

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ БОТ ОБНОВЛЁН И ЗАПУЩЕН!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Для просмотра логов:" -ForegroundColor Yellow
Write-Host "  ssh $VDS" -ForegroundColor Cyan
Write-Host "  pm2 logs fluxor-bot" -ForegroundColor Cyan
Write-Host ""

pause
