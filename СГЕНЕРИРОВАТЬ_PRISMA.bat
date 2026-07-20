@echo off
chcp 65001 >nul
echo ========================================
echo   ГЕНЕРАЦИЯ PRISMA CLIENT
echo ========================================
echo.

echo ⚠️ ВАЖНО: Сначала остановите dev сервер!
echo Нажмите Ctrl+C в окне где запущен npm run dev
echo.
pause

echo.
echo Генерирую Prisma Client...
echo.
call npx prisma generate

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка генерации!
    echo.
    echo Возможные решения:
    echo 1. Убедитесь что dev сервер остановлен
    echo 2. Закройте все терминалы и попробуйте снова
    echo 3. Перезагрузите компьютер если ничего не помогает
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Prisma Client сгенерирован!
echo.
echo Теперь запустите dev сервер:
echo   npm run dev
echo.
echo Или нажмите любую клавишу чтобы запустить автоматически...
pause

echo.
echo Запускаю dev сервер...
call npm run dev
