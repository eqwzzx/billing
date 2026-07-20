@echo off
chcp 65001 >nul
echo ========================================
echo   ИСПРАВЛЕНИЕ РЕФЕРАЛЬНЫХ ССЫЛОК
echo ========================================
echo.

echo [1/5] Обновление реферальных кодов в БД...
mysql -u avelon -p123456 avelon < add-referral-codes-to-users.sql
if %errorlevel% neq 0 (
    echo ❌ Ошибка при обновлении БД!
    pause
    exit /b 1
)
echo ✅ Коды обновлены
echo.

echo [2/5] Проверка созданных кодов...
mysql -u avelon -p123456 avelon -e "SELECT email, referralCode FROM User WHERE referralCode IS NOT NULL LIMIT 5;"
echo.

echo [3/5] Сборка приложения...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Ошибка при сборке!
    pause
    exit /b 1
)
echo ✅ Приложение собрано
echo.

echo [4/5] Перезапуск приложения...
pm2 restart avelon-web
if %errorlevel% neq 0 (
    echo ⚠️ PM2 не найден или ошибка перезапуска
    echo Перезапустите приложение вручную: npm start
) else (
    echo ✅ Приложение перезапущено
)
echo.

echo [5/5] Тестирование API...
timeout /t 3 /nobreak >nul
curl -X POST http://localhost:3000/api/referral/track-view -H "Content-Type: application/json" -d "{\"refCode\":\"TESTING2026\",\"fingerprint\":\"test123\"}"
echo.
echo.

echo ========================================
echo   ✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!
echo ========================================
echo.
echo Следующие шаги:
echo 1. Откройте http://localhost:3000/client/billing
echo 2. Должна быть секция "Реферальная программа"
echo 3. Проверьте что ссылка с правильным доменом
echo.
echo Если ссылка с localhost:
echo - Проверьте .env (NEXT_PUBLIC_APP_URL)
echo - Убедитесь что приложение перезапущено
echo.
echo Документация: ИСПРАВЛЕНИЕ_РЕФЕРАЛЬНЫХ_ССЫЛОК.md
echo.
pause
