-- AlterTable
ALTER TABLE `User` ADD COLUMN `friendCode` VARCHAR(8) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_friendCode_key` ON `User`(`friendCode`);

-- CreateTable
CREATE TABLE `Friendship` (
    `id` VARCHAR(191) NOT NULL,
    `userLowId` VARCHAR(191) NOT NULL,
    `userHighId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Friendship_userHighId_status_idx`(`userHighId`, `status`),
    INDEX `Friendship_userLowId_status_idx`(`userLowId`, `status`),
    UNIQUE INDEX `Friendship_userLowId_userHighId_key`(`userLowId`, `userHighId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_userLowId_fkey` FOREIGN KEY (`userLowId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_userHighId_fkey` FOREIGN KEY (`userHighId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
