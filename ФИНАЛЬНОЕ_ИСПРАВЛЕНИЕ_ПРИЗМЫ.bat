@echo off
chcp 65001 >nul
echo ========================================
echo   ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ
echo ========================================
echo.

echo Schema.prisma обновлен! Теперь нужно:
echo.
echo 1. ОСТАНОВИТЕ dev сервер (Ctrl+C в окне с npm run dev)
echo 2. Затем нажмите любую клавишу здесь
echo.
pause

echo.
echo Генерирую Prisma Client...
call npx prisma generate

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка! Dev сервер все еще запущен!
    echo.
    echo Закройте окно с npm run dev и попробуйте снова.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Prisma Client сгенерирован!
echo.
echo Теперь запускаю dev сервер...
echo.

start cmd /k "cd /d %CD% && npm run dev"

echo.
echo ========================================
echo   ✅ ВСЁ ГОТОВО!
echo ========================================
echo.
echo Dev сервер запускается в новом окне...
echo.
echo Проверьте:
echo 1. http://localhost:3000/client/billing
echo 2. Войдите под admin@eqwzzx.wtf
echo 3. Прокрутите вниз
echo 4. Увидите "Реферальная программа"!
echo.
echo Ваш код: ADMIN6607
echo.
pause
