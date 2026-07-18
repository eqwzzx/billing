@echo off
echo ===================================
echo ПОЛНОЕ ИСПРАВЛЕНИЕ Prisma и таблиц
echo ===================================
echo.

echo Шаг 1: Проверка таблиц в базе данных...
echo.
mysql -u avelon -p123456 avelon -e "SHOW TABLES LIKE '%%Referral%%';"
echo.

echo Шаг 2: Удаление кэша Next.js и Prisma...
echo.
if exist .next rd /s /q .next
if exist node_modules\.prisma rd /s /q node_modules\.prisma
if exist node_modules\@prisma\client rd /s /q node_modules\@prisma\client
echo Кэш удалён.
echo.

echo Шаг 3: Перегенерация Prisma Client...
echo.
call npx prisma generate
echo.

echo ===================================
echo Готово!
echo ===================================
echo.
echo Теперь запустите сервер:
echo   npm run dev
echo.
echo Если ошибка повторяется, проверьте имена таблиц:
echo   check-tables.bat
echo.
pause
