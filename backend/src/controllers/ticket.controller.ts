
import type { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service.ts";
import { generateTicketSchema, batchGenerateTicketsSchema } from "../schemas/ticket.schema.ts";


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

export const batchGenerateTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = batchGenerateTicketsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid batch ticket generation data",
        errors: parsed.error.issues,
      });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tickets = await ticketService.batchGenerateTickets(
      parsed.data.ticketGroupId,
      userId,
      parsed.data.seatType,
      parsed.data.quantity,
      parsed.data.seatNumbers
    );

    return res.status(201).json(tickets);
  } catch (error: any) {
    if (
      error.message.includes("not found") ||
      error.message.includes("not available") ||
      error.message.includes("sold") ||
      error.message.includes("limit")
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};