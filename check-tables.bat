@echo off
echo Проверка таблиц в базе данных...
echo.
mysql -u avelon -p123456 avelon -e "SHOW TABLES;"
echo.
echo Проверка таблицы ReferralLink...
mysql -u avelon -p123456 avelon -e "SHOW TABLES LIKE 'ReferralLink';"
echo.
echo Проверка таблицы referrallink (lowercase)...
mysql -u avelon -p123456 avelon -e "SHOW TABLES LIKE 'referrallink';"
echo.
pause
