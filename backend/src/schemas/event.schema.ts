import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Description is required"),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  imageUrl: z.string().url().optional(),
  venue: z.string().min(1, "Venue is required"),
});

export const updateEventSchema = createEventSchema.partial();

// Seating configuration for dynamic rows/columns
export const seatingRowSchema = z.object({
  row: z.string().min(1).max(5), // e.g., "A", "B", "VIP1"
  columns: z.number().int().positive().max(100), // Number of seats in this row
});

export const createTicketGroupSchema = z.object({
  eventId: z.number().int().positive(),
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  seatType: z.enum(['GENERAL', 'QUEUE', 'SEAT']),
  // For QUEUE type
  prefixFormat: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  // For SEAT type - Array of row configurations
  seatingConfig: z.array(seatingRowSchema).optional(),
});

export type CreateEventDTO = z.infer<typeof createEventSchema>;
export type UpdateEventDTO = z.infer<typeof updateEventSchema>;
export type SeatingRow = z.infer<typeof seatingRowSchema>;
export type CreateTicketGroupDTO = z.infer<typeof createTicketGroupSchema>;