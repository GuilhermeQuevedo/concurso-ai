-- AlterTable
ALTER TABLE `contestsyllabusitem` ADD COLUMN `canonicalTopicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `flashcard` ADD COLUMN `topicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `question` ADD COLUMN `topicId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Topic` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `level` ENUM('DISCIPLINE', 'TOPIC', 'SUBTOPIC') NOT NULL DEFAULT 'TOPIC',
    `order` INTEGER NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `subjectId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Topic_parentId_idx`(`parentId`),
    INDEX `Topic_subjectId_idx`(`subjectId`),
    INDEX `Topic_level_idx`(`level`),
    INDEX `Topic_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicRelation` (
    `id` VARCHAR(191) NOT NULL,
    `sourceTopicId` VARCHAR(191) NOT NULL,
    `targetTopicId` VARCHAR(191) NOT NULL,
    `type` ENUM('PREREQUISITE', 'CONFUSED_WITH', 'CO_OCCURRING') NOT NULL,
    `evidence` TEXT NOT NULL,
    `source` VARCHAR(255) NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `confidence` DOUBLE NULL,
    `createdById` VARCHAR(191) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TopicRelation_status_idx`(`status`),
    INDEX `TopicRelation_sourceTopicId_idx`(`sourceTopicId`),
    INDEX `TopicRelation_targetTopicId_idx`(`targetTopicId`),
    UNIQUE INDEX `TopicRelation_sourceTopicId_targetTopicId_type_key`(`sourceTopicId`, `targetTopicId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicIncidence` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `examBoardId` VARCHAR(191) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1.0,
    `questionsCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TopicIncidence_topicId_idx`(`topicId`),
    INDEX `TopicIncidence_examBoardId_idx`(`examBoardId`),
    UNIQUE INDEX `TopicIncidence_topicId_examBoardId_key`(`topicId`, `examBoardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicLayoutPosition` (
    `id` VARCHAR(191) NOT NULL,
    `graphVersion` VARCHAR(64) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TopicLayoutPosition_graphVersion_idx`(`graphVersion`),
    UNIQUE INDEX `TopicLayoutPosition_graphVersion_topicId_key`(`graphVersion`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserTopicMastery` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `masteryScore` DOUBLE NOT NULL DEFAULT 0.0,
    `state` ENUM('NOT_STARTED', 'IN_PROGRESS', 'MASTERED') NOT NULL DEFAULT 'NOT_STARTED',
    `attemptsCount` INTEGER NOT NULL DEFAULT 0,
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `accuracy` DOUBLE NOT NULL DEFAULT 0.0,
    `lastAttemptAt` DATETIME(3) NULL,
    `dueFlashcardsCount` INTEGER NOT NULL DEFAULT 0,
    `priorityScore` DOUBLE NOT NULL DEFAULT 0.0,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserTopicMastery_userId_idx`(`userId`),
    INDEX `UserTopicMastery_topicId_idx`(`topicId`),
    INDEX `UserTopicMastery_userId_priorityScore_idx`(`userId`, `priorityScore`),
    UNIQUE INDEX `UserTopicMastery_userId_topicId_key`(`userId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ContestSyllabusItem_canonicalTopicId_idx` ON `ContestSyllabusItem`(`canonicalTopicId`);

-- CreateIndex
CREATE INDEX `Flashcard_topicId_idx` ON `Flashcard`(`topicId`);

-- CreateIndex
CREATE INDEX `Question_topicId_idx` ON `Question`(`topicId`);

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Flashcard` ADD CONSTRAINT `Flashcard_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContestSyllabusItem` ADD CONSTRAINT `ContestSyllabusItem_canonicalTopicId_fkey` FOREIGN KEY (`canonicalTopicId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Topic` ADD CONSTRAINT `Topic_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Topic` ADD CONSTRAINT `Topic_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicRelation` ADD CONSTRAINT `TopicRelation_sourceTopicId_fkey` FOREIGN KEY (`sourceTopicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicRelation` ADD CONSTRAINT `TopicRelation_targetTopicId_fkey` FOREIGN KEY (`targetTopicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicIncidence` ADD CONSTRAINT `TopicIncidence_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicIncidence` ADD CONSTRAINT `TopicIncidence_examBoardId_fkey` FOREIGN KEY (`examBoardId`) REFERENCES `ExamBoard`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopicLayoutPosition` ADD CONSTRAINT `TopicLayoutPosition_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTopicMastery` ADD CONSTRAINT `UserTopicMastery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTopicMastery` ADD CONSTRAINT `UserTopicMastery_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
