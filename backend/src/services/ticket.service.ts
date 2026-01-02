import { SeatType, TicketStatus } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.ts";

export const ticketService = {

  // TICKET GENERATION
  async generateTicket(
    ticketGroupId: number,
    userId: number,
    seatNumber?: string
  ) {
    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id: ticketGroupId },
      include: { tickets: true },
    });

    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }

    // For SEAT type - user must specify a seat number and it must be valid per seatingConfig
    if (ticketGroup.seatType === SeatType.SEAT) {
      if (!seatNumber) {
        throw new Error("Seat number is required for SEAT type tickets");
      }

      // Parse seating configuration to validate seat existence
      const seatingConfig = ticketGroup.seatingConfig
        ? (JSON.parse(ticketGroup.seatingConfig) as { row: string; columns: number }[])
        : [];

      if (!seatingConfig.length) {
        throw new Error("Seating configuration not available for this ticket group");
      }

      // Build a quick lookup of valid seats
      const validSeatSet = new Set<string>();
      for (const rowConfig of seatingConfig) {
        for (let col = 1; col <= rowConfig.columns; col++) {
          validSeatSet.add(`${rowConfig.row}${col}`);
        }
      }

      if (!validSeatSet.has(seatNumber)) {
        throw new Error("Seat number does not exist in this ticket group");
      }

      // Ensure the seat is not already sold/reserved
      const existing = await prisma.ticket.findFirst({
        where: {
          ticketGroupId,
          seatNumber,
          status: { in: [TicketStatus.SOLD, TicketStatus.RESERVED] },
        },
      });

      if (existing) {
        throw new Error("Seat already taken");
      }

      return await prisma.ticket.create({
        data: {
          ticketGroupId,
          seatNumber,
          status: TicketStatus.SOLD,
          purchasedById: userId,
          purchasedAt: new Date(),
        },
        include: {
          ticketGroup: {
            include: { event: true },
          },
        },
      });
    }

    // For QUEUE or GENERAL type - generate ticket dynamically
    if (
      ticketGroup.seatType === SeatType.QUEUE ||
      ticketGroup.seatType === SeatType.GENERAL
    ) {
      // Count existing tickets to enforce quantity limits
      const existingCount = await prisma.ticket.count({
        where: { ticketGroupId },
      });

      const limit = ticketGroup.quantity ?? 0; // 0 or null means unlimited
      if (limit > 0 && existingCount >= limit) {
        throw new Error("All tickets have been sold");
      }

      // Generate the next ticket number
      const nextNumber = existingCount + 1;
      const prefix = ticketGroup.prefixFormat || "";
      const generatedSeatNumber = `${prefix}${nextNumber}`;

      // Create and mark the ticket as sold immediately
      return await prisma.ticket.create({
        data: {
          ticketGroupId,
          seatNumber: generatedSeatNumber,
          status: TicketStatus.SOLD,
          purchasedById: userId,
          purchasedAt: new Date(),
        },
        include: {
          ticketGroup: {
            include: { event: true },
          },
        },
      });
    }

    throw new Error("Invalid ticket type");
  },

  async batchGenerateTickets(
    ticketGroupId: number,
    userId: number,
    seatType: SeatType,
    quantity?: number,
    seatNumbers?: string[]
  ) {
    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id: ticketGroupId },
      include: { tickets: true },
    });
    
    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }
    const createdTickets = [];

    if (seatType === SeatType.SEAT) {
      if (!seatNumbers || seatNumbers.length === 0) {
        throw new Error("Seat numbers are required for SEAT type tickets");
      }

      for (const seatNumber of seatNumbers) {
        const ticket = await this.generateTicket(ticketGroupId, userId, seatNumber);
        createdTickets.push(ticket);
      }
    } else if (seatType === SeatType.QUEUE || seatType === SeatType.GENERAL) {
      if (!quantity || quantity <= 0) {
        throw new Error("Quantity must be a positive integer for QUEUE/GENERAL type tickets");
      }

      for (let i = 0; i < quantity; i++) {
        const ticket = await this.generateTicket(ticketGroupId, userId);
        createdTickets.push(ticket);
      }
    } else {
      throw new Error("Invalid seat type");
    }

    return createdTickets;
  }
}