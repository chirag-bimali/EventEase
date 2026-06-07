import type { Request, Response, NextFunction } from "express";
import type { MulterRequest } from "../middlewares/upload.middleware.ts";
import { eventService } from "../services/event.service.ts";
import fs from "fs";

import {
  createEventSchema,
  getAllEventsQuerySchema,
  updateEventSchema,
} from "../schemas/event.schema.ts";
import path, { parse } from "path";

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
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
  next: NextFunction,
) => {
  try {
    const parsed = getAllEventsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        errors: parsed.error.issues,
        message: "Invalid query parameters",
      });
    }

    const events = await eventService.getAllEvents(parsed.data);
    return res.json(events);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    if (Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await eventService.getEventById(eventId);
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
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    if (Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid event data", errors: parsed.error.issues });
    }

    // const event = await eventService.getEventById(id);
    const event = await eventService.updateEvent(eventId, parsed.data);
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
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    if (Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    await eventService.deleteEvent(eventId);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const uploadEventImage = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Return the URL path to access the uploaded image
    const nameWithoutExt = path.parse(req.file.filename).name;
    const imageUrl = `${process.env.EVENT_IMAGE_URL_BASE}/${nameWithoutExt}/image`;
    return res.json({ imageUrl });
  } catch (error) {
    next(error);
  }
};

export const getEventImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ message: "Filename is required" });
    }
    if (Array.isArray(filename)) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const fileName = parse(filename).base; // Sanitize the filename

    const files = fs.readdirSync(
      process.env.EVENTS_IMAGE_UPLOAD_PATH || "temp/uploads/events",
    );

    const match = files.find((f) => path.parse(f).name === fileName);

    if (match) {
      return res.sendFile(
        match,
        { root: process.env.EVENTS_IMAGE_UPLOAD_PATH },
        (err) => {
          if (err) {
            next(err);
          }
        },
      );
    }
  } catch (error) {
    next(error);
  }
};
