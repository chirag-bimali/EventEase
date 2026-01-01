
import type { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service.js";
import { generateTicketSchema } from "../schemas/ticket.schema.js";


// Ticket Generation Controller
export const generateTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = generateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid ticket generation data",
        errors: parsed.error.issues,
      });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ticket = await ticketService.generateTicket(
      parsed.data.ticketGroupId,
      userId,
      parsed.data.seatNumber
    );

    return res.status(201).json(ticket);
  } catch (error: any) {
    if (
      error.message.includes("not found") ||
      error.message.includes("not available") ||
      error.message.includes("sold")
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};