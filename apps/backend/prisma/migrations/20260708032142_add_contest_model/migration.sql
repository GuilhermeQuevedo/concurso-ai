-- CreateTable
CREATE TABLE `Contest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `organization` VARCHAR(191) NULL,
    `examBoard` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `examDate` DATETIME(3) NULL,
    `status` ENUM('PLANNED', 'STUDYING', 'DONE', 'ARCHIVED') NOT NULL DEFAULT 'STUDYING',
    `editalDocumentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Contest_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContestSyllabusItem` (
    `id` VARCHAR(191) NOT NULL,
    `contestId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `discipline` VARCHAR(191) NOT NULL,
    `topic` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `studied` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ContestSyllabusItem_contestId_idx`(`contestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Contest` ADD CONSTRAINT `Contest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContestSyllabusItem` ADD CONSTRAINT `ContestSyllabusItem_contestId_fkey` FOREIGN KEY (`contestId`) REFERENCES `Contest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
