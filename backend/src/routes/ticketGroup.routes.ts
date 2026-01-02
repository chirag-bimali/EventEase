import { Router } from "express";
import { createTicketGroup, deleteTicketGroup, getTicketGroupsByEvent, updateTicketGroup, getTicketGroupAvailability, getSeatLayout } from "../controllers/ticketGroup.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const ticketGroupRouter = Router();
// Ticket group routes
ticketGroupRouter.post("/", authMiddleware, createTicketGroup);
ticketGroupRouter.get("/event/:eventId", getTicketGroupsByEvent);
ticketGroupRouter.get("/:id/availability", getTicketGroupAvailability);
ticketGroupRouter.delete("/:id", authMiddleware, deleteTicketGroup);
ticketGroupRouter.patch("/:id", authMiddleware, updateTicketGroup);
ticketGroupRouter.get("/:id/layout", getSeatLayout);