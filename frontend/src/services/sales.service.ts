import axiosInstance from "../lib/axios";
import type { PosOrder } from "../types/posOrder.types";

export interface SalesFilters {
  eventId?: number;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SalesListResponse {
  orders: PosOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesStats {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  ticketsSold: number;
  totalRevenue: number;
  paidRevenue: number;
}

export const salesService = {
  async getAllOrders(filters?: SalesFilters): Promise<SalesListResponse> {
    const response = await axiosInstance.get("/pos-orders", { params: filters });
    return response.data;
  },

  async getSalesStats(filters?: { eventId?: number; startDate?: string; endDate?: string }): Promise<SalesStats> {
    const response = await axiosInstance.get("/pos-orders/stats", { params: filters });
    return response.data;
  },

  async getOrderById(orderId: number): Promise<PosOrder> {
    const response = await axiosInstance.get(`/pos-orders/${orderId}`);
    return response.data;
  },

  async deleteOrder(orderId: number): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/pos-orders/${orderId}`);
    return response.data;
  },

  async refundOrder(orderId: number): Promise<PosOrder> {
    const response = await axiosInstance.patch(`/pos-orders/${orderId}/refund`);
    return response.data;
  }
};