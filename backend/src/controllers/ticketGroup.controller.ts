import type { Request, Response, NextFunction } from "express";
import * as ticketGroupService from "../services/ticketGroup.service.ts";
import {
  createTicketGroupSchema,
  updateTicketGroupSchema,
} from "../schemas/ticketGroup.schema.ts";
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

    const ticketGroup =
      await ticketGroupService.ticketGroupService.createTicketGroup(
        parsed.data
      );
    return res.status(201).json(ticketGroup);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
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

    const ticketGroups =
      await ticketGroupService.ticketGroupService.getTicketGroupsByEvent(
        eventId
      );
    return res.json(ticketGroups);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
// create update ticket group
export const updateTicketGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.params.id) {
    return res.status(400).json({ message: "Ticket group ID is required" });
  }
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ticket group ID" });
  }
  try {
    const parsed = updateTicketGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid ticket group data",
        errors: parsed.error.issues,
      });
    }

    const filteredData = Object.fromEntries(
      Object.entries(parsed.data).filter(([, value]) => value !== undefined)
    );
    const ticketGroup =
      await ticketGroupService.ticketGroupService.updateTicketGroup(
        id,
        filteredData
      );
    return res.json(ticketGroup);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
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

    await ticketGroupService.ticketGroupService.deleteTicketGroup(id);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const getTicketGroupAvailability = async (
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

    const availability =
      await ticketGroupService.ticketGroupService.getTicketGroupAvailability(
        id
      );
    return res.json(availability);
  } catch (error) {
    next(error);
  }
};

export const getSeatLayout = async (
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

    const layout = await ticketGroupService.ticketGroupService.getSeatLayout(
      id
    );
    return res.json(layout);
  } catch (error) {
    next(error);
  }
};
