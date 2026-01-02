
// import router
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { generateTicket } from "../controllers/ticket.controller.ts";

export const ticketRouter = Router();


// Ticket generation route
ticketRouter.post("/generate", authMiddleware, generateTicket);