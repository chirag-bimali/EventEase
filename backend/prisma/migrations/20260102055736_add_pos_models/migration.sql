-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `orderItemId` INTEGER NULL;

-- CreateTable
CREATE TABLE `PosOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `paymentMethod` ENUM('CASH', 'CARD', 'ONLINE', 'OTHER') NOT NULL,
    `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATETIME(3) NULL,
    `buyerName` VARCHAR(191) NULL,
    `buyerPhone` VARCHAR(191) NULL,
    `buyerEmail` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PosOrder_orderNumber_key`(`orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PosOrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `ticketGroupId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeatHold` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketGroupId` INTEGER NOT NULL,
    `seatNumber` VARCHAR(191) NOT NULL,
    `heldBy` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SeatHold_ticketGroupId_seatNumber_key`(`ticketGroupId`, `seatNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `PosOrderItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PosOrder` ADD CONSTRAINT `PosOrder_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PosOrder` ADD CONSTRAINT `PosOrder_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PosOrderItem` ADD CONSTRAINT `PosOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `PosOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PosOrderItem` ADD CONSTRAINT `PosOrderItem_ticketGroupId_fkey` FOREIGN KEY (`ticketGroupId`) REFERENCES `TicketGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeatHold` ADD CONSTRAINT `SeatHold_ticketGroupId_fkey` FOREIGN KEY (`ticketGroupId`) REFERENCES `TicketGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeatHold` ADD CONSTRAINT `SeatHold_heldBy_fkey` FOREIGN KEY (`heldBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
