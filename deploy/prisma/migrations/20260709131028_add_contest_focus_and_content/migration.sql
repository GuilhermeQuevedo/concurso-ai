-- AlterTable
ALTER TABLE `contest` ADD COLUMN `focus` TEXT NULL;

-- AlterTable
ALTER TABLE `contestsyllabusitem` ADD COLUMN `content` LONGTEXT NULL,
    ADD COLUMN `focus` BOOLEAN NOT NULL DEFAULT true;
