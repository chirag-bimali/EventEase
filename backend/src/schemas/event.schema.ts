import z from "zod";

// Transform empty strings to undefined for optional DateTime fields
const optionalDateTime = z
  .string()
  .optional()
  .transform((val) => (val === "" ? undefined : val));

export const createEventSchema = z
  .object({
    name: z.string().min(1, "Event name is required"),
    description: z.string().min(1, "Description is required"),
    venue: z.string().min(1, "Venue is required"),
    startTime: optionalDateTime,
    endTime: optionalDateTime,
    imageUrl: z.string().optional(),
    status: z
      .enum(["DRAFT", "PUBLISHED", "CANCELLED", "SOLD_OUT"])
      .optional()
      .default("DRAFT"),
  })
  .refine(
    (data) => {
      // If both times are provided, endTime must be after startTime
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const updateEventSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    venue: z.string().min(1).optional(),
    startTime: optionalDateTime,
    endTime: optionalDateTime,
    imageUrl: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "SOLD_OUT"]).optional(),
  })
  .refine(
    (data) => {
      // If both times are provided, endTime must be after startTime
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type CreateEventDTO = z.infer<typeof createEventSchema>;
export type UpdateEventDTO = z.infer<typeof updateEventSchema>;
