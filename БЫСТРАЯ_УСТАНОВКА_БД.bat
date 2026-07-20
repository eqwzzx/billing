@echo off
chcp 65001 >nul
echo ========================================
echo   ДОБАВЛЕНИЕ REFERRALCODE В БД
echo ========================================
echo.

echo [1/3] Добавление колонки referralCode...
mysql -u avelon -p123456 avelon -e "ALTER TABLE User ADD COLUMN IF NOT EXISTS referralCode VARCHAR(191) NULL;"
echo ✅ Колонка добавлена
echo.

echo [2/3] Создание индекса...
mysql -u avelon -p123456 avelon -e "CREATE INDEX IF NOT EXISTS User_referralCode_idx ON User(referralCode);"
echo ✅ Индекс создан
echo.

echo [3/3] Генерация кодов для пользователей...
type add-referral-codes-to-users.sql | mysql -u avelon -p123456 avelon
echo ✅ Коды сгенерированы
echo.

echo ========================================
echo   ✅ БАЗА ДАННЫХ ОБНОВЛЕНА!
echo ========================================
echo.
echo Теперь перезапустите приложение:
echo   npm run dev
echo   или
echo   pm2 restart avelon-web
echo.
pause
