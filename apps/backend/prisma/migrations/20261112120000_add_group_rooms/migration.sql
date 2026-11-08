-- CreateTable
CREATE TABLE `GroupRoom` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `hostId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(80) NOT NULL,
    `mode` ENUM('LIVE', 'OWN_PACE') NOT NULL,
    `status` ENUM('LOBBY', 'RUNNING', 'FINISHED') NOT NULL DEFAULT 'LOBBY',
    `questionIds` JSON NOT NULL,
    `secondsPerQuestion` INTEGER NOT NULL DEFAULT 30,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `rewarded` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GroupRoom_groupId_createdAt_idx`(`groupId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupRoomPlayer` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GroupRoomPlayer_userId_idx`(`userId`),
    UNIQUE INDEX `GroupRoomPlayer_roomId_userId_key`(`roomId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupRoomAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(60) NOT NULL,
    `choice` VARCHAR(10) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `ms` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GroupRoomAnswer_roomId_idx`(`roomId`),
    UNIQUE INDEX `GroupRoomAnswer_roomId_userId_questionId_key`(`roomId`, `userId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GroupRoom` ADD CONSTRAINT `GroupRoom_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `StudyGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupRoom` ADD CONSTRAINT `GroupRoom_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupRoomPlayer` ADD CONSTRAINT `GroupRoomPlayer_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `GroupRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupRoomPlayer` ADD CONSTRAINT `GroupRoomPlayer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupRoomAnswer` ADD CONSTRAINT `GroupRoomAnswer_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `GroupRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupRoomAnswer` ADD CONSTRAINT `GroupRoomAnswer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
