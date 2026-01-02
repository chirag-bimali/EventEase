import { Router } from "express";
import { createSeatHolds, releaseSeatHolds } from "../controllers/seatHold.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

export const seatHoldRouter = Router();
seatHoldRouter.post("/", authMiddleware, createSeatHolds);
seatHoldRouter.delete("/", authMiddleware, releaseSeatHolds);