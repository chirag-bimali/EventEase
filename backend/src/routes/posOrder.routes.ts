import { Router } from "express";
import { createPosOrder, confirmOrderPayment, getOrder, getAllOrders, getSalesStats, refundOrder, deleteOrder } from "../controllers/posOrder.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

export const posOrderRouter = Router();


// Get all orders with filters
posOrderRouter.get("/", authMiddleware, getAllOrders);

// Get sales statistics
posOrderRouter.get("/stats", authMiddleware, getSalesStats);

// Get specific order
posOrderRouter.get("/:orderId", authMiddleware, getOrder);

// Create new order
posOrderRouter.post("/", authMiddleware, createPosOrder);

// Confirm payment
posOrderRouter.patch("/:orderId/confirm", authMiddleware, confirmOrderPayment);

// Refund order
posOrderRouter.patch("/:orderId/refund", authMiddleware, refundOrder);

// Delete order (only pending/failed)
posOrderRouter.delete("/:orderId", authMiddleware, deleteOrder);
