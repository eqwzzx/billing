@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║   ИСПРАВЛЕНИЕ СИНТАКСИЧЕСКИХ ОШИБОК     ║
echo ╚══════════════════════════════════════════╝
echo.
echo 🔧 Копируем исправленные файлы на VDS...
echo.

set VDS=root@77.91.100.68
set PATH_VDS=/var/www/billing

echo 📤 Копирование me/route.ts...
scp "%~dp0app\api\auth\me\route.ts" %VDS%:%PATH_VDS%/app/api/auth/me/
if %errorlevel% neq 0 (
    echo ❌ Ошибка копирования
    pause
    exit /b 1
)
echo ✅ Скопировано
echo.

echo 📤 Копирование login/route.ts...
scp "%~dp0app\api\auth\login\route.ts" %VDS%:%PATH_VDS%/app/api/auth/login/
if %errorlevel% neq 0 (
    echo ❌ Ошибка копирования
    pause
    exit /b 1
)
echo ✅ Скопировано
echo.

echo 🏗️ Сборка на VDS...
ssh %VDS% "cd %PATH_VDS% && rm -rf .next && npm run build && pm2 restart fluxor-web"

echo.
echo ✅ ГОТОВО!
echo.
echo 📊 Проверьте логи:
echo    ssh %VDS%
echo    pm2 logs fluxor-web
echo.
pause
