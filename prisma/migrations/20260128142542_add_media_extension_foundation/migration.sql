-- AlterTable
ALTER TABLE `AppSettings` ADD COLUMN `retentionDays` INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE `ShareToken` ADD COLUMN `projectId` VARCHAR(191) NULL,
    MODIFY `eventId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `churchId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_createdById_idx`(`createdById`),
    INDEX `Project_churchId_idx`(`churchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Media` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PHOTO', 'VISUAL', 'VIDEO') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'DRAFT', 'IN_REVIEW', 'REVISION_REQUESTED', 'FINAL_APPROVED') NOT NULL DEFAULT 'PENDING',
    `filename` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `duration` INTEGER NULL,
    `scheduledDeletionAt` DATETIME(3) NULL,
    `eventId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Media_eventId_idx`(`eventId`),
    INDEX `Media_projectId_idx`(`projectId`),
    INDEX `Media_type_idx`(`type`),
    INDEX `Media_status_idx`(`status`),
    INDEX `Media_scheduledDeletionAt_idx`(`scheduledDeletionAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaVersion` (
    `id` VARCHAR(191) NOT NULL,
    `versionNumber` INTEGER NOT NULL DEFAULT 1,
    `originalKey` VARCHAR(512) NOT NULL,
    `thumbnailKey` VARCHAR(512) NOT NULL,
    `notes` TEXT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MediaVersion_mediaId_idx`(`mediaId`),
    INDEX `MediaVersion_createdById_idx`(`createdById`),
    UNIQUE INDEX `MediaVersion_mediaId_versionNumber_key`(`mediaId`, `versionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('GENERAL', 'TIMECODE') NOT NULL DEFAULT 'GENERAL',
    `content` TEXT NOT NULL,
    `timecode` INTEGER NULL,
    `parentId` VARCHAR(191) NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Comment_mediaId_idx`(`mediaId`),
    INDEX `Comment_authorId_idx`(`authorId`),
    INDEX `Comment_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ShareToken_projectId_idx` ON `ShareToken`(`projectId`);

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_churchId_fkey` FOREIGN KEY (`churchId`) REFERENCES `Church`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaVersion` ADD CONSTRAINT `MediaVersion_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaVersion` ADD CONSTRAINT `MediaVersion_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShareToken` ADD CONSTRAINT `ShareToken_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
