import { useState } from "react";
import type { PosOrder } from "../types/posOrder.types";
import type { CreatePosOrderRequest } from "../types/posOrder.types";
import { posService } from "../services/pos.service";

export const usePOS = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create POS order
  const createOrder = async (
    orderData: CreatePosOrderRequest,
  ): Promise<PosOrder | null> => {
    try {
      setLoading(true);
      setError(null);
      const order = await posService.createOrder(orderData);
      return order;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create order";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment
  const confirmPayment = async (orderId: number): Promise<PosOrder | null> => {
    try {
      setLoading(true);
      setError(null);
      const order = await posService.confirmPayment(orderId);
      return order;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm payment";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get order details
  const getOrder = async (orderId: number): Promise<PosOrder | null> => {
    try {
      setLoading(true);
      setError(null);
      const order = await posService.getOrder(orderId);
      return order;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch order";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createOrder,
    confirmPayment,
    getOrder,
  };
};
