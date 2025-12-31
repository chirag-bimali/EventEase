import type { Request, Response, NextFunction } from "express";
import { eventService } from "../services/event.service.js";
import {
  createEventSchema,
  updateEventSchema,
  createTicketGroupSchema,
} from "../schemas/event.schema.js";

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid event data", errors: parsed.error.issues });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await eventService.createEvent(parsed.data, userId);
    return res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await eventService.getAllEvents();
    return res.json(events);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await eventService.getEventById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid event data", errors: parsed.error.issues });
    }

    const event = await eventService.updateEvent(id, parsed.data);
    return res.json(event);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    await eventService.deleteEvent(id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Ticket Group Controllers
export const createTicketGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = createTicketGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid ticket group data",
        errors: parsed.error.issues,
      });
    }

    const ticketGroup = await eventService.createTicketGroup(parsed.data);
    return res.status(201).json(ticketGroup);
  } catch (error) {
    next(error);
  }
};

export const getTicketGroupsByEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const ticketGroups = await eventService.getTicketGroupsByEvent(eventId);
    return res.json(ticketGroups);
  } catch (error) {
    next(error);
  }
};

export const deleteTicketGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "Ticket group ID is required" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ticket group ID" });
    }

    await eventService.deleteTicketGroup(id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
