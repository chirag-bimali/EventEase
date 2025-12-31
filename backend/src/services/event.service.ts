import { prisma } from "../lib/primsa.js";
import type {
  CreateEventDTO,
  CreateTicketGroupDTO,
  SeatingRow,
  UpdateEventDTO,
} from "../schemas/event.schema.js";
import { SeatType, TicketStatus } from "../generated/prisma/client.js";

export const eventService = {
  // EVENT CRUD
  async createEvent(data: CreateEventDTO, userId: number) {
    return await prisma.event.create({
      data: {
        ...data,
        name: data.name,
        description: data.description,
        venue: data.venue,
        imageUrl: data.imageUrl || null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        createdById: userId,
      },
      include: {
        ticketGroups: true,
      },
    });
  },
  async getAllEvents() {
    return await prisma.event.findMany({
      include: {
        ticketGroups: {
          include: {
            tickets: {
              where: { status: TicketStatus.AVAILABLE },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  },

  async getEventById(id: number) {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        ticketGroups: {
          include: {
            tickets: true,
          },
        },
        createdBy: {
          select: { id: true, username: true },
        },
      },
    });
  },

  async updateEvent(id: number, data: UpdateEventDTO) {
    const updateData: any = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);

    return await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        ticketGroups: true,
      },
    });
  },

  async deleteEvent(id: number) {
    return await prisma.event.delete({
      where: { id },
    });
  },

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
    let ticketsToCreate: { seatNumber: string; status: TicketStatus }[] = [];

    if (
      seatType === SeatType.SEAT &&
      seatingConfig &&
      seatingConfig.length > 0
    ) {
      // Seat-based tickets with dynamic row/column configuration
      // Example: [{"row": "A", "columns": 8}, {"row": "B", "columns": 10}]
      // Generates: A1, A2, ..., A8, B1, B2, ..., B10

      for (const rowConfig of seatingConfig) {
        const { row, columns } = rowConfig;
        totalSeats += columns;

        for (let col = 1; col <= columns; col++) {
          ticketsToCreate.push({
            seatNumber: `${row}${col}`,
            status: TicketStatus.AVAILABLE,
          });
        }
      }
    } else if (
      (seatType === SeatType.QUEUE || seatType === SeatType.GENERAL) &&
      quantity &&
      prefixFormat
    ) {
      // Queue-based tickets: B1, B2, B3, etc.
      totalSeats = quantity;
      for (let i = 1; i <= quantity; i++) {
        ticketsToCreate.push({
          seatNumber: `${prefixFormat}${i}`,
          status: TicketStatus.AVAILABLE,
        });
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
        tickets: {
          create: ticketsToCreate,
        },
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
};
