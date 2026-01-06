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
    const q = await prisma.$executeRaw<Event[]>`
      INSERT INTO Event (name, description, venue, startTime, endTime, imageUrl, createdById, status, createdAt, updatedAt)
      VALUES (
        ${data.name},
        ${data.description},
        ${data.venue},
        ${data.startTime ? new Date(data.startTime) : null},
        ${data.endTime ? new Date(data.endTime) : null},
        ${data.imageUrl || null},
        ${userId},
        ${data.status || "DRAFT"},
        ${new Date()},
        ${new Date()}
      )
    `;
    return q;
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

  },

  async updateEvent(id: number, data: UpdateEventDTO) {
    // Check if event exists
    // const event = await prisma.event.findUnique({
    //   where: { id },
    //   include: {
    //     ticketGroups: {
    //       include: {
    //         tickets: {
    //           where: {
    //             status: { in: [TicketStatus.SOLD, TicketStatus.RESERVED] },
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    const events = await prisma.$queryRaw<Event[]>`
      SELECT * FROM Event
      WHERE id = ${id}
    `;
    if (events.length === 0) {
      throw new Error("Event not found");
    }
    const event = events[0]; 
    if (!event) {
      throw new Error("Event not found");
    }
    const ticketGroups = await prisma.$queryRaw<TicketGroup[]>`
      SELECT * FROM TicketGroup
      WHERE eventId = ${event.id}
    `;
    const ticketGroupsWithTickets: TicketGroupWithTickets[] = [];
    for (const ticketGroup of ticketGroups) {
      const tickets = await prisma.$queryRaw<Ticket[]>`
        SELECT * FROM Ticket
        WHERE ticketGroupId = ${ticketGroup.id}
      `;
      ticketGroupsWithTickets.push({
        ...ticketGroup,
        tickets: tickets,
      });
    }
    const eventWithRelations: EventWithTicketGroups = {
      ...event,
      ticketGroups: ticketGroupsWithTickets,
    };

    if (!eventWithRelations) {
      throw new Error("Event not found");
    }

    // Check if event has ended
    if (eventWithRelations.endTime && eventWithRelations.endTime < new Date()) {
      throw new Error("Cannot edit an event that has already ended");
    }

    // Check if tickets have been sold
    const hasSoldTickets = eventWithRelations.ticketGroups.some(
      (tg) => tg.tickets.length > 0
    );
    if (hasSoldTickets) {
      throw new Error("Cannot edit event with sold or reserved tickets");
    }

    // Check status change restrictions (can't go from SOLD_OUT to anything else)
    if (
      eventWithRelations.status === "SOLD_OUT" &&
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

    // Perform update
    const q = await prisma.$executeRaw<Event[]>`
      UPDATE Event
      SET
        name = ${updateData.name || eventWithRelations.name},
        description = ${updateData.description || eventWithRelations.description},
        venue = ${updateData.venue || eventWithRelations.venue},
        startTime = ${
          updateData.startTime !== undefined
            ? updateData.startTime
            : eventWithRelations.startTime
        },
        endTime = ${
          updateData.endTime !== undefined
            ? updateData.endTime
            : eventWithRelations.endTime
        },
        imageUrl = ${updateData.imageUrl || eventWithRelations.imageUrl},
        status = ${updateData.status || eventWithRelations.status},
        updatedAt = ${new Date()}
      WHERE id = ${id}
    `;
    return q;
  },

  async deleteEvent(id: number) {
    const q = await prisma.$executeRaw<Event[]>`
      DELETE FROM Event
      WHERE id = ${id}
    `;
    return q;
  },
};
