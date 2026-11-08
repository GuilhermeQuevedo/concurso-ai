-- AlterTable
ALTER TABLE `User` ADD COLUMN `totalXp` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `tierRewarded` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `XpEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `source` VARCHAR(20) NOT NULL,
    `refId` VARCHAR(100) NOT NULL,
    `xp` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `XpEvent_userId_createdAt_idx`(`userId`, `createdAt`),
    UNIQUE INDEX `XpEvent_userId_source_refId_key`(`userId`, `source`, `refId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `XpEvent` ADD CONSTRAINT `XpEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
