@echo off
echo ===================================
echo Исправление трекинга (простая версия)
echo ===================================
echo.

echo Шаг 1: Добавление поля userAgent...
echo (игнорируем ошибку если поле уже существует)
echo.
mysql -u avelon -p123456 avelon < fix-referral-tracking-simple.sql
echo.
echo Если увидели ошибку "Duplicate column name" - это нормально!
echo Значит поле уже существует.
echo.

echo Шаг 2: Удаление кэша...
echo.
if exist .next rd /s /q .next
echo ✅ Кэш удалён!
echo.

echo ===================================
echo ✅ ВСЁ ГОТОВО!
echo ===================================
echo.
echo Теперь перезапустите сервер:
echo   npm run dev
echo.
pause
