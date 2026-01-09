import type {
  SeatHold,
  SeatType,
  Ticket,
  TicketGroup,
  TicketStatus,
} from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.ts";
import { qrTokenService } from "./qrToken.service.ts";

export const ticketService = {
  // TICKET GENERATION
  async generateTicket(
    ticketGroupId: number,
    userId: number,
    seatNumber?: string
  ) {
    const ticketGroupsOnly = await prisma.$queryRaw<TicketGroup[]>`
      SELECT * FROM TicketGroup
      WHERE id = ${ticketGroupId}
    `;

    if (ticketGroupsOnly.length === 0) {
      throw new Error("Ticket group not found");
    }
    const ticketGroupOnly = ticketGroupsOnly[0];
    if (ticketGroupOnly === undefined) {
      throw new Error("Ticket group not found");
    }

    const ticketGroup = ticketGroupOnly;

    // For SEAT type - user must specify a seat number and it must be valid per seatingConfig
    if (ticketGroup.seatType === "SEAT") {
      if (!seatNumber) {
        throw new Error("Seat number is required for SEAT type tickets");
      }

      // Parse seating configuration to validate seat existence
      const seatingConfig = ticketGroup.seatingConfig
        ? (JSON.parse(ticketGroup.seatingConfig) as {
            row: string;
            columns: number;
          }[])
        : [];

      if (!seatingConfig.length) {
        throw new Error(
          "Seating configuration not available for this ticket group"
        );
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

      const existingTickets = await prisma.$queryRaw<Ticket[]>`
        SELECT * FROM Ticket
        WHERE ticketGroupId = ${ticketGroupId}
          AND seatNumber = ${seatNumber}
          AND status IN ('SOLD', 'RESERVED')
      `;

      if (existingTickets.length > 0) {
        throw new Error("Seat already taken");
      }

      const seatHolds = await prisma.$queryRaw<SeatHold[]>`
        SELECT * FROM SeatHold
        WHERE ticketGroupId = ${ticketGroupId}
          AND seatNumber = ${seatNumber}
          AND expiresAt > ${new Date()}
      `;

      const seatHold = seatHolds[0];
      if (seatHold && seatHold.heldBy !== userId) {
        throw new Error("Seat is currently held by another user");
      }

      const ticket = await prisma.$transaction(async (tx) => {
        const now = new Date();
        await tx.$executeRaw`
          INSERT INTO Ticket (ticketGroupId, seatNumber, status, purchasedById, purchasedAt, updatedAt)
          VALUES (${ticketGroupId}, ${seatNumber}, ${"SOLD"}, ${userId}, ${now}, ${now})
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            purchasedById = VALUES(purchasedById),
            purchasedAt = VALUES(purchasedAt),
            updatedAt = VALUES(updatedAt);
        `;

        const tickets = await tx.$queryRaw<Ticket[]>`
            SELECT *
            FROM Ticket
            WHERE ticketGroupId = ${ticketGroupId}
              AND seatNumber = ${seatNumber}
            LIMIT 1
          `;

        if (tickets.length === 0) {
          throw new Error("Ticket not found");
        }
        if (tickets[0] === undefined) {
          throw new Error("Ticket not found");
        }
        return tickets[0];
      });

      return ticket;
    }

    // For QUEUE or GENERAL type - generate ticket dynamically

    if (
      !(ticketGroup.seatType === "QUEUE" || ticketGroup.seatType === "GENERAL")
    ) {
      throw new Error("Invalid ticket type");
    }

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
    const ticket = await prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.$executeRaw`
          INSERT INTO Ticket (ticketGroupId, seatNumber, status, purchasedById, purchasedAt, updatedAt)
          VALUES (${ticketGroupId}, ${generatedSeatNumber}, ${"SOLD"}, ${userId}, ${now}, ${now});
        `;

      const rows = await tx.$queryRaw<Ticket[]>`
          SELECT * FROM Ticket
          WHERE ticketGroupId = ${ticketGroupId}
            AND seatNumber = ${generatedSeatNumber}
          LIMIT 1;
        `;

      if (rows.length === 0 || !rows[0]) {
        throw new Error("Failed to create ticket");
      }
      return rows[0];
    });

    return ticket;
  },

  async batchGenerateTickets(
    ticketGroupId: number,
    userId: number,
    seatType: SeatType,
    quantity?: number,
    seatNumbers?: string[]
  ) {
    const ticketGroupsOnly = await prisma.$queryRaw<TicketGroup[]>`
      SELECT * FROM TicketGroup
      WHERE id = ${ticketGroupId}
    `;

    if (ticketGroupsOnly.length === 0) {
      throw new Error("Ticket group not found");
    }
    const ticketGroupOnly = ticketGroupsOnly[0];
    if (ticketGroupOnly === undefined) {
      throw new Error("Ticket not found");
    }

    const ticketGroup = ticketGroupOnly;

    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }

    const createdTickets = [];

    if (seatType === "SEAT") {
      if (!seatNumbers || seatNumbers.length === 0) {
        throw new Error("Seat numbers are required for SEAT type tickets");
      }

      for (const seatNumber of seatNumbers) {
        const ticket = await this.generateTicket(
          ticketGroupId,
          userId,
          seatNumber
        );
        createdTickets.push(ticket);
      }
    } else if (seatType === "QUEUE" || seatType === "GENERAL") {
      if (!quantity || quantity <= 0) {
        throw new Error(
          "Quantity must be a positive integer for QUEUE/GENERAL type tickets"
        );
      }

      for (let i = 0; i < quantity; i++) {
        const ticket = await this.generateTicket(ticketGroupId, userId);
        createdTickets.push(ticket);
      }
    } else {
      throw new Error("Invalid seat type");
    }

    return createdTickets;
  },

  async generateQRTokensForTickets(
    tickets: Array<{ id: number; ticketGroupId: number; seatNumber: string }>,
    eventId: number,
    orderId: number
  ) {
    const updatedTickets = [];

    for (const ticket of tickets) {
      const qrToken = qrTokenService.generateQRToken({
        ticketId: ticket.id,
        eventId,
        orderId,
        seatNumber: ticket.seatNumber,
        ticketGroupId: ticket.ticketGroupId,
      });

      const updated = await prisma.$queryRaw<Ticket[]>`
        UPDATE Ticket
        SET qrToken = ${qrToken}
        WHERE id = ${ticket.id}
      `;
      if (updated.length === 0) {
        throw new Error("Failed to update ticket with QR token");
      }

      updatedTickets.push(...updated);
    }

    return updatedTickets;
  },
  // Get all tickets with filtering
  async getAllTickets(params?: {
    eventId?: number;
    status?: TicketStatus;
    searchQuery?: string; // Search by code, customer name
    page?: number;
    limit?: number;
  }) {
    const { eventId, status, searchQuery, page = 1, limit = 50 } = params || {};

    const where: any = {};

    if (eventId) {
      where.ticketGroup = { eventId };
    }

    if (status) {
      where.status = status;
    }

    if (searchQuery) {
      where.OR = [
        { seatNumber: { contains: searchQuery } },
        { purchasedBy: { username: { contains: searchQuery } } },
      ];
    }

    const [tickets, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        include: {
          ticketGroup: {
            include: {
              event: true,
            },
          },
          purchasedBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, total, page, limit };
  },

  // Get ticket statistics
  async getTicketStats(eventId?: number) {
    const where: any = eventId ? { ticketGroup: { eventId } } : {};

    const [total, sold, reserved, available] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: "SOLD" } }),
      prisma.ticket.count({
        where: { ...where, status: "RESERVED" },
      }),
      prisma.ticket.count({
        where: { ...where, status: "AVAILABLE" },
      }),
    ]);

    return { total, sold, reserved, available };
  },
};
