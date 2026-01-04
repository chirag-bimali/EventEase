import { prisma } from "../lib/primsa.ts";
import type {
  CreateEventDTO,
  UpdateEventDTO,
} from "../schemas/event.schema.ts";
import { SeatType, TicketStatus } from "../generated/prisma/client.js";
import type { TicketGroup, Event, Ticket } from "../generated/prisma/client.js";

type TicketGroupWithTickets = TicketGroup & {
  tickets: Ticket[];
};

type EventWithTicketGroups = Event & {
  ticketGroups: TicketGroupWithTickets[];
};

export const eventService = {
  // EVENT CRUD
  async createEvent(data: CreateEventDTO, userId: number) {
    // print start and end time
    return await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        venue: data.venue,
        ...(data.startTime && { startTime: new Date(data.startTime) }),
        ...(data.endTime && { endTime: new Date(data.endTime) }),
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
    // Get all events with their ticket groups and only AVAILABLE tickets
    const events = await prisma.$queryRaw<Event[]>`
    SELECT * FROM Event
    ORDER BY 
      CASE WHEN startTime IS NULL THEN 1 ELSE 0 END,
      startTime ASC
    `;
    // Get ticket groups and available tickets for each event
    const ticketGroups = await prisma.$queryRaw<TicketGroup[]>`
      SELECT * FROM TicketGroup
      WHERE eventId IN (${events.map((e) => e.id)})
    `;
    const ticketsAvailable = await prisma.$queryRaw<Ticket[]>`
      SELECT * FROM Ticket
      WHERE ticketGroupId IN (${ticketGroups.map((tg) => tg.id)})
        AND status = ${TicketStatus.AVAILABLE}
    `;
    
    // Attach tickets to their respective ticket groups
    const ticketGroupsWithTickets: TicketGroupWithTickets[] = ticketGroups.map(
      (tg) => ({
        ...tg,
        tickets: ticketsAvailable.filter(
          (ticket) => ticket.ticketGroupId === tg.id
        ),
      })
    );
    
    // Attach ticket groups to events
    const eventsWithTicketGroups: EventWithTicketGroups[] = events.map(
      (event) => ({
        ...event,
        ticketGroups: ticketGroupsWithTickets.filter(
          (tg) => tg.eventId === event.id
        ),
      })
    );
    return eventsWithTicketGroups;

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
    
    // Step 1: Get the specific event
    const events = await prisma.$queryRaw<Event[]>`
      SELECT * FROM Event
      WHERE id = ${id}
    `;

    if (events.length === 0) {
      return null;
    }

    const resultsWithRelations: EventWithTicketGroups[] = [];

    // Step 2: For each event, get its ticket groups
    for (const event of events) {
      const ticketGroups = await prisma.$queryRaw<TicketGroup[]>`
        SELECT * FROM TicketGroup
        WHERE eventId = ${event.id}
      `;

      const ticketGroupsWithTickets: TicketGroupWithTickets[] = [];

      // Step 3: For each ticket group, get only AVAILABLE tickets
      for (const ticketGroup of ticketGroups) {
        const tickets = await prisma.$queryRaw<Ticket[]>`
          SELECT * FROM Ticket
          WHERE ticketGroupId = ${ticketGroup.id}
            AND status = ${TicketStatus.AVAILABLE}
        `;

        // Create properly typed object
        ticketGroupsWithTickets.push({
          ...ticketGroup,
          tickets: tickets,
        });
      }

      // Create properly typed event with relations
      resultsWithRelations.push({
        ...event,
        ticketGroups: ticketGroupsWithTickets,
      });
    }

    return resultsWithRelations[0];

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
    if (
      event.status === "SOLD_OUT" &&
      data.status &&
      data.status !== "SOLD_OUT"
    ) {
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
