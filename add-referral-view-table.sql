-- Создать таблицу для отслеживания уникальных просмотров реферальных ссылок

CREATE TABLE IF NOT EXISTS `referralview` (
  `id` VARCHAR(191) NOT NULL,
  `linkId` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `fingerprint` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `referralview_linkId_idx` (`linkId`),
  INDEX `referralview_ipAddress_idx` (`ipAddress`),
  INDEX `referralview_fingerprint_idx` (`fingerprint`),
  INDEX `referralview_viewedAt_idx` (`viewedAt`),
  
  CONSTRAINT `referralview_linkId_fkey` 
    FOREIGN KEY (`linkId`) 
    REFERENCES `referrallink`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Проверка
SELECT COUNT(*) as referral_view_table_created FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'referralview';
