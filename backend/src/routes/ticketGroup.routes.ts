import { Router } from "express";
import { createTicketGroup, deleteTicketGroup, getTicketGroupsByEvent, updateTicketGroup, getTicketGroupAvailability, getSeatLayout } from "../controllers/ticketGroup.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.ts";

export const ticketGroupRouter = Router();
// Ticket group routes
ticketGroupRouter.post("/", authMiddleware, adminAuthMiddleware, createTicketGroup);
ticketGroupRouter.get("/event/:eventId", getTicketGroupsByEvent);
ticketGroupRouter.get("/:id/availability", getTicketGroupAvailability);
ticketGroupRouter.delete("/:id", authMiddleware, adminAuthMiddleware, deleteTicketGroup);
ticketGroupRouter.patch("/:id", authMiddleware, adminAuthMiddleware, updateTicketGroup);
ticketGroupRouter.get("/:id/layout", getSeatLayout);