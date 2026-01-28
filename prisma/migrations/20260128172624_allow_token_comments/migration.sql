-- Allow token-based comments by making author optional and storing display fields
ALTER TABLE `Comment`
  ADD COLUMN `authorName` VARCHAR(255) NULL,
  ADD COLUMN `authorImage` TEXT NULL;

ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_authorId_fkey`;

ALTER TABLE `Comment`
  MODIFY `authorId` VARCHAR(191) NULL;

ALTER TABLE `Comment`
  ADD CONSTRAINT `Comment_authorId_fkey`
  FOREIGN KEY (`authorId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
