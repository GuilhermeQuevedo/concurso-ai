-- AlterTable
ALTER TABLE `UserCalendarIntegration` ADD COLUMN `syncSchedule` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `syncReminders` BOOLEAN NOT NULL DEFAULT true;
