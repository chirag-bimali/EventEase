import z from "zod";

// Seating configuration for dynamic rows/columns
export const seatingRowSchema = z.object({
  row: z.string().min(1).max(5), // e.g., "A", "B", "VIP1"
  columns: z.number().int().positive().max(100), // Number of seats in this row
});

export const createTicketGroupSchema = z
  .object({
    eventId: z.number().int().positive(),
    name: z.string().min(1, "Group name is required"),
    description: z.string().optional(),
    price: z.number().nonnegative(),
    seatType: z.enum(["GENERAL", "QUEUE", "SEAT"]),
    // For QUEUE type
    prefixFormat: z.string().optional(),
    quantity: z.number().int().nonnegative().optional(),
    // For SEAT type - Array of row configurations
    seatingConfig: z.array(seatingRowSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.seatType === "SEAT") {
      if (!data.seatingConfig || data.seatingConfig.length === 0) {
        ctx.addIssue({
          code: "invalid_type",
          expected: "array",
          received: "undefined",
          message: "Seating configuration is required for SEAT type",
        });
      }
    }
    if (data.seatType === "QUEUE" || data.seatType === "GENERAL") {
      if (!data.prefixFormat) {
        ctx.addIssue({
          code: "invalid_type",
          expected: "string",
          received: "undefined",
          message: "Prefix format is required for QUEUE and GENERAL types",
        });
      }
    }
  });
export const updateTicketGroupSchema = createTicketGroupSchema.partial();

export type SeatingRow = z.infer<typeof seatingRowSchema>;
export type CreateTicketGroupDTO = z.infer<typeof createTicketGroupSchema>;
export type UpdateTicketGroupDTO = z.infer<typeof updateTicketGroupSchema>;