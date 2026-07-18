-- Добавление поля userAgent в таблицу referralregistration

USE avelon;

-- Проверяем и добавляем поле userAgent если его нет
-- Используем процедуру для проверки существования столбца
SET @dbname = 'avelon';
SET @tablename = 'referralregistration';
SET @columnname = 'userAgent';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL AFTER ipAddress')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Проверка
SELECT 'Поле userAgent добавлено или уже существует!' as message;
DESCRIBE referralregistration;
