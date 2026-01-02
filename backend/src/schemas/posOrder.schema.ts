import z from "zod";

export const createPosOrderSchema = z.object({
  eventId: z.number().int().positive(),
  items: z.array(
    z.object({
      ticketGroupId: z.number().int().positive(),
      seatType: z.enum(["GENERAL", "QUEUE", "SEAT"]),
      quantity: z.number().int().positive().optional(),
      seatNumbers: z.array(z.string()).optional(),
      unitPrice: z.number().nonnegative(),
    })
  ),
  paymentMethod: z.enum(["CASH", "CARD", "ONLINE", "OTHER"]),
  buyerName: z.string().optional(),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  notes: z.string().optional(),
});

export type CreatePosOrderDTO = z.infer<typeof createPosOrderSchema>;
