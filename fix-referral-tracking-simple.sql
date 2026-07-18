-- Простое добавление поля userAgent (игнорирует ошибку если поле уже существует)

USE avelon;

-- Добавляем поле (если уже существует, будет ошибка, но это нормально)
ALTER TABLE `referralregistration` ADD COLUMN `userAgent` TEXT NULL AFTER `ipAddress`;

-- Проверка
SELECT 'Готово! Проверьте структуру таблицы:' as message;
DESCRIBE referralregistration;
