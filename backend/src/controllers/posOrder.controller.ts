import type { Request, Response, NextFunction } from "express";
import { posOrderService } from "../services/posOrder.service.js";
import { createPosOrderSchema } from "../schemas/posOrder.schema.js";

export const createPosOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = createPosOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid POS order data",
        errors: parsed.error.issues,
      });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const order = await posOrderService.createOrder(parsed.data, userId);
    return res.status(201).json(order);
  } catch (error: any) {
    if (
      error.message.includes("not found") ||
      error.message.includes("not available") ||
      error.message.includes("sold") ||
      error.message.includes("limit") ||
      error.message.includes("Failed to generate")
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const confirmOrderPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await posOrderService.confirmPayment(orderId);
    return res.json(order);
  } catch (error: any) {
    if (
      error.message.includes("not found") ||
      error.message.includes("already paid")
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await posOrderService.getOrderById(orderId);
    return res.json(order);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};