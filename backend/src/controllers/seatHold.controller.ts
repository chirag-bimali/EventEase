import type { Request, Response, NextFunction } from "express";
import { seatHoldService } from "../services/seatHold.service.js";
import { createSeatHoldSchema } from "../schemas/seatHold.schema.js";

export const createSeatHolds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = createSeatHoldSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid seat hold data",
        errors: parsed.error.issues,
      });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const holds = await seatHoldService.createHolds(
      parsed.data.ticketGroupId,
      parsed.data.seatNumbers,
      userId,
      parsed.data.durationMinutes
    );

    return res.status(201).json(holds);
  } catch (error: any) {
    if (
      error.message.includes("not found") ||
      error.message.includes("already sold") ||
      error.message.includes("do not exist")
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const releaseSeatHolds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ticketGroupId, seatNumbers } = req.body;

    if (!ticketGroupId || !seatNumbers || !Array.isArray(seatNumbers)) {
      return res.status(400).json({
        message: "ticketGroupId and seatNumbers array are required",
      });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await seatHoldService.releaseHolds(
      ticketGroupId,
      seatNumbers,
      userId
    );

    return res.json(result);
  } catch (error: any) {
    if (error.message.includes("No holds found")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};