import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import {
  validateTicket,
  getTicketStatus,
} from "../controllers/ticketValidation.controller.ts";

export const ticketValidationRouter = Router();

// Validate a ticket (mark as used/scanned)
// POST /api/tickets/validate
ticketValidationRouter.post(
  "/validate",
  authMiddleware,
  validateTicket
);

// Get ticket status without validating
// GET /api/tickets/status/:qrToken
ticketValidationRouter.get(
  "/status/:qrToken",
  getTicketStatus // No auth required for status check
);

export default ticketValidationRouter;