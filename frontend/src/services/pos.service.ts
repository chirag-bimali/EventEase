import axiosInstance from "../lib/axios";
import type { PosOrder, CreatePosOrderRequest } from "../types/posOrder.types";
import type { SeatHold, CreateSeatHoldRequest } from "../types/seatHold.types";
import type { SeatLayout } from "../types/ticketGroup.types";

export const posService = {
  async getSeatLayout(ticketGroupId: number): Promise<SeatLayout> {
    const response = await axiosInstance.get(`/ticket-groups/${ticketGroupId}/layout`);
    return response.data;
  },
  async getSeatHoldsByTicketGroup(ticketGroupId: number): Promise<SeatHold[]> {
    const response = await axiosInstance.get(`/seat-holds/by-ticket-group/${ticketGroupId}`);
    return response.data;
  },

  async createSeatHolds(data: CreateSeatHoldRequest): Promise<SeatHold[]> {
    const response = await axiosInstance.post("/seat-holds", data);
    return response.data;
  },

  async releaseSeatHolds(ticketGroupId: number, seatNumbers: string[]): Promise<void> {
    await axiosInstance.delete("/seat-holds", {
      data: { ticketGroupId, seatNumbers },
    });
  },

  async createOrder(data: CreatePosOrderRequest): Promise<PosOrder> {
    const response = await axiosInstance.post("/pos-orders", data);
    return response.data;
  },

  async confirmPayment(orderId: number): Promise<PosOrder> {
    const response = await axiosInstance.post(`/pos-orders/${orderId}/confirm`);
    return response.data;
  },

  async getOrder(orderId: number): Promise<PosOrder> {
    const response = await axiosInstance.get(`/pos-orders/${orderId}`);
    return response.data;
  },
};