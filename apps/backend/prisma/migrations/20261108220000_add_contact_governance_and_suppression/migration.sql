-- AlterTable
ALTER TABLE `Contact` 
    ADD COLUMN `legalBasis` ENUM('CONSENT', 'LEGITIMATE_INTEREST', 'PRE_CONTRACTUAL') NOT NULL DEFAULT 'CONSENT',
    ADD COLUMN `consentProofNotes` TEXT NULL,
    ADD COLUMN `legitimateInterestAssessmentRef` VARCHAR(191) NULL,
    ADD COLUMN `importedBy` VARCHAR(191) NULL,
    ADD COLUMN `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `unsubscribed` BOOLEAN NOT NULL DEFAULT false,
    ADD INDEX `Contact_email_idx`(`email`),
    ADD INDEX `Contact_unsubscribed_idx`(`unsubscribed`);

-- CreateTable
CREATE TABLE `ContactSuppression` (
    `id` VARCHAR(191) NOT NULL,
    `emailHash` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NULL DEFAULT 'OPT_OUT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ContactSuppression_emailHash_key`(`emailHash`),
    INDEX `ContactSuppression_emailHash_idx`(`emailHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
