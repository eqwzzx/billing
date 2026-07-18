@echo off
echo ===================================
echo ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ
echo ===================================
echo.

echo Шаг 1: Создание недостающих таблиц в базе данных...
echo.
mysql -u avelon -p123456 avelon < create-referral-tables.sql
if %ERRORLEVEL% EQU 0 (
    echo ✅ Таблицы созданы!
) else (
    echo ❌ Ошибка при создании таблиц!
    pause
    exit /b 1
)
echo.

echo Шаг 2: Удаление кэша...
echo.
if exist .next rd /s /q .next
if exist node_modules\.prisma rd /s /q node_modules\.prisma
if exist node_modules\@prisma\client rd /s /q node_modules\@prisma\client
echo ✅ Кэш удалён!
echo.

echo Шаг 3: Перегенерация Prisma Client...
echo.
call npx prisma generate
if %ERRORLEVEL% EQU 0 (
    echo ✅ Prisma Client обновлён!
) else (
    echo ❌ Ошибка при генерации Prisma!
    pause
    exit /b 1
)
echo.

echo ===================================
echo ✅ ВСЁ ГОТОВО!
echo ===================================
echo.
echo Теперь запустите сервер:
echo   npm run dev
echo.
echo И попробуйте создать реферальную ссылку!
echo.
pause
