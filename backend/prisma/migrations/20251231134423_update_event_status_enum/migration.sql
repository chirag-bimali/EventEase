/*
  Warnings:

  - You are about to alter the column `status` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `Event` MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'SOLD_OUT') NOT NULL DEFAULT 'DRAFT';
