import z from "zod";

export const createSeatHoldSchema = z.object({
  ticketGroupId: z.number().int().positive(),
  seatNumbers: z.array(z.string()).min(1),
  durationMinutes: z.number().int().positive().default(10), // 10 min default
});


export const releaseSeatHoldSchema = z.object({
  seatHoldId: z.number().int().positive(),
});

export type CreateSeatHoldDTO = z.infer<typeof createSeatHoldSchema>;

export type ReleaseSeatHoldDTO = z.infer<typeof releaseSeatHoldSchema>;