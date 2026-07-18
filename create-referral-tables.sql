-- Создание недостающих таблиц для реферальных ссылок

USE avelon;

-- Таблица реферальных ссылок
CREATE TABLE IF NOT EXISTS `referrallink` (
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
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Таблица регистраций по реферальным ссылкам
CREATE TABLE IF NOT EXISTS `referralregistration` (
  `id` VARCHAR(191) NOT NULL,
  `linkId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `hasDeposited` TINYINT(1) NOT NULL DEFAULT 0,
  `totalDeposits` DOUBLE NOT NULL DEFAULT 0,
  `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `firstDepositAt` DATETIME(3) NULL,
  `ipAddress` VARCHAR(191) NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `referralregistration_userId_key`(`userId`),
  INDEX `referralregistration_linkId_idx`(`linkId`),
  INDEX `referralregistration_userId_idx`(`userId`),
  INDEX `referralregistration_hasDeposited_idx`(`hasDeposited`),
  
  CONSTRAINT `referralregistration_linkId_fkey` 
    FOREIGN KEY (`linkId`) REFERENCES `referrallink`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `referralregistration_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Проверка
SELECT 'Таблицы успешно созданы!' as message;
SELECT TABLE_NAME FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'avelon' 
AND TABLE_NAME IN ('referrallink', 'referralregistration');
