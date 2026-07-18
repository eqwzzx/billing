@echo off
echo ===================================
echo Исправление Prisma Client
echo ===================================
echo.

echo Шаг 1: Удаление старого Prisma Client...
rd /s /q node_modules\.prisma 2>nul
rd /s /q node_modules\@prisma\client 2>nul

echo Шаг 2: Синхронизация схемы с базой данных...
call npx prisma db pull

echo Шаг 3: Генерация Prisma Client...
call npx prisma generate

echo.
echo ===================================
echo Готово!
echo ===================================
echo.
echo Теперь перезапустите сервер:
echo   npm run dev
echo.
pause
