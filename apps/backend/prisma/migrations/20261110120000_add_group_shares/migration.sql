-- CreateTable
CREATE TABLE `GroupShare` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `sharedById` VARCHAR(191) NOT NULL,
    `type` ENUM('DECK', 'SCHEDULE', 'CONTEST') NOT NULL,
    `refId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GroupShare_groupId_createdAt_idx`(`groupId`, `createdAt`),
    UNIQUE INDEX `GroupShare_groupId_type_refId_key`(`groupId`, `type`, `refId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GroupShare` ADD CONSTRAINT `GroupShare_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupShare` ADD CONSTRAINT `GroupShare_sharedById_fkey` FOREIGN KEY (`sharedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
