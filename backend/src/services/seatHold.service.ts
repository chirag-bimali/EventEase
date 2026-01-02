import { prisma } from "../lib/primsa.js";

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
    });

    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }

    // Check if seats exist and are available (not SOLD)
    const tickets = await prisma.ticket.findMany({
      where: {
        ticketGroupId,
        seatNumber: { in: seatNumbers },
      },
    });

    if (tickets.length !== seatNumbers.length) {
      throw new Error("One or more seats do not exist");
    }

    // Check if any seat is already SOLD
    const soldSeats = tickets.filter((t) => t.status === "SOLD");
    if (soldSeats.length > 0) {
      throw new Error(
        `Seats ${soldSeats.map((t) => t.seatNumber).join(", ")} are already sold`
      );
    }

    // Calculate expiry time (now + duration minutes)
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Create SeatHold records
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

    // Mark tickets as RESERVED
    await prisma.ticket.updateMany({
      where: {
        ticketGroupId,
        seatNumber: { in: seatNumbers },
      },
      data: {
        status: "RESERVED",
      },
    });

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