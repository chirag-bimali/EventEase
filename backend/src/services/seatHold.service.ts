import { get } from "node:http";
import type {
  SeatHold,
  Ticket,
  TicketGroup,
} from "../generated/prisma/edge.js";
import { Prisma } from "../generated/prisma/edge.js";
import { prisma } from "../lib/primsa.ts";
import type { SeatingRow } from "../schemas/ticketGroup.schema.ts";

export const seatHoldService = {
  async createHolds(
    ticketGroupId: number,
    seatNumbers: string[],
    userId: number,
    durationMinutes: number = 10
  ) {
    // Validate ticket group exists

    const ticketGroups = await prisma.$queryRaw<TicketGroup[]>`
      SELECT * FROM TicketGroup WHERE id = ${ticketGroupId}
    `;
    if (ticketGroups.length === 0) {
      throw new Error("Ticket group not found");
    }

    const tickets = await prisma.$queryRaw<Ticket[]>`
      SELECT * FROM Ticket WHERE ticketGroupId = ${ticketGroupId}
    `;

    const ticketGroup: TicketGroup & { tickets: Ticket[] } = {
      ...ticketGroups[0]!,
      tickets: tickets,
    };

    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }

    if (ticketGroup.seatType === "SEAT") {
      if (!ticketGroup.seatingConfig)
        throw new Error("Ticket group has no seating configuration");

      const seatingConfig = JSON.parse(
        ticketGroup.seatingConfig
      ) as SeatingRow[];

      // Build seat map from seating config
      const validSeats = new Set<string>();
      for (const rowConfig of seatingConfig) {
        for (let col = 1; col <= rowConfig.columns; col++) {
          validSeats.add(`${rowConfig.row}${col}`);
        }
      }

      // Validate requested seats exist in seating config
      const invalidSeats = seatNumbers.filter((seat) => !validSeats.has(seat));
      if (invalidSeats.length > 0) {
        throw new Error(
          `Invalid seat numbers requested: ${invalidSeats.join(", ")}`
        );
      }

      // Check if seats are already sold or reserved
      const existingTickets = ticketGroup.tickets;
      const unavailableSeats = existingTickets
        .filter(
          (ticket) =>
            seatNumbers.includes(ticket.seatNumber) &&
            (ticket.status === "SOLD" || ticket.status === "RESERVED")
        )
        .map((ticket) => ticket.seatNumber);

      if (unavailableSeats.length > 0) {
        throw new Error(
          `The following seats are already sold or reserved: ${unavailableSeats.join(
            ", "
          )}`
        );
      }

      await prisma.$executeRaw`
        DELETE FROM SeatHold
        WHERE ticketGroupId = ${ticketGroupId} AND expiresAt < ${new Date()}
      `;
      if (seatNumbers.length === 0) {
        throw new Error("No seat numbers provided");
      }

      const existingHolds = await prisma.$queryRaw<SeatHold[]>`
        SELECT * FROM SeatHold
        WHERE ticketGroupId = ${ticketGroupId} AND 
        seatNumber IN (${Prisma.join(seatNumbers)}) AND 
        expiresAt > ${new Date()}
      `;

      if (existingHolds.length > 0) {
        const heldSeats = existingHolds.map((hold) => hold.seatNumber);
        throw new Error(
          `The following seats are currently held by another user: ${heldSeats.join(
            ", "
          )}`
        );
      }
    } else {
      // For NON-SEAT type, just ensure if enough tickets are available
      const existingTickets = ticketGroup.tickets;
      const reservedOrSoldCount = existingTickets.filter(
        (ticket) => ticket.status === "SOLD" || ticket.status === "RESERVED"
      ).length;

      if (ticketGroup.quantity === null) {
        throw new Error(
          "Ticket group has unlimited quantity, cannot hold tickets"
        );
      }

      const availableCount = ticketGroup.quantity - reservedOrSoldCount;

      if (seatNumbers.length > availableCount) {
        throw new Error(
          `Not enough available tickets. Requested: ${seatNumbers.length}, Available: ${availableCount}`
        );
      }
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60000);

    // ✅ Create SeatHold records (NO ticket creation yet)
    const holdCounts = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const seatNumber of seatNumbers) {
        await tx.$executeRaw`
          INSERT INTO SeatHold (ticketGroupId, seatNumber, heldBy, expiresAt)
          VALUES (${ticketGroupId}, ${seatNumber}, ${userId}, ${expiresAt})
        `;
        count++;
      }
      return count;
    });

    return holdCounts;
  },
  async getHoldsByUser(userId: number) {
    const holds = await prisma.$queryRaw<SeatHold[]>`
      SELECT * FROM SeatHold
      WHERE heldBy = ${userId} AND expiresAt > ${new Date()}
    `;
    return holds;
  },
  async getHoldsByTicketGroup(ticketGroupId: number) {
    const holds = await prisma.$queryRaw<SeatHold[]>`
      SELECT * FROM SeatHold
      WHERE ticketGroupId = ${ticketGroupId} AND expiresAt > ${new Date()}
    `;
    return holds;
  },

  async releaseHolds(
    ticketGroupId: number,
    seatNumbers: string[],
    userId: number
  ) {
    // Verify user owns these holds (optional security check)
    const holds = await prisma.seatHold.findMany({
      where: {
        ticketGroupId,
        seatNumber: { in: seatNumbers },
        heldBy: userId,
      },
    });

    if (holds.length === 0) {
      throw new Error("No holds found for these seats");
    }

    // Delete SeatHold records
    await prisma.seatHold.deleteMany({
      where: {
        ticketGroupId,
        seatNumber: { in: seatNumbers },
      },
    });

    // Mark tickets as AVAILABLE (only if not SOLD)
    await prisma.ticket.updateMany({
      where: {
        ticketGroupId,
        seatNumber: { in: seatNumbers },
        status: "RESERVED",
      },
      data: {
        status: "AVAILABLE",
      },
    });

    return { success: true, releasedCount: holds.length };
  },

  async releaseExpiredHolds() {
    // Find all expired holds
    const expiredHolds = await prisma.seatHold.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (expiredHolds.length === 0) {
      return { success: true, releasedCount: 0 };
    }

    // Group by ticketGroupId for batch updates
    const holdsByGroup = new Map<
      number,
      { seatNumbers: string[]; ids: number[] }
    >();

    for (const hold of expiredHolds) {
      const key = hold.ticketGroupId;
      if (!holdsByGroup.has(key)) {
        holdsByGroup.set(key, { seatNumbers: [], ids: [] });
      }
      const group = holdsByGroup.get(key)!;
      group.seatNumbers.push(hold.seatNumber);
      group.ids.push(hold.id);
    }

    // Process each group
    for (const [ticketGroupId, { seatNumbers, ids }] of holdsByGroup) {
      // Mark tickets as AVAILABLE
      await prisma.ticket.updateMany({
        where: {
          ticketGroupId,
          seatNumber: { in: seatNumbers },
          status: "RESERVED",
        },
        data: {
          status: "AVAILABLE",
        },
      });

      // Delete hold records
      await prisma.seatHold.deleteMany({
        where: {
          id: { in: ids },
        },
      });
    }

    return { success: true, releasedCount: expiredHolds.length };
  },
};
