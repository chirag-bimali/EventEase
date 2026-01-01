
// import router
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { generateTicket } from "../controllers/ticket.controller.js";

export const ticketRouter = Router();


// Ticket generation route
ticketRouter.post("/generate", authMiddleware, generateTicket);