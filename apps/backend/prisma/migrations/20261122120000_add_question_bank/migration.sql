-- AlterTable
ALTER TABLE `Question` ADD COLUMN `examYear` INTEGER NULL,
    ADD COLUMN `organ` VARCHAR(191) NULL,
    ADD COLUMN `examName` VARCHAR(191) NULL,
    ADD COLUMN `position` VARCHAR(191) NULL,
    ADD COLUMN `area` VARCHAR(191) NULL,
    ADD COLUMN `sourceRef` VARCHAR(191) NULL,
    MODIFY `source` ENUM('AI_GENERATED', 'IMPORTED', 'MANUAL', 'BANK') NOT NULL DEFAULT 'AI_GENERATED';

-- CreateIndex
CREATE UNIQUE INDEX `Question_sourceRef_key` ON `Question`(`sourceRef`);

-- CreateIndex
CREATE INDEX `Question_source_area_idx` ON `Question`(`source`, `area`);

-- CreateIndex
CREATE INDEX `Question_source_examBoardId_examYear_idx` ON `Question`(`source`, `examBoardId`, `examYear`);
