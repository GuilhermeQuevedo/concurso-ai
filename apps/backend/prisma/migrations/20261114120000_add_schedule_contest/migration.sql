-- AlterTable
ALTER TABLE `StudySchedule` ADD COLUMN `contestId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `StudySchedule_userId_contestId_idx` ON `StudySchedule`(`userId`, `contestId`);

-- AddForeignKey
ALTER TABLE `StudySchedule` ADD CONSTRAINT `StudySchedule_contestId_fkey` FOREIGN KEY (`contestId`) REFERENCES `Contest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
