import type { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service.ts";
import {
  generateTicketSchema,
  batchGenerateTicketsSchema,
  createSeatTicketSchema,
  createGeneralOrQueueTicketSchema,
} from "../schemas/ticket.schema.ts";
import { TicketStatus } from "../generated/prisma/edge.js";

export const createSeatTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createSeatTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid seat ticket data",
        errors: parsed.error.issues,
      });
    }
    const userId = (req as any).user?.userId;

    const ticket = await ticketService.createSeatTicket(parsed.data, userId);

    return res.status(201).json(parsed.data);
    // return res.status(201).json(ticket);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
    // next(error);
  }
};

export const createGeneralOrQueueTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createGeneralOrQueueTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid general or queue ticket data",
        errors: parsed.error.issues,
      });
    }
    const userId = (req as any).user?.userId;

    await ticketService.createGeneralOrQueueTickets(
      parsed.data.ticketGroupId,
      parsed.data.quantity,
      userId,
    );

    return res.status(201).json({
      message: `${parsed.data.quantity} tickets created successfully`,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Ticket Generation Controller
// export const generateTicket = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const parsed = generateTicketSchema.safeParse(req.body);
//     if (!parsed.success) {
//       return res.status(400).json({
//         message: "Invalid ticket generation data",
//         errors: parsed.error.issues,
//       });
//     }

//     const userId = (req as any).user?.userId;
//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const ticket = await ticketService.generateTicket(
//       parsed.data.ticketGroupId,
//       userId,
//       parsed.data.seatNumber,
//     );

//     return res.status(201).json(ticket);
//   } catch (error: any) {
//     if (
//       error.message.includes("not found") ||
//       error.message.includes("not available") ||
//       error.message.includes("sold")
//     ) {
//       return res.status(400).json({ message: error.message });
//     }
//     next(error);
//   }
// };

// export const batchGenerateTickets = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const parsed = batchGenerateTicketsSchema.safeParse(req.body);
//     if (!parsed.success) {
//       return res.status(400).json({
//         message: "Invalid batch ticket generation data",
//         errors: parsed.error.issues,
//       });
//     }

//     const userId = (req as any).user?.userId;
//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const tickets = await ticketService.batchGenerateTickets(
//       parsed.data.ticketGroupId,
//       userId,
//       parsed.data.seatType,
//       parsed.data.quantity,
//       parsed.data.seatNumbers,
//     );

//     return res.status(201).json(tickets);
//   } catch (error: any) {
//     if (
//       error.message.includes("not found") ||
//       error.message.includes("not available") ||
//       error.message.includes("sold") ||
//       error.message.includes("limit")
//     ) {
//       return res.status(400).json({ message: error.message });
//     }
//     next(error);
//   }
// };

export const getAllTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const status = req.query.status as TicketStatus | undefined;
    const searchQuery = req.query.search as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const queryParams: {
      eventId?: number;
      status?: TicketStatus;
      searchQuery?: string;
      page?: number;
      limit?: number;
    } = {};
    if (eventId !== undefined) queryParams.eventId = eventId;
    if (status !== undefined) queryParams.status = status;
    if (searchQuery !== undefined) queryParams.searchQuery = searchQuery;
    queryParams.page = page;
    queryParams.limit = limit;

    const result = await ticketService.getAllTickets(queryParams);

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTicketStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const stats = await ticketService.getTicketStats(eventId);
    return res.json(stats);
  } catch (error) {
    next(error);
  }
};
