import { SeatType, TicketStatus } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.ts";
import { type CreateSeatTicketDTO } from "../schemas/ticket.schema.ts";
import { qrTokenService } from "./qrToken.service.ts";
import {
  isReservationExpired,
  releaseExpiredReservations,
} from "./ticketReservation.service.ts";

export const ticketService = {
  async createSeatTicket(data: CreateSeatTicketDTO, userId: number) {
    const { ticketGroupId, seatNumber, status } = data;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    await releaseExpiredReservations({ ticketGroupId });

    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id: ticketGroupId },
      include: { tickets: true },
    });

    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }

    if (ticketGroup.seatType !== SeatType.SEAT) {
      throw new Error(
        "Cannot create seat ticket for non-SEAT type ticket group",
      );
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
        "Seating configuration not available for this ticket group",
      );
    }

    // Build a quick lookup of valid seats
    const validSeatSet = new Set<string>();
    for (const rowConfig of seatingConfig) {
      for (let col = 1; col <= rowConfig.columns; col++) {
        validSeatSet.add(`${rowConfig.row}${col}`);
      }
    }

    // check if requested seats exist in seating config
    for (const seat of seatNumber) {
      if (!validSeatSet.has(seat)) {
        throw new Error(
          `Seat number ${seat} does not exist in this ticket group`,
        );
      }
    }

    // Ensure the seats are not already sold/reserved
    const existing = ticketGroup.tickets.filter((t) => {
      // choose only the tickets that match the requested seat numbers
      const choosedSeat = seatNumber.includes(t.seatNumber);
      if (!choosedSeat) return false;

      if (t.status === TicketStatus.SOLD || t.status === TicketStatus.USED) {
        return true;
      }

      if (
        t.status === TicketStatus.RESERVED &&
        t.reservedById !== userId &&
        !isReservationExpired(t.reservedAt)
      ) {
        return true;
      }
      return false;
    });

    if (existing.length > 0) {
      throw new Error(
        `Seat ${existing.map((t) => t.seatNumber).join(", ")} is already taken`,
      );
    }

    const existingTickets = ticketGroup.tickets;

    const existingSeatNumbersSet = new Set(
      existingTickets.map((t) => t.seatNumber),
    );

    const existingSeatNumbers = existingTickets
      .filter((t) => seatNumber.includes(t.seatNumber))
      .map((t) => t.seatNumber);

    if (status === TicketStatus.AVAILABLE) {
      await prisma.ticket.updateMany({
        where: {
          ticketGroupId,
          seatNumber: { in: seatNumber },
          status: TicketStatus.RESERVED,
          OR: [{ reservedById: userId }, { reservedById: null }],
        },
        data: {
          status: TicketStatus.AVAILABLE,
          reservedById: null,
          reservedAt: null,
        },
      });
      return;
    }

    const newSeats = seatNumber.filter(
      (seat) => !existingSeatNumbersSet.has(seat),
    );

    const reservedAt = new Date();
    const reservedById = userId;

    await prisma.$transaction([
      prisma.ticket.createMany({
        data: newSeats.map((seat) => ({
          ticketGroupId,
          reservedById,
          reservedAt,
          seatNumber: seat,
          status: TicketStatus.RESERVED,
        })),
      }),

      prisma.ticket.updateMany({
        where: {
          ticketGroupId,
          seatNumber: {
            in: existingSeatNumbers,
          },
        },
        data: {
          status: TicketStatus.RESERVED,
          reservedById,
          reservedAt,
        },
      }),
    ]);
  },

  async createGeneralOrQueueTickets(
    ticketGroupId: number,
    quantity: number,
    userId: number,
  ) {
    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id: ticketGroupId },
      include: { tickets: true },
    });

    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }

    const ticketCount =
      ticketGroup.tickets.length ||
      0; /* Count existing tickets to enforce quantity limits */
    const limit = ticketGroup.quantity ?? 0; // 0 or null means unlimited

    if (limit > 0 && ticketCount + quantity > limit) {
      throw new Error("Exceeds available ticket quantity");
    }

    // Generate the next ticket number
    const nextNumber = ticketCount + 1;
    const prefix = ticketGroup.prefixFormat || "";
    const generatedSeatNumber = `${prefix}${nextNumber}`;

    // Create and mark the ticket as sold immediately
    return prisma.ticket.create({
      data: {
        ticketGroupId,
        seatNumber: generatedSeatNumber,
        status: TicketStatus.SOLD,
        purchasedById: userId,
        purchasedAt: new Date(),
      },
    });
  },

  async batchGenerateTickets(
    ticketGroupId: number,
    userId: number,
    seatType: SeatType,
    quantity?: number,
    seatNumbers?: string[],
  ) {
    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id: ticketGroupId },
      include: { tickets: true },
    });

    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }

    if (seatType === SeatType.SEAT) {
      if (!seatNumbers?.length) {
        throw new Error("Seat numbers are required for SEAT type tickets");
      }

      await releaseExpiredReservations({ ticketGroupId });

      const seatingConfig = ticketGroup.seatingConfig
        ? (JSON.parse(ticketGroup.seatingConfig) as {
            row: string;
            columns: number;
          }[])
        : [];

      if (!seatingConfig.length) {
        throw new Error(
          "Seating configuration not available for this ticket group",
        );
      }

      const validSeatSet = new Set<string>();
      for (const rowConfig of seatingConfig) {
        for (let col = 1; col <= rowConfig.columns; col++) {
          validSeatSet.add(`${rowConfig.row}${col}`);
        }
      }

      const invalidSeats = seatNumbers.filter((seat) => !validSeatSet.has(seat));
      if (invalidSeats.length > 0) {
        throw new Error(
          `Invalid seat numbers: ${invalidSeats.join(", ")}`,
        );
      }

      const unavailable = ticketGroup.tickets.filter(
        (t) =>
          seatNumbers.includes(t.seatNumber) &&
          (t.status === TicketStatus.SOLD || t.status === TicketStatus.USED),
      );

      if (unavailable.length > 0) {
        throw new Error(
          `Seats already sold: ${unavailable.map((t) => t.seatNumber).join(", ")}`,
        );
      }

      const soldAt = new Date();
      const createdTickets = [];

      for (const seatNumber of seatNumbers) {
        const ticket = await prisma.ticket.upsert({
          where: {
            ticketGroupId_seatNumber: { ticketGroupId, seatNumber },
          },
          create: {
            ticketGroupId,
            seatNumber,
            status: TicketStatus.SOLD,
            purchasedById: userId,
            purchasedAt: soldAt,
          },
          update: {
            status: TicketStatus.SOLD,
            purchasedById: userId,
            purchasedAt: soldAt,
            reservedById: null,
            reservedAt: null,
          },
        });
        createdTickets.push(ticket);
      }

      return createdTickets;
    }

    if (seatType === SeatType.QUEUE || seatType === SeatType.GENERAL) {
      if (!quantity || quantity <= 0) {
        throw new Error(
          "Quantity must be a positive integer for QUEUE/GENERAL type tickets",
        );
      }

      const existingCount = ticketGroup.tickets.length;
      const limit = ticketGroup.quantity ?? 0;

      if (limit > 0 && existingCount + quantity > limit) {
        throw new Error("Exceeds available ticket quantity");
      }

      const prefix = ticketGroup.prefixFormat || "";
      const soldAt = new Date();
      const createdTickets = [];

      for (let i = 0; i < quantity; i++) {
        const seatNumber = `${prefix}${existingCount + i + 1}`;
        const ticket = await prisma.ticket.create({
          data: {
            ticketGroupId,
            seatNumber,
            status: TicketStatus.SOLD,
            purchasedById: userId,
            purchasedAt: soldAt,
          },
        });
        createdTickets.push(ticket);
      }

      return createdTickets;
    }

    throw new Error("Invalid seat type");
  },

  // // TICKET GENERATION
  // async generateTicket(
  //   ticketGroupId: number,
  //   userId: number,
  //   seatNumber?: string,
  // ) {
  //   const ticketGroup = await prisma.ticketGroup.findUnique({
  //     where: { id: ticketGroupId },
  //     include: { tickets: true },
  //   });

  //   if (!ticketGroup) {
  //     throw new Error("Ticket group not found");
  //   }

  //   // For SEAT type - user must specify a seat number and it must be valid per seatingConfig
  //   if (ticketGroup.seatType === SeatType.SEAT) {
  //     if (!seatNumber) {
  //       throw new Error("Seat number is required for SEAT type tickets");
  //     }

  //     // Parse seating configuration to validate seat existence
  //     const seatingConfig = ticketGroup.seatingConfig
  //       ? (JSON.parse(ticketGroup.seatingConfig) as {
  //           row: string;
  //           columns: number;
  //         }[])
  //       : [];

  //     if (!seatingConfig.length) {
  //       throw new Error(
  //         "Seating configuration not available for this ticket group",
  //       );
  //     }

  //     // Build a quick lookup of valid seats
  //     const validSeatSet = new Set<string>();
  //     for (const rowConfig of seatingConfig) {
  //       for (let col = 1; col <= rowConfig.columns; col++) {
  //         validSeatSet.add(`${rowConfig.row}${col}`);
  //       }
  //     }

  //     if (!validSeatSet.has(seatNumber)) {
  //       throw new Error("Seat number does not exist in this ticket group");
  //     }

  //     // Ensure the seat is not already sold/reserved
  //     const existing = await prisma.ticket.findFirst({
  //       where: {
  //         ticketGroupId,
  //         seatNumber,
  //         status: { in: [TicketStatus.SOLD, TicketStatus.RESERVED] },
  //       },
  //     });

  //     if (existing) {
  //       throw new Error("Seat already taken");
  //     }

  //     const ticket = await prisma.ticket.upsert({
  //       where: { ticketGroupId_seatNumber: { ticketGroupId, seatNumber } },
  //       create: {
  //         ticketGroupId,
  //         seatNumber,
  //         status: TicketStatus.SOLD,
  //         purchasedById: userId,
  //         purchasedAt: new Date(),
  //       },
  //       update: {
  //         status: TicketStatus.SOLD,
  //         purchasedById: userId,
  //         purchasedAt: new Date(),
  //       },
  //       include: { ticketGroup: { include: { event: true } } },
  //     });

  //     return ticket;
  //   }

  //   // For QUEUE or GENERAL type - generate ticket dynamically
  //   if (
  //     ticketGroup.seatType === SeatType.QUEUE ||
  //     ticketGroup.seatType === SeatType.GENERAL
  //   ) {
  //     // Count existing tickets to enforce quantity limits
  //     const existingCount = await prisma.ticket.count({
  //       where: { ticketGroupId },
  //     });

  //     const limit = ticketGroup.quantity ?? 0; // 0 or null means unlimited
  //     if (limit > 0 && existingCount >= limit) {
  //       throw new Error("All tickets have been sold");
  //     }

  //     // Generate the next ticket number
  //     const nextNumber = existingCount + 1;
  //     const prefix = ticketGroup.prefixFormat || "";
  //     const generatedSeatNumber = `${prefix}${nextNumber}`;

  //     // Create and mark the ticket as sold immediately
  //     return await prisma.ticket.create({
  //       data: {
  //         ticketGroupId,
  //         seatNumber: generatedSeatNumber,
  //         status: TicketStatus.SOLD,
  //         purchasedById: userId,
  //         purchasedAt: new Date(),
  //       },
  //       include: {
  //         ticketGroup: {
  //           include: { event: true },
  //         },
  //       },
  //     });
  //   }

  //   throw new Error("Invalid ticket type");
  // },

  // async batchGenerateTickets(
  //   ticketGroupId: number,
  //   userId: number,
  //   seatType: SeatType,
  //   quantity?: number,
  //   seatNumbers?: string[],
  // ) {
  //   const ticketGroup = await prisma.ticketGroup.findUnique({
  //     where: { id: ticketGroupId },
  //     include: { tickets: true },
  //   });

  //   if (!ticketGroup) {
  //     throw new Error("Ticket group not found");
  //   }
  //   const createdTickets = [];

  //   if (seatType === SeatType.SEAT) {
  //     if (!seatNumbers || seatNumbers.length === 0) {
  //       throw new Error("Seat numbers are required for SEAT type tickets");
  //     }

  //     for (const seatNumber of seatNumbers) {
  //       const ticket = await this.generateTicket(
  //         ticketGroupId,
  //         userId,
  //         seatNumber,
  //       );
  //       createdTickets.push(ticket);
  //     }
  //   } else if (seatType === SeatType.QUEUE || seatType === SeatType.GENERAL) {
  //     if (!quantity || quantity <= 0) {
  //       throw new Error(
  //         "Quantity must be a positive integer for QUEUE/GENERAL type tickets",
  //       );
  //     }

  //     for (let i = 0; i < quantity; i++) {
  //       const ticket = await this.generateTicket(ticketGroupId, userId);
  //       createdTickets.push(ticket);
  //     }
  //   } else {
  //     throw new Error("Invalid seat type");
  //   }

  //   return createdTickets;
  // },

  async generateQRTokensForTickets(
    tickets: Array<{ id: number; ticketGroupId: number; seatNumber: string }>,
    eventId: number,
    orderId: number,
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

      const updated = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { qrToken },
      });

      updatedTickets.push(updated);
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

    const [total, sold, reserved, available] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: TicketStatus.SOLD } }),
      prisma.ticket.count({
        where: { ...where, status: TicketStatus.RESERVED },
      }),
      prisma.ticket.count({
        where: { ...where, status: TicketStatus.AVAILABLE },
      }),
    ]);

    return { total, sold, reserved, available };
  },
};
