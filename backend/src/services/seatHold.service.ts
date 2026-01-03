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
    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id: ticketGroupId },
      include: { tickets: true },
    });

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

      await prisma.seatHold.deleteMany({
        where: { ticketGroupId, expiresAt: { lt: new Date() } },
      });

      const existingHolds = await prisma.seatHold.findMany({
        where: {
          ticketGroupId,
          seatNumber: { in: seatNumbers },
          expiresAt: { gt: new Date() },
        },
      });

      if (existingHolds.length > 0) {
        const heldSeats = existingHolds.map((hold) => hold.seatNumber);
        throw new Error(
          `The following seats are currently held by another user: ${heldSeats.join(
            ", "
          )}`
        );
      }
    } else {
      // For NON-SEAT type, just ensure none are SOLD
      const existingTickets = ticketGroup.tickets;
      const soldSeats = existingTickets.filter((t) => t.status === "SOLD");

      if (soldSeats.length > 0) {
        throw new Error(
          `Seats ${soldSeats
            .map((t) => t.seatNumber)
            .join(", ")} are already sold`
        );
      }
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60000);

    // ✅ Create SeatHold records (NO ticket creation yet)
    const holds = await Promise.all(
      seatNumbers.map((seatNumber) =>
        prisma.seatHold.create({
          data: {
            ticketGroupId,
            seatNumber,
            heldBy: userId,
            expiresAt,
          },
        })
      )
    );

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
