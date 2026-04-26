-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `checkinArrivalTime` DATETIME(3) NULL,
    ADD COLUMN `checkinBehavior` VARCHAR(191) NULL,
    ADD COLUMN `checkinExtraAuthorized` BOOLEAN NULL,
    ADD COLUMN `checkinFleas` BOOLEAN NULL,
    ADD COLUMN `checkinMatting` VARCHAR(191) NULL,
    ADD COLUMN `checkinNotes` TEXT NULL,
    ADD COLUMN `groomingPreferences` TEXT NULL,
    ADD COLUMN `priceAdjustment` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `priceAdjustmentReason` VARCHAR(191) NULL;
