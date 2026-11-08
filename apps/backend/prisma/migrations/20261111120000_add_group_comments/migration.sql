-- CreateTable
CREATE TABLE `GroupComment` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('QUESTION', 'FLASHCARD', 'DECK', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `targetId` VARCHAR(60) NULL,
    `context` TEXT NULL,
    `parentId` VARCHAR(191) NULL,
    `body` VARCHAR(500) NOT NULL,
    `kind` ENUM('COMMENT', 'HELP') NOT NULL DEFAULT 'COMMENT',
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `helpful` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GroupComment_groupId_parentId_createdAt_idx`(`groupId`, `parentId`, `createdAt`),
    INDEX `GroupComment_groupId_targetType_targetId_idx`(`groupId`, `targetType`, `targetId`),
    INDEX `GroupComment_groupId_kind_resolved_idx`(`groupId`, `kind`, `resolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GroupComment` ADD CONSTRAINT `GroupComment_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupComment` ADD CONSTRAINT `GroupComment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupComment` ADD CONSTRAINT `GroupComment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `GroupComment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
