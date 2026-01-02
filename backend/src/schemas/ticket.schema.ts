import z from "zod";

export const generateTicketSchema = z.object({
  ticketGroupId: z.number().int().positive(),
  seatNumber: z.string().optional(), // Required for SEAT type, optional for QUEUE/GENERAL
});

// Batch ticket generation
export const batchGenerateTicketsSchema = z.object({
  ticketGroupId: z.number().int().positive(),
  seatType: z.enum(["GENERAL", "QUEUE", "SEAT"]),
  // For QUEUE/GENERAL
  quantity: z.number().int().positive().optional(),
  // For SEAT
  seatNumbers: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.seatType === "SEAT") {
    return data.seatNumbers && data.seatNumbers.length > 0;
  }
  return data.quantity && data.quantity > 0;
});



export type GenerateTicketDTO = z.infer<typeof generateTicketSchema>;
export type BatchGenerateTicketsDTO = z.infer<typeof batchGenerateTicketsSchema>;