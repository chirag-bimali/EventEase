// import router
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import {
  createGeneralOrQueueTicket,
  createSeatTicket,
  // generateTicket,
  getAllTickets,
  getTicketStats,
} from "../controllers/ticket.controller.ts";

export const ticketRouter = Router();

// Get all tickets with filters
ticketRouter.get("/", authMiddleware, getAllTickets);

// Get ticket statistics
ticketRouter.get("/stats", authMiddleware, getTicketStats);

ticketRouter.post("/seat", authMiddleware, createSeatTicket);
ticketRouter.post(
  "/general-or-queue",
  authMiddleware,
  createGeneralOrQueueTicket,
);

// Ticket generation route
// ticketRouter.post("/generate", authMiddleware, generateTicket);
