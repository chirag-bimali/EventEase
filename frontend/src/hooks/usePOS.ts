import { useCallback, useState } from "react";
import type { SeatLayout } from "../types/ticketGroup.types";
import type { SeatHold } from "../types/seatHold.types";
import type { PosOrder } from "../types/posOrder.types";
import type { CreatePosOrderRequest } from "../types/posOrder.types";
import { posService } from "../services/pos.service";
import axios from "axios";

export const usePOS = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get seat layout for a ticket group
  const getSeatLayout = useCallback(
    async (ticketGroupId: number): Promise<SeatLayout | null> => {
      try {
        setLoading(true);
        setError(null);
        const layout = await posService.getSeatLayout(ticketGroupId);
        return layout;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch seat layout";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create seat holds
  const createHolds = async (
    ticketGroupId: number,
    seatNumbers: string[],
    durationMinutes?: number
  ): Promise<SeatHold[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const holds = await posService.createSeatHolds({
        ticketGroupId,
        seatNumbers,
        durationMinutes,
      });
      return holds;
    } catch (err: unknown) {
      // check if the error is an AxiosError and has a response with data.message
      if(axios.isAxiosError(err) && err.response && err.response.data && typeof err.response.data.message === 'string') {
        setError(err.response.data.message);
        throw new Error(err.response.data.message);
      }
      const message =
        err instanceof Error ? err.message : "Failed to create seat holds";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };
  const getSeatHoldsByTicketGroup = async (
    ticketGroupId: number
  ): Promise<SeatHold[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const holds = await posService.getSeatHoldsByTicketGroup(ticketGroupId);
      return holds;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch seat holds";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  

  // Release seat holds
  const releaseHolds = async (
    ticketGroupId: number,
    seatNumbers: string[]
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await posService.releaseSeatHolds(ticketGroupId, seatNumbers);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to release seat holds";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create POS order
  const createOrder = async (
    orderData: CreatePosOrderRequest
  ): Promise<PosOrder | null> => {
    try {
      setLoading(true);
      setError(null);
      const order = await posService.createOrder(orderData);
      return order;
    } catch (err: unknown) {
      if(axios.isAxiosError(err) && err.response && err.response.data && typeof err.response.data.message === 'string') {
        setError(err.response.data.message);
        throw new Error(err.response.data.message);
      }
      const message = err instanceof Error ? err.message : "Failed to create order";
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
    getSeatLayout,
    createHolds,
    releaseHolds,
    createOrder,
    confirmPayment,
    getOrder,
    getSeatHoldsByTicketGroup,
  };
};
