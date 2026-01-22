/*
  Warnings:

  - You are about to drop the column `church` on the `Event` table. All the data in the column will be lost.
  - Added the required column `churchId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Event` DROP COLUMN `church`,
    ADD COLUMN `churchId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Church` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Church_name_key`(`name`),
    INDEX `Church_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Event_churchId_idx` ON `Event`(`churchId`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_churchId_fkey` FOREIGN KEY (`churchId`) REFERENCES `Church`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
