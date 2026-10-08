-- AlterTable
ALTER TABLE `contestsyllabusitem` ADD COLUMN `firstStudiedAt` DATETIME(3) NULL,
    ADD COLUMN `importance` INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE `TopicReview` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `syllabusItemId` VARCHAR(191) NOT NULL,
    `index` INTEGER NOT NULL,
    `intervalDays` INTEGER NOT NULL,
    `scheduledFor` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TopicReview_userId_scheduledFor_idx`(`userId`, `scheduledFor`),
    INDEX `TopicReview_syllabusItemId_idx`(`syllabusItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TopicReview` ADD CONSTRAINT `TopicReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicReview` ADD CONSTRAINT `TopicReview_syllabusItemId_fkey` FOREIGN KEY (`syllabusItemId`) REFERENCES `ContestSyllabusItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
