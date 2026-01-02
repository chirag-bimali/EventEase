import type { Ticket } from "./ticket.types";

export const SeatType = {
  GENERAL: "GENERAL",
  QUEUE: "QUEUE",
  SEAT: "SEAT",
} as const;
export type SeatType = (typeof SeatType)[keyof typeof SeatType];

export interface SeatingConfig {
  row: string;
  columns: number;
}

// TicketGroup (Read)
export interface TicketGroup {
  id: number;
  eventId: number;
  name: string;
  description?: string;
  price: number;
  seatType: SeatType;
  prefixFormat?: string;
  quantity?: number;
  seatingConfig?: SeatingConfig[] | string | null; // backend may return JSON string; UI normalizes to SeatingConfig[]
  totalSeats?: number;
  tickets?: Ticket[];
  createdAt: string;
  updatedAt: string;
}

// Create TicketGroup request
export interface CreateTicketGroupDTO {
  eventId: number;
  name: string;
  description?: string;
  price: number;
  seatType: SeatType;
  prefixFormat?: string;
  quantity?: number;
  seatingConfig?: SeatingConfig[]; // For SEAT only
}

// Update TicketGroup request
export interface UpdateTicketGroupDTO {
  name?: string;
  description?: string;
  price?: number;
  seatType: SeatType;
  prefixFormat?: string;
  quantity?: number;
  seatingConfig?: SeatingConfig[];
}

// Delete TicketGroup response
export interface DeleteTicketGroupResponse {
  success: boolean;
  message: string;
  id?: number;
}


// TicketGroup query options
export interface TicketGroupQueryParams {
  eventId?: number;
  seatType?: SeatType;
  sortBy?: "createdAt" | "price" | "name";
  order?: "asc" | "desc";
}

// TicketGroup availability response
export interface TicketGroupAvailability {
  available: number; // -1 means unlimited
  sold: number;
  total: number; // -1 means unlimited
}


export interface SeatLayoutRow {
  row: string;
  seats: SeatInfo[];
}

export interface SeatInfo {
  seatNumber: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
}

export interface SeatLayout {
  ticketGroupId: number;
  rows: SeatLayoutRow[];
}