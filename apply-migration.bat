@echo off
echo ===================================
echo Применение миграции маркетинговой системы
echo ===================================
echo.
echo Подключение к базе данных: avelon
echo Пользователь: avelon
echo.
echo Введите пароль от MySQL (123456):
echo.

mysql -u avelon -p avelon < migration_marketing_system.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================
    echo Миграция успешно применена!
    echo ===================================
    echo.
    echo Теперь перезапустите сервер:
    echo   npm run dev
    echo.
) else (
    echo.
    echo ===================================
    echo ОШИБКА при применении миграции!
    echo ===================================
    echo.
    echo Проверьте:
    echo 1. MySQL запущен
    echo 2. Пароль правильный (123456)
    echo 3. База данных 'avelon' существует
    echo.
)

pause
