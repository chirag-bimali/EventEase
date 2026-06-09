import { TicketStatus } from "../generated/prisma/index.js";
import { prisma } from "../lib/primsa.ts";

export const RESERVATION_TTL_MS = 10 * 60 * 1000;

const reservationCutoff = () => new Date(Date.now() - RESERVATION_TTL_MS);

export const isReservationExpired = (reservedAt: Date | null | undefined) => {
  if (!reservedAt) return true;
  return Date.now() - reservedAt.getTime() > RESERVATION_TTL_MS;
};

/** Clear RESERVED tickets whose 10-minute hold has elapsed or have no timer set. */
export const releaseExpiredReservations = async (options?: {
  ticketGroupId?: number;
  eventId?: number;
}) => {
  const { ticketGroupId, eventId } = options ?? {};
  const scope = {
    ...(ticketGroupId ? { ticketGroupId } : {}),
    ...(eventId ? { ticketGroup: { eventId } } : {}),
  };

  return prisma.ticket.updateMany({
    where: {
      status: TicketStatus.RESERVED,
      ...scope,
      OR: [{ reservedAt: null }, { reservedAt: { lt: reservationCutoff() } }],
    },
    data: {
      status: TicketStatus.AVAILABLE,
      reservedById: null,
      reservedAt: null,
    },
  });
};

export const resolveTicketSeatStatus = (
  status: TicketStatus,
  reservedAt: Date | null | undefined,
): TicketStatus => {
  if (status === TicketStatus.RESERVED && isReservationExpired(reservedAt)) {
    return TicketStatus.AVAILABLE;
  }
  return status;
};

/** Start or extend a 10-minute hold for the given seats. */
export const resetReservationTimer = async (
  ticketGroupId: number,
  userId: number,
  seatNumbers: string[],
) => {
  const now = new Date();

  return prisma.ticket.updateMany({
    where: {
      ticketGroupId,
      seatNumber: { in: seatNumbers },
      status: TicketStatus.RESERVED,
      reservedById: userId,
    },
    data: {
      reservedAt: now,
      reservedById: userId,
    },
  });
};
