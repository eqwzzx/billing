@echo off
chcp 65001 >nul
echo ========================================
echo   ТЕСТ ТРЕКИНГА РЕФЕРАЛЬНЫХ ССЫЛОК
echo ========================================
echo.

echo Шаг 1: Проверка существующих ссылок...
echo.
mysql -u avelon -p123456 avelon -e "SELECT code, views, isActive FROM ReferralLink;"
echo.

set /p CODE="Введите код ссылки для теста (например TEST): "

echo.
echo Шаг 2: Тест API трекинга...
echo.
curl -X POST http://localhost:3000/api/referral/track-view -H "Content-Type: application/json" -d "{\"refCode\":\"%CODE%\",\"fingerprint\":\"test-%RANDOM%\"}"
echo.
echo.

echo Шаг 3: Проверка обновленных просмотров...
echo.
mysql -u avelon -p123456 avelon -e "SELECT code, views, isActive FROM ReferralLink WHERE code='%CODE%';"
echo.

echo ========================================
echo   ИНСТРУКЦИЯ ПО ТЕСТИРОВАНИЮ
echo ========================================
echo.
echo 1. Откройте инкогнито окно (Ctrl+Shift+N)
echo 2. Откройте консоль (F12)
echo 3. Перейдите: http://localhost:3000?ref=%CODE%
echo 4. Смотрите в консоль - должно быть:
echo    [Referral] ✅ Unique view tracked
echo.
echo 5. Обновите админку /admin/referrals
echo    Просмотры должны увеличиться
echo.
echo Если говорит "duplicate" - используйте другой браузер
echo или подождите 24 часа
echo.
pause
