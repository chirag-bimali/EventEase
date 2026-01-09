import { Router } from "express";
import { createSeatHolds, releaseSeatHolds, getSeatHoldsByTicketGroup, getSeatHoldsByUser } from "../controllers/seatHold.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

export const seatHoldRouter = Router();
seatHoldRouter.get("/by-ticket-group/:ticketGroupId", authMiddleware, getSeatHoldsByTicketGroup);
seatHoldRouter.get("/by-user", authMiddleware, getSeatHoldsByUser);
seatHoldRouter.post("/", authMiddleware, createSeatHolds);
seatHoldRouter.delete("/", authMiddleware, releaseSeatHolds);