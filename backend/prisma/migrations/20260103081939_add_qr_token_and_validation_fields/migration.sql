/*
  Warnings:

  - A unique constraint covering the columns `[qrToken]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qrToken` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `qrToken` VARCHAR(191) NOT NULL,
    ADD COLUMN `validatedAt` DATETIME(3) NULL,
    ADD COLUMN `validatedById` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Ticket_qrToken_key` ON `Ticket`(`qrToken`);

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_validatedById_fkey` FOREIGN KEY (`validatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
