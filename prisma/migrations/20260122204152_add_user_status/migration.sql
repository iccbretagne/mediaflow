-- AlterTable
ALTER TABLE `User` ADD COLUMN `status` ENUM('PENDING', 'ACTIVE', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `User_status_idx` ON `User`(`status`);
