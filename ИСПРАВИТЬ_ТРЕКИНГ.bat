@echo off
echo ===================================
echo Исправление трекинга реферальных ссылок
echo ===================================
echo.

echo Шаг 1: Добавление поля userAgent в таблицу...
echo.
mysql -u avelon -p123456 avelon < fix-referral-tracking.sql
if %ERRORLEVEL% EQU 0 (
    echo ✅ Поле userAgent добавлено!
) else (
    echo ❌ Ошибка при добавлении поля!
    pause
    exit /b 1
)
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
echo Попробуйте:
echo 1. Открыть реферальную ссылку в инкогнито
echo 2. Зарегистрировать нового пользователя
echo 3. В админке должны отобразиться просмотр и регистрация
echo.
pause
