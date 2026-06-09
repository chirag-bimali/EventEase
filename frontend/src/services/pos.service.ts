import axiosInstance from "../lib/axios";
import type { PosOrder, CreatePosOrderRequest } from "../types/posOrder.types";
import type { SeatLayout } from "../types/ticketGroup.types";

export const posService = {
  async getSeatLayout(ticketGroupId: number): Promise<SeatLayout> {
    const response = await axiosInstance.get(`/ticket-groups/${ticketGroupId}/layout`);
    return response.data;
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
