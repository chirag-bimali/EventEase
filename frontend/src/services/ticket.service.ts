import axiosInstance from "../lib/axios";
import type { Ticket } from "../types/ticket.types";

export interface TicketFilters {
  eventId?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketStats {
  total: number;
  sold: number;
  reserved: number;
  available: number;
}

export const ticketService = {
  async getAllTickets(filters?: TicketFilters): Promise<TicketListResponse> {
    const response = await axiosInstance.get("/tickets", { params: filters });
    return response.data;
  },

  async getTicketStats(eventId?: number): Promise<TicketStats> {
    const response = await axiosInstance.get("/tickets/stats", {
      params: { eventId }
    });
    return response.data;
  }
};