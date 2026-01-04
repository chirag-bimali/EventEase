import jwt from "jsonwebtoken";
import { prisma } from "../lib/primsa.ts";

const QR_SECRET = process.env.QR_SECRET || process.env.JWT_SECRET;
if (!QR_SECRET) throw new Error("QR_SECRET or JWT_SECRET not set");

// Token expiration: 1 year (covers most event periods)
const TOKEN_EXPIRY = "365d";

export const qrTokenService = {
  /**
   * Generate a signed JWT token for a ticket
   * Token contains: ticketId, eventId, orderId, seatNumber
   * Frontend will convert this to QR code for printing
   */
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

  /**
   * Verify and decode a QR token
   * Returns decoded token payload or null if invalid
   */
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

  /**
   * Validate a ticket using the QR token
   * Marks ticket as validated and records validator
   */
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
    const ticket = await prisma.ticket.findUnique({
      where: { id: decodedToken.ticketId },
      include: {
        ticketGroup: { include: { event: true } },
        orderItem: true,
      },
    });

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
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        validatedAt: new Date(),
        validatedById: validatorUserId,
        status: "SOLD", // Keep as SOLD, but now with validatedAt timestamp
      },
      include: {
        ticketGroup: { include: { event: true } },
      },
    });

    return {
      success: true,
      message: "Ticket validated successfully",
      ticketData: {
        ticketId: updatedTicket.id,
        seatNumber: updatedTicket.seatNumber,
        eventName: updatedTicket.ticketGroup.event.name,
        groupName: updatedTicket.ticketGroup.name,
        validatedAt: updatedTicket.validatedAt,
      },
    };
  },
};