export const EventStatus = {
  UPCOMING: "UPCOMING",
  AVAILABLE: "AVAILABLE",
  SOLD: "SOLD",
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const SeatType = {
  GENERAL: "GENERAL",
  QUEUE: "QUEUE",
  SEAT: "SEAT",
} as const;
export type SeatType = (typeof SeatType)[keyof typeof SeatType];

export const TicketStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export interface Event {
  id: number;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  venue: string;
  status: EventStatus;
  createdById: number;
  ticketGroups?: TicketGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketGroup {
  id: number;
  eventId: number;
  name: string;
  description?: string;
  price: number;
  seatType: SeatType;
  prefixFormat?: string;
  quantity?: number;
  rows?: string[];
  columns?: number;
  totalSeats?: number;
  tickets?: Ticket[];
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  ticketGroupId: number;
  seatNumber: string;
  status: TicketStatus;
  purchasedById?: number;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDTO {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  venue: string;
}

export interface CreateTicketGroupDTO {
  eventId: number;
  name: string;
  description?: string;
  price: number;
  seatType: SeatType;
  prefixFormat?: string;
  quantity?: number;
  rows?: string[];
  columns?: number;
}
