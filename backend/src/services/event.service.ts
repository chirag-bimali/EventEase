import { prisma } from "../lib/primsa.ts";
import type {
  CreateEventDTO,
  UpdateEventDTO,
} from "../schemas/event.schema.ts";
import { SeatType, TicketStatus } from "../generated/prisma/client.js";

export const eventService = {
  // EVENT CRUD
  async createEvent(data: CreateEventDTO, userId: number) {
    // print start and end time
    return await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        venue: data.venue,
        ...(data.startTime && {startTime: new Date(data.startTime)}),
        ...(data.endTime && {endTime: new Date(data.endTime)}),
        imageUrl: data.imageUrl || null,
        createdById: userId,
        status: data.status || "DRAFT",
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
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketGroups: {
          include: {
            tickets: {
              where: {
                status: { in: [TicketStatus.SOLD, TicketStatus.RESERVED] },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if event has ended
    if (event.endTime && event.endTime < new Date()) {
      throw new Error("Cannot edit an event that has already ended");
    }

    // Check if tickets have been sold
    const hasSoldTickets = event.ticketGroups.some(
      (tg) => tg.tickets.length > 0
    );
    if (hasSoldTickets) {
      throw new Error("Cannot edit event with sold or reserved tickets");
    }

    // Check status change restrictions (can't go from SOLD_OUT to anything else)
    if (event.status === "SOLD_OUT" && data.status && data.status !== "SOLD_OUT") {
      throw new Error("Cannot change status from SOLD_OUT to another status");
    }

    // Prepare update data
    const updateData: any = { ...data };
    if (data.startTime !== undefined) {
      updateData.startTime = data.startTime ? new Date(data.startTime) : null;
    }
    if (data.endTime !== undefined) {
      updateData.endTime = data.endTime ? new Date(data.endTime) : null;
    }

    // Validate: if both times provided, endTime must be after startTime
    if (updateData.startTime && updateData.endTime) {
      if (updateData.endTime <= updateData.startTime) {
        throw new Error("End time must be after start time");
      }
    }

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
};
