-- Миграция для добавления системы реферальных ссылок
-- Выполните этот скрипт в вашей базе данных MySQL/MariaDB

-- Таблица реферальных ссылок
CREATE TABLE IF NOT EXISTS `ReferralLink` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `url` VARCHAR(191) NOT NULL,
  `views` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `expiresAt` DATETIME(3) NULL,
  `createdBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ReferralLink_code_key`(`code`),
  UNIQUE INDEX `ReferralLink_url_key`(`url`),
  INDEX `ReferralLink_code_idx`(`code`),
  INDEX `ReferralLink_isActive_idx`(`isActive`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Таблица регистраций по реферальным ссылкам
CREATE TABLE IF NOT EXISTS `ReferralRegistration` (
  `id` VARCHAR(191) NOT NULL,
  `linkId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `hasDeposited` BOOLEAN NOT NULL DEFAULT false,
  `totalDeposits` DOUBLE NOT NULL DEFAULT 0,
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `firstDepositAt` DATETIME(3) NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ReferralRegistration_userId_key`(`userId`),
  INDEX `ReferralRegistration_linkId_idx`(`linkId`),
  INDEX `ReferralRegistration_userId_idx`(`userId`),
  INDEX `ReferralRegistration_hasDeposited_idx`(`hasDeposited`),
  
  CONSTRAINT `ReferralRegistration_linkId_fkey` 
    FOREIGN KEY (`linkId`) REFERENCES `ReferralLink`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Проверка успешности миграции
SELECT 'Миграция реферальной системы выполнена успешно!' as message;
