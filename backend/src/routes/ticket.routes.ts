
// import router
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { generateTicket, getAllTickets, getTicketStats } from "../controllers/ticket.controller.ts";

export const ticketRouter = Router();


// Get all tickets with filters
ticketRouter.get("/", authMiddleware, getAllTickets);

// Get ticket statistics
ticketRouter.get("/stats", authMiddleware, getTicketStats);



// Ticket generation route
ticketRouter.post("/generate", authMiddleware, generateTicket);