-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `tutorNotifiedAt` DATETIME(3) NULL,
    ADD COLUMN `tutorNotifiedMessage` TEXT NULL;
