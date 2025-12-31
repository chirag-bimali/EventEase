import { Router } from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  createTicketGroup,
  getTicketGroupsByEvent,
  deleteTicketGroup,
} from "../controllers/event.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const eventRouter = Router();

// Event routes
eventRouter.get("/", getAllEvents);
eventRouter.get("/:id", getEventById);
eventRouter.post("/", authMiddleware, createEvent);
eventRouter.patch("/:id", authMiddleware, updateEvent);
eventRouter.delete("/:id", authMiddleware, deleteEvent);
// Ticket group routes
eventRouter.post("/ticket-groups", authMiddleware, createTicketGroup);
eventRouter.get("/:eventId/ticket-groups", getTicketGroupsByEvent);
eventRouter.delete("/ticket-groups/:id", authMiddleware, deleteTicketGroup);