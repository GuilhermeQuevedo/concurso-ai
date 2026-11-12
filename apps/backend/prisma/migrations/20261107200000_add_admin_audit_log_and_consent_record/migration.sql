-- CreateTable
CREATE TABLE `AdminAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` VARCHAR(191) NOT NULL,
    `action` ENUM('USER_LIST_VIEW', 'USER_PII_REVEAL', 'CONTACT_LIST_VIEW', 'CONTACT_PII_REVEAL', 'CONTACT_IMPORT', 'CONTACT_DELETE') NOT NULL,
    `resourceType` ENUM('USER', 'CONTACT', 'PAYMENT') NOT NULL,
    `resourceCount` INTEGER NOT NULL DEFAULT 1,
    `resourceIds` JSON NULL,
    `justification` TEXT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `userAgent` TEXT NULL,

    INDEX `AdminAuditLog_adminId_createdAt_idx`(`adminId`, `createdAt`),
    INDEX `AdminAuditLog_action_createdAt_idx`(`action`, `createdAt`),
    INDEX `AdminAuditLog_resourceType_createdAt_idx`(`resourceType`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsentRecord` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `documentType` ENUM('TERMS', 'PRIVACY') NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipHash` VARCHAR(191) NOT NULL,
    `userAgent` TEXT NULL,

    INDEX `ConsentRecord_userId_documentType_idx`(`userId`, `documentType`),
    UNIQUE INDEX `ConsentRecord_userId_documentType_version_key`(`userId`, `documentType`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminAuditLog` ADD CONSTRAINT `AdminAuditLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsentRecord` ADD CONSTRAINT `ConsentRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ==============================================================================================
-- INSTRUÇÃO DE SEGURANÇA E INTEGRIDADE (LGPD / Append-Only):
-- Para garantir a imutabilidade da trilha de auditoria administrativa, execute no banco de produção
-- a revogação de privilégios de exclusão e alteração pelo usuário da aplicação web:
--
-- REVOKE UPDATE, DELETE ON `concurso_ai`.`AdminAuditLog` FROM 'concurso_app_user'@'%';
-- FLUSH PRIVILEGES;
-- ==============================================================================================
