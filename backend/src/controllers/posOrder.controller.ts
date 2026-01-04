import type { Request, Response, NextFunction } from "express";
import { posOrderService } from "../services/posOrder.service.ts";
import { createPosOrderSchema } from "../schemas/posOrder.schema.ts";

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
    const orderId = parseInt(req.params.orderId as string, 10);
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
    const orderId = parseInt(req.params.orderId as string, 10);
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


export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const searchQuery = req.query.search as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    
    const params: {
      eventId?: number;
      paymentStatus?: string;
      searchQuery?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {};

    if (eventId !== undefined) params.eventId = eventId;
    if (paymentStatus !== undefined) params.paymentStatus = paymentStatus;
    if (searchQuery !== undefined) params.searchQuery = searchQuery;
    if (startDate !== undefined) params.startDate = startDate;
    if (endDate !== undefined) params.endDate = endDate;
    // include pagination even if defaults
    params.page = page;
    params.limit = limit;

    const result = await posOrderService.getAllOrders(params);
    
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSalesStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const statsParams: {
      eventId?: number;
      startDate?: Date;
      endDate?: Date;
    } = {};
    if (eventId !== undefined) statsParams.eventId = eventId;
    if (startDate !== undefined) statsParams.startDate = startDate;
    if (endDate !== undefined) statsParams.endDate = endDate;
    
    const stats = await posOrderService.getSalesStats(statsParams);
    
    return res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = parseInt(req.params.orderId as string, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const result = await posOrderService.deleteOrder(orderId);
    return res.json(result);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Cannot delete")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const refundOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = parseInt(req.params.orderId as string, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await posOrderService.refundOrder(orderId);
    return res.json(order);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Only paid")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};