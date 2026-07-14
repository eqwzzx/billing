-- Миграция для добавления поля discordId в таблицу User
-- Выполните эту миграцию перед запуском Discord бота

-- Для MySQL:
ALTER TABLE `User` ADD COLUMN `discordId` VARCHAR(191) NULL;
ALTER TABLE `User` ADD UNIQUE INDEX `User_discordId_key`(`discordId`);

-- Для PostgreSQL:
-- ALTER TABLE "User" ADD COLUMN "discordId" VARCHAR(191) NULL;
-- ALTER TABLE "User" ADD CONSTRAINT "User_discordId_key" UNIQUE ("discordId");

-- Проверка:
-- SELECT id, email, discordId FROM User LIMIT 5;
