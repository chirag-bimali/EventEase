import z from "zod";
import { EventStatus } from "../generated/prisma/index.js";

const EventStatusEnum = z.enum(Object.values(EventStatus));

export const getAllEventsQuerySchema = z
  .object({
    status: z
      .union([EventStatusEnum, z.array(EventStatusEnum)])
      .transform((val) => (Array.isArray(val) ? val : [val]))
      .optional(),
    statusNot: z
      .union([EventStatusEnum, z.array(EventStatusEnum)])
      .transform((val) => (Array.isArray(val) ? val : [val]))
      .optional(),
    name: z.string().min(1).optional(),
    startFrom: z.coerce.date().optional(),
    startTo: z.coerce.date().optional(),
  })
  .refine((data) => !(data.status && data.statusNot), {
    message: "Cannot use both status and statusNot at the same time",
    path: ["status"],
  })
  .refine(
    (data) => {
      if (data.startFrom && data.startTo) {
        return data.startFrom <= data.startTo;
      }
      return true;
    },
    {
      message: "startFrom must be before or equal to startTo",
      path: ["startFrom"],
    },
  );

export type GetAllEventsQuery = z.infer<typeof getAllEventsQuerySchema>;

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
    status: EventStatusEnum.optional().default("DRAFT"),
  })
  .superRefine((data, ctx) => {
    const hasStart = data.startTime !== undefined;
    const hasEnd = data.endTime !== undefined;

    // Rule 1: both-or-none
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        path: ["startTime"],
        expected: "date",
        message: "startTime and endTime must be provided together",
        code: "invalid_type",
      });

      ctx.addIssue({
        path: ["endTime"],
        expected: "date",
        message: "startTime and endTime must be provided together",
        code: "invalid_type",
      });
      return;
    }

    if (hasStart && hasEnd) {
      if (new Date(data.startTime!) >= new Date(data.endTime!)) {
        ctx.addIssue({
          path: ["endTime"],
          message: "endTime must be greater than startTime",
          code: "custom",
        });
      }
    }
  });

export const updateEventSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    venue: z.string().min(1).optional(),
    startTime: optionalDateTime,
    endTime: optionalDateTime,
    imageUrl: z.string().optional(),
    status: EventStatusEnum.optional(),
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
    },
  );

export type CreateEventDTO = z.infer<typeof createEventSchema>;
export type UpdateEventDTO = z.infer<typeof updateEventSchema>;
