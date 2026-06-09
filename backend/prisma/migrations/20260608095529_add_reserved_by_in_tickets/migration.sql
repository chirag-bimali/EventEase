/*
  Warnings:

  - The values [SOLD_OUT] on the enum `Event_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Event` MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'SOLD') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `reservedAt` DATETIME(3) NULL,
    ADD COLUMN `reservedById` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_reservedById_fkey` FOREIGN KEY (`reservedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
