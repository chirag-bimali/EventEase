import type { TicketGroup } from "./ticketGroup.types";

export const EventStatus = {
  UPCOMING: "UPCOMING",
  AVAILABLE: "AVAILABLE",
  SOLD: "SOLD",
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

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

export interface EventWithRelations extends Event {
  ticketGroups: TicketGroup[];
}

export interface CreateEventDTO {
  name: string;
  description: string;
  startTime?: string;
  endTime?: string;
  imageUrl?: string;
  venue: string;
}

// Update Event request
export interface UpdateEventDTO {
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  imageUrl?: string;
  venue?: string;
  status?: EventStatus;
}
