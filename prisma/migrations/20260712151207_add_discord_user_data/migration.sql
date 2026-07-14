-- AlterTable
ALTER TABLE `User` ADD COLUMN `discordUsername` VARCHAR(191) NULL,
    ADD COLUMN `discordDiscriminator` VARCHAR(191) NULL,
    ADD COLUMN `discordAvatar` VARCHAR(191) NULL,
    ADD COLUMN `discordGlobalName` VARCHAR(191) NULL;
