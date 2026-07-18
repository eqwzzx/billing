-- Миграция для маркетинговой системы аналитики

-- 1. Добавление роли PR_MANAGER
ALTER TABLE `User` 
  MODIFY COLUMN `role` ENUM('USER', 'ADMIN', 'PR_MANAGER') NOT NULL DEFAULT 'USER';

-- 2. Добавление UTM полей в таблицу User
ALTER TABLE `User`
  ADD COLUMN `utmSource` VARCHAR(191) NULL AFTER `banCount`,
  ADD COLUMN `utmMedium` VARCHAR(191) NULL AFTER `utmSource`,
  ADD COLUMN `utmCampaign` VARCHAR(191) NULL AFTER `utmMedium`,
  ADD COLUMN `utmContent` VARCHAR(191) NULL AFTER `utmCampaign`,
  ADD COLUMN `utmTerm` VARCHAR(191) NULL AFTER `utmContent`,
  ADD COLUMN `referralLinkId` VARCHAR(191) NULL AFTER `utmTerm`,
  ADD COLUMN `firstOrderDiscount` BOOLEAN NOT NULL DEFAULT true AFTER `referralLinkId`,
  ADD INDEX `User_utmSource_idx`(`utmSource`),
  ADD INDEX `User_utmCampaign_idx`(`utmCampaign`),
  ADD INDEX `User_referralLinkId_idx`(`referralLinkId`);

-- 3. Таблица маркетинговых событий
CREATE TABLE IF NOT EXISTS `MarketingEvent` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `sessionId` VARCHAR(191) NULL,
  `eventType` ENUM('VIEW', 'REGISTRATION', 'PLAN_SELECT', 'PAYMENT_START', 'PAYMENT_SUCCESS', 'SERVER_CREATE', 'SERVER_RENEW') NOT NULL,
  
  `utmSource` VARCHAR(191) NULL,
  `utmMedium` VARCHAR(191) NULL,
  `utmCampaign` VARCHAR(191) NULL,
  `utmContent` VARCHAR(191) NULL,
  `utmTerm` VARCHAR(191) NULL,
  
  `referralCode` VARCHAR(191) NULL,
  `metadata` TEXT NULL,
  `amount` DOUBLE NULL,
  `planId` VARCHAR(191) NULL,
  `serverId` VARCHAR(191) NULL,
  
  `ipAddress` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `MarketingEvent_userId_idx`(`userId`),
  INDEX `MarketingEvent_sessionId_idx`(`sessionId`),
  INDEX `MarketingEvent_eventType_idx`(`eventType`),
  INDEX `MarketingEvent_utmSource_idx`(`utmSource`),
  INDEX `MarketingEvent_utmCampaign_idx`(`utmCampaign`),
  INDEX `MarketingEvent_createdAt_idx`(`createdAt`),
  
  CONSTRAINT `MarketingEvent_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Таблица настроек скидки первого заказа
CREATE TABLE IF NOT EXISTS `FirstOrderDiscount` (
  `id` VARCHAR(191) NOT NULL,
  `isEnabled` BOOLEAN NOT NULL DEFAULT true,
  `discountPercent` INTEGER NOT NULL DEFAULT 50,
  `description` TEXT NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Вставка начальной настройки скидки (если таблица пустая)
INSERT INTO `FirstOrderDiscount` (`id`, `isEnabled`, `discountPercent`, `description`)
SELECT 'default', true, 50, 'Скидка 50% на первый заказ'
WHERE NOT EXISTS (SELECT 1 FROM `FirstOrderDiscount` LIMIT 1);

-- Проверка успешности миграции
SELECT 'Миграция маркетинговой системы выполнена успешно!' as message;
