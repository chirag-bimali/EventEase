import z from "zod";

export const generateTicketSchema = z.object({
  ticketGroupId: z.number().int().positive(),
  seatNumber: z.string().optional(), // Required for SEAT type, optional for QUEUE/GENERAL
});

export type GenerateTicketDTO = z.infer<typeof generateTicketSchema>;