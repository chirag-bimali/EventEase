import type { TicketGroup } from "./ticketGroup.types";

import z from "zod";

export const EventStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CANCELLED: "CANCELLED",
  SOLD: "SOLD",
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

const statusField = z
  .union([z.enum(EventStatus), z.array(z.nativeEnum(EventStatus))])
  .optional();

export const getAllEventsFiltersSchema = z.object({
  status: statusField,
  statusNot: statusField,
  name: z.string().min(1).optional(),
  startFrom: z.union([z.date(), z.coerce.date()]).optional(),
  startTo: z.union([z.date(), z.coerce.date()]).optional(),
});

export type GetAllEventsFilters = z.infer<typeof getAllEventsFiltersSchema>;

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
