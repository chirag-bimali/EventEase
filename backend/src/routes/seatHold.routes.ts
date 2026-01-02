import { Router } from "express";
import { createSeatHolds, releaseSeatHolds } from "../controllers/seatHold.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const seatHoldRouter = Router();
seatHoldRouter.post("/", authMiddleware, createSeatHolds);
seatHoldRouter.delete("/", authMiddleware, releaseSeatHolds);