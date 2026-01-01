import axiosInstance from "../lib/axios";
import type {
  TicketGroup,
  CreateTicketGroupDTO,
  UpdateTicketGroupDTO,
  DeleteTicketGroupResponse,
  TicketGroupQueryParams,
  TicketGroupAvailability,
} from "../types/ticketGroup.types";

export const ticketGroupService = {
  /**
   * Create a new ticket group
   */
  async createTicketGroup(
    data: CreateTicketGroupDTO
  ): Promise<TicketGroup> {
    const payload = {
      ...data,
      seatingConfig: data.seatType === "SEAT" ? data.seatingConfig : undefined,
      prefixFormat: data.seatType !== "SEAT" ? data.prefixFormat : undefined,
    };
    const response = await axiosInstance.post("/ticket-groups", payload);
    return response.data;
  },

  /**
   * Get all ticket groups (optionally filtered)
   */
  async getAllTicketGroups(
    params?: TicketGroupQueryParams
  ): Promise<TicketGroup[]> {
    const response = await axiosInstance.get("/ticket-groups", { params });
    return response.data;
  },

  /**
   * Get a specific ticket group by ID
   */
  async getTicketGroupById(id: number): Promise<TicketGroup> {
    const response = await axiosInstance.get(`/ticket-groups/event/${id}`);
    return response.data;
  },

  /**
   * Get all ticket groups for a specific event
   */
  async getTicketGroupsByEventId(eventId: number): Promise<TicketGroup[]> {
    const response = await axiosInstance.get(
      `/ticket-groups/event/${eventId}`
    );
    return response.data;
  },

  /**
   * Update a ticket group
   */
  async updateTicketGroup(
    id: number,
    data: UpdateTicketGroupDTO
  ): Promise<TicketGroup> {
    const payload = {
      ...data,
      seatingConfig: data.seatType === "SEAT" ? data.seatingConfig : undefined,
      prefixFormat: data.seatType === "QUEUE" ? data.prefixFormat : undefined,
    };
    const response = await axiosInstance.patch(`/ticket-groups/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a ticket group
   */
  async deleteTicketGroup(id: number): Promise<DeleteTicketGroupResponse> {
    const response = await axiosInstance.delete(`/ticket-groups/${id}`);
    return response.data;
  },

  /**
   * Get ticket statistics for a ticket group
   */
  async getTicketGroupStats(
    id: number
  ): Promise<{
    totalSeats: number;
    availableSeats: number;
    reservedSeats: number;
    soldSeats: number;
  }> {
    const response = await axiosInstance.get(`/ticket-groups/${id}/stats`);
    return response.data;
  },

  /**
   * Get availability for a ticket group
   */
  async getTicketGroupAvailability(
    id: number
  ): Promise<TicketGroupAvailability> {
    const response = await axiosInstance.get(`/ticket-groups/${id}/availability`);
    return response.data;
  },

};
