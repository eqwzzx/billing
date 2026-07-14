@echo off
chcp 65001 >nul
echo ========================================
echo   КОПИРОВАНИЕ ФАЙЛОВ НА VDS
echo ========================================
echo.

set VDS_IP=77.91.100.68
set VDS_USER=root
set VDS_PATH=/var/www/billing

echo 📋 Параметры:
echo    IP: %VDS_IP%
echo    Пользователь: %VDS_USER%
echo    Путь: %VDS_PATH%
echo.

echo ⚠️  ВНИМАНИЕ: Для работы требуется OpenSSH!
echo    Windows 10/11: встроен по умолчанию
echo.

pause

echo.
echo 📦 Копирование файлов авторизации...
echo.

echo 1️⃣ Копирование login route...
scp "%~dp0app\api\auth\login\route.ts" %VDS_USER%@%VDS_IP%:%VDS_PATH%/app/api/auth/login/
if %errorlevel% neq 0 (
    echo ❌ Ошибка при копировании login route
    pause
    exit /b 1
)

echo 2️⃣ Копирование me route...
scp "%~dp0app\api\auth\me\route.ts" %VDS_USER%@%VDS_IP%:%VDS_PATH%/app/api/auth/me/
if %errorlevel% neq 0 (
    echo ❌ Ошибка при копировании me route
    pause
    exit /b 1
)

echo.
echo ✅ Файлы успешно скопированы!
echo.
echo 📋 СЛЕДУЮЩИЕ ШАГИ на VDS:
echo.
echo    ssh %VDS_USER%@%VDS_IP%
echo    cd %VDS_PATH%
echo    rm -rf .next
echo    npm run build
echo    pm2 restart fluxor-web
echo    pm2 logs fluxor-web
echo.

pause
