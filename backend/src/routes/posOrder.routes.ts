import { Router } from "express";
import { createPosOrder, confirmOrderPayment, getOrder } from "../controllers/posOrder.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const posOrderRouter = Router();
posOrderRouter.post("/", authMiddleware, createPosOrder);
posOrderRouter.post("/:orderId/confirm", authMiddleware, confirmOrderPayment);
posOrderRouter.get("/:orderId", authMiddleware, getOrder);