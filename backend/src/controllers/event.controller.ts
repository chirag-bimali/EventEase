import type { Request, Response, NextFunction } from "express";
import type { MulterRequest } from "../middlewares/upload.middleware.js";
import { eventService } from "../services/event.service.js";
import {
  createEventSchema,
  updateEventSchema,
} from "../schemas/event.schema.js";
import { parse } from "path";

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

    // const event = await eventService.getEventById(id);
    const event = await eventService.updateEvent(id, parsed.data);
    return res.json(event);
  } catch (error) {
    // If the error is due to business logic (e.g., event not found), it should be handled in the service
    // send a generic error message otherwise
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

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

export const uploadEventImage = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Return the URL path to access the uploaded image
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.json({ imageUrl });
  } catch (error) {
    next(error);
  }
};
