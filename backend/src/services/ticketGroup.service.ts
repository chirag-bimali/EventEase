import { SeatType } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.js";
import type { CreateTicketGroupDTO, SeatingRow } from "../schemas/ticketGroup.schema.js";

export const ticketGroupService = {

  // TICKET GROUP MANAGEMENT
  async createTicketGroup(data: CreateTicketGroupDTO) {
    const {
      eventId,
      seatType,
      seatingConfig,
      quantity,
      prefixFormat,
      name,
      price,
      description,
    } = data;

    let totalSeats = 0;

    if (
      seatType === SeatType.SEAT &&
      seatingConfig &&
      seatingConfig.length > 0
    ) {
      // Seat-based ticket group metadata; tickets themselves are created on demand later.
      for (const rowConfig of seatingConfig) {
        totalSeats += rowConfig.columns;
      }
    }

    return await prisma.ticketGroup.create({
      data: {
        eventId,
        name,
        description: description || null,
        price,
        seatType,
        seatingConfig: seatingConfig ? JSON.stringify(seatingConfig) : null,
        quantity: quantity || null,
        prefixFormat: prefixFormat || null,
        totalSeats,
      },
      include: {
        tickets: true,
      },
    });
  },

  async getTicketGroupsByEvent(eventId: number) {
    return await prisma.ticketGroup.findMany({
      where: { eventId },
      include: {
        tickets: true,
      },
    });
  },

  async updateTicketGroup(id: number, data: Partial<CreateTicketGroupDTO>) {
    const {
      name,
      price,
      seatType,
      description,
      prefixFormat,
      quantity,
      seatingConfig,
      eventId,
    } = data;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (seatType !== undefined) updateData.seatType = seatType as SeatType;
    if (description !== undefined) updateData.description = description ?? null;
    if (prefixFormat !== undefined)
      updateData.prefixFormat = prefixFormat ?? null;
    if (quantity !== undefined) updateData.quantity = quantity ?? null;
    if (eventId !== undefined) updateData.eventId = eventId;
    if (seatingConfig !== undefined) {
      updateData.seatingConfig = seatingConfig
        ? JSON.stringify(seatingConfig)
        : null;
    }
    return await prisma.ticketGroup.update({
      where: { id },
      data: updateData,
      include: {
        tickets: true,
      },
    });
  },

  async deleteTicketGroup(id: number) {
    return await prisma.ticketGroup.delete({
      where: { id },
    });
  },

  // Helper method to get parsed seating configuration
  async getTicketGroupWithParsedConfig(id: number) {
    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id },
      include: { tickets: true },
    });

    if (!ticketGroup) return null;

    return {
      ...ticketGroup,
      seatingConfig: ticketGroup.seatingConfig
        ? (JSON.parse(ticketGroup.seatingConfig) as SeatingRow[])
        : null,
    };
  },

  // Get availability statistics for a ticket group
  async getTicketGroupAvailability(id: number) {
    const ticketGroup = await prisma.ticketGroup.findUnique({
      where: { id },
      include: {
        tickets: {
          where: {
            status: { in: ["SOLD", "RESERVED"] },
          },
        },
      },
    });

    if (!ticketGroup) {
      throw new Error("Ticket group not found");
    }

    const soldCount = ticketGroup.tickets.length;
    let total: number;
    let available: number;

    if (ticketGroup.seatType === SeatType.SEAT) {
      // For SEAT: total from seatingConfig
      if (ticketGroup.seatingConfig) {
        const config = JSON.parse(ticketGroup.seatingConfig) as SeatingRow[];
        total = config.reduce((sum, row) => sum + row.columns, 0);
      } else {
        total = ticketGroup.totalSeats || 0;
      }
      available = total - soldCount;
    } else {
      // For QUEUE/GENERAL: check quantity
      if (!ticketGroup.quantity || ticketGroup.quantity === 0) {
        // Unlimited
        return {
          available: -1,
          sold: soldCount,
          total: -1,
        };
      }
      total = ticketGroup.quantity;
      available = total - soldCount;
    }

    return {
      available: Math.max(0, available),
      sold: soldCount,
      total,
    };
  },

}