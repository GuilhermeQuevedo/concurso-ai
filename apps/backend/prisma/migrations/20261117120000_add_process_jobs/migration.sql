-- AlterTable
ALTER TABLE `Document` ADD COLUMN `pageCount` INTEGER NULL,
    ADD COLUMN `firstPartChars` INTEGER NULL;

-- CreateTable
CREATE TABLE `ProcessJob` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `status` ENUM('RUNNING', 'DONE', 'FAILED', 'CANCELED') NOT NULL DEFAULT 'RUNNING',
    `partsDone` INTEGER NOT NULL DEFAULT 0,
    `totalParts` INTEGER NOT NULL DEFAULT 1,
    `contestId` VARCHAR(191) NULL,
    `result` JSON NULL,
    `message` TEXT NULL,
    `errorCode` VARCHAR(60) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcessJob_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `ProcessJob_documentId_idx`(`documentId`),
    INDEX `ProcessJob_contestId_idx`(`contestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProcessJob` ADD CONSTRAINT `ProcessJob_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessJob` ADD CONSTRAINT `ProcessJob_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
