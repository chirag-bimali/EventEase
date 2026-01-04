export const TicketStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export interface Ticket {
  id: number;
  ticketGroupId: number;
  seatNumber: string;
  status: TicketStatus;
  purchasedById?: number;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;

  qrToken?: string; // JWT token for QR code
  validatedAt?: string;
  validatedBy?: number;
}

export interface TicketWithQR extends Ticket {
  qrDataUrl?: string; // Generated QR code image data URL
}
