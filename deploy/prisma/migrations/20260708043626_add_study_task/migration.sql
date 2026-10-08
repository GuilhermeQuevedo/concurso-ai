-- CreateTable
CREATE TABLE `StudyTask` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `contestId` VARCHAR(191) NULL,
    `syllabusItemId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `type` ENUM('STUDY', 'REVIEW', 'ESSAY', 'MOCK_EXAM') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `discipline` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudyTask_userId_date_idx`(`userId`, `date`),
    INDEX `StudyTask_contestId_idx`(`contestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StudyTask` ADD CONSTRAINT `StudyTask_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudyTask` ADD CONSTRAINT `StudyTask_contestId_fkey` FOREIGN KEY (`contestId`) REFERENCES `Contest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
