-- Add GALLERY to TokenType enum
ALTER TABLE `ShareToken` MODIFY COLUMN `type` ENUM('VALIDATOR', 'MEDIA', 'PREVALIDATOR', 'GALLERY') NOT NULL;

-- Add config column to ShareToken
ALTER TABLE `ShareToken` ADD COLUMN `config` JSON NULL;
