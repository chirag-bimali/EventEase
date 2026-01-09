import jwt from "jsonwebtoken";
import { prisma } from "../lib/primsa.ts";
import type { Event, Ticket, TicketGroup } from "../generated/prisma/index.js";
import { group } from "node:console";

const QR_SECRET = process.env.QR_SECRET || process.env.JWT_SECRET;
if (!QR_SECRET) throw new Error("QR_SECRET or JWT_SECRET not set");

// Token expiration: 1 year (covers most event periods)
const TOKEN_EXPIRY = "365d";

export const qrTokenService = {
  generateQRToken(ticketData: {
    ticketId: number;
    eventId: number;
    orderId: number;
    seatNumber: string;
    ticketGroupId: number;
  }): string {
    const token = jwt.sign(
      {
        ticketId: ticketData.ticketId,
        eventId: ticketData.eventId,
        orderId: ticketData.orderId,
        seatNumber: ticketData.seatNumber,
        ticketGroupId: ticketData.ticketGroupId,
        type: "ticket_validation",
      },
      QR_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    return token;
  },

  verifyQRToken(token: string): {
    ticketId: number;
    eventId: number;
    orderId: number;
    seatNumber: string;
    ticketGroupId: number;
    type: string;
    iat: number;
    exp: number;
  } | null {
    try {
      const decoded = jwt.verify(token, QR_SECRET) as any;
      if (decoded.type !== "ticket_validation") {
        return null;
      }
      return decoded;
    } catch (error) {
      return null; // Token invalid or expired
    }
  },

  async validateTicket(
    qrToken: string,
    validatorUserId: number
  ): Promise<{
    success: boolean;
    message: string;
    ticketData?: any;
  }> {
    // 1. Verify token signature and expiry
    const decodedToken = this.verifyQRToken(qrToken);
    if (!decodedToken) {
      return {
        success: false,
        message: "Invalid or expired QR code",
      };
    }

    // 2. Fetch ticket from database
    const ticketsOnly = await prisma.$queryRaw<Ticket[]>`
      SELECT * FROM Ticket
      WHERE id = ${decodedToken.ticketId}
    `;

    if (ticketsOnly.length === 0) {
      return {
        success: false,
        message: "Ticket not found",
      };
    }

    const ticketOnly = ticketsOnly[0];
    if (ticketOnly === undefined) {
      return {
        success: false,
        message: "Ticket not found",
      };
    }

    const ticketGroupsOnly = await prisma.$queryRaw<TicketGroup[]>`
      SELECT * FROM TicketGroup
      WHERE id = ${decodedToken.ticketGroupId}
    `;

    if (ticketGroupsOnly.length === 0) {
      return {
        success: false,
        message: "Ticket not found",
      };
    }
    const ticketGroupOnly = ticketGroupsOnly[0];
    if (ticketGroupOnly === undefined) {
      return {
        success: false,
        message: "Ticket not found",
      };
    }

    const eventsOnly = await prisma.$queryRaw<Event[]>`
      SELECT * FROM Event
      WHERE id = ${ticketGroupOnly.eventId}
    `;
    if (eventsOnly.length === 0) {
      return {
        success: false,
        message: "Ticket not found",
      };
    }
    const eventOnly = eventsOnly[0];
    if (eventOnly === undefined) {
      return {
        success: false,
        message: "Ticket not found",
      };
    }


    const ticket: Ticket & {
      ticketGroup: TicketGroup & {
        event: Event;
      };
    } = {
      ...ticketOnly,
      ticketGroup: { ...ticketGroupOnly, event: eventOnly },
    };

    if (!ticket) {
      return {
        success: false,
        message: "Ticket not found",
      };
    }

    // 3. Check if ticket already validated
    if (ticket.validatedAt) {
      return {
        success: false,
        message: `Ticket already validated on ${new Date(
          ticket.validatedAt
        ).toLocaleString()}`,
      };
    }

    // 4. Verify ticket is SOLD
    if (ticket.status !== "SOLD") {
      return {
        success: false,
        message: `Ticket status is ${ticket.status}, cannot validate`,
      };
    }

    // 5. Verify token data matches database
    if (ticket.id !== decodedToken.ticketId) {
      return {
        success: false,
        message: "QR code does not match this ticket",
      };
    }

    // 6. Update ticket with validation
    await prisma.$executeRaw`
      UPDATE Ticket
      SET validatedAt = ${new Date()},
          validatedById = ${validatorUserId},
          status = 'USED'
      WHERE id = ${ticket.id}
    `;
    return {
      success: true,
      message: "Ticket validated successfully",
      ticketData: {
        ticketId: ticket.id,
        groupName: ticket.ticketGroup.name,
        eventName: ticket.ticketGroup.event.name,
        seatNumber: ticket.seatNumber,
        validatedAt: new Date(),
      },
    };
  },
};
