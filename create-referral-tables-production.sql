-- Создание реферальных таблиц для Production
-- С правильными foreign keys для существующей схемы

USE fluxor;

-- Временно отключаем проверку foreign keys
SET FOREIGN_KEY_CHECKS = 0;

-- Удаляем таблицы если существуют (осторожно!)
DROP TABLE IF EXISTS `referralregistration`;
DROP TABLE IF EXISTS `referrallink`;

-- Таблица реферальных ссылок
CREATE TABLE `referrallink` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `url` VARCHAR(191) NOT NULL,
  `views` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `expiresAt` DATETIME(3) NULL,
  `createdBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `referrallink_code_key`(`code`),
  UNIQUE INDEX `referrallink_url_key`(`url`),
  INDEX `referrallink_code_idx`(`code`),
  INDEX `referrallink_isActive_idx`(`isActive`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Таблица регистраций по реферальным ссылкам
-- ВАЖНО: Foreign key ссылается на таблицу с правильным именем
CREATE TABLE `referralregistration` (
  `id` VARCHAR(191) NOT NULL,
  `linkId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `hasDeposited` TINYINT(1) NOT NULL DEFAULT 0,
  `totalDeposits` DOUBLE NOT NULL DEFAULT 0,
  `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `firstDepositAt` DATETIME(3) NULL,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `referralregistration_userId_key`(`userId`),
  INDEX `referralregistration_linkId_idx`(`linkId`),
  INDEX `referralregistration_userId_idx`(`userId`),
  INDEX `referralregistration_hasDeposited_idx`(`hasDeposited`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Включаем обратно проверку foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Теперь добавляем foreign keys вручную
-- Сначала проверяем какая таблица существует: User или user

-- Определяем имя таблицы пользователей
SET @user_table = (
  SELECT TABLE_NAME 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = 'fluxor' 
  AND (TABLE_NAME = 'User' OR TABLE_NAME = 'user')
  LIMIT 1
);

-- Добавляем foreign key для linkId
ALTER TABLE `referralregistration`
ADD CONSTRAINT `referralregistration_linkId_fkey` 
  FOREIGN KEY (`linkId`) REFERENCES `referrallink`(`id`) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Добавляем foreign key для userId
-- Используем динамический SQL если нужно
ALTER TABLE `referralregistration`
ADD CONSTRAINT `referralregistration_userId_fkey` 
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Проверка
SELECT 'Таблицы успешно созданы!' as message;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'fluxor' 
AND TABLE_NAME IN ('referrallink', 'referralregistration');

-- Проверка foreign keys
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'fluxor'
AND TABLE_NAME = 'referralregistration'
AND REFERENCED_TABLE_NAME IS NOT NULL;
