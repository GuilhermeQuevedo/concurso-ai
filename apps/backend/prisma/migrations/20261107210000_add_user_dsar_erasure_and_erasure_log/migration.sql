-- AlterTable
ALTER TABLE `User` ADD COLUMN `erasureCompletedAt` DATETIME(3) NULL,
    ADD COLUMN `erasureRequestedAt` DATETIME(3) NULL,
    ADD COLUMN `erasureStatus` VARCHAR(191) NULL,
    ADD COLUMN `tokenVersion` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `ErasureLog` (
    `id` VARCHAR(191) NOT NULL,
    `userHash` VARCHAR(191) NOT NULL,
    `erasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hadPayments` BOOLEAN NOT NULL DEFAULT false,
    `reason` TEXT NULL,

    UNIQUE INDEX `ErasureLog_userHash_key`(`userHash`),
    INDEX `ErasureLog_erasedAt_idx`(`erasedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
