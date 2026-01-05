import axiosInstance from "../lib/axios";
import type {
  Event,
  CreateEventDTO,
  UpdateEventDTO,
} from "../types/event.types";

import type { TicketGroup, CreateTicketGroupDTO } from "../types/ticketGroup.types";

export const eventService = {
  async getAllEvents(): Promise<Event[]> {
    const response = await axiosInstance.get("/events");
    return response.data;
  },

  async getEventById(id: number): Promise<Event> {
    const response = await axiosInstance.get(`/events/${id}`);
    return response.data;
  },

  async createEvent(data: CreateEventDTO): Promise<Event> {
    const response = await axiosInstance.post("/events", data);
    return response.data;
  },

  async updateEvent(
    id: number,
    data: UpdateEventDTO
  ): Promise<number> {
    const response = await axiosInstance.patch(`/events/${id}`, data);
    return response.data;
  },

  async uploadEventImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("image", file);
    
    const response = await axiosInstance.post("/events/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async deleteEvent(id: number): Promise<void> {
    await axiosInstance.delete(`/events/${id}`);
  },

  async createTicketGroup(
    data: CreateTicketGroupDTO
  ): Promise<TicketGroup> {
    const response = await axiosInstance.post("/events/ticket-groups", data);
    return response.data;
  },

  async getTicketGroupsByEvent(eventId: number): Promise<TicketGroup[]> {
    const response = await axiosInstance.get(
      `/events/${eventId}/ticket-groups`
    );
    return response.data;
  },

  async deleteTicketGroup(id: number): Promise<void> {
    await axiosInstance.delete(`/events/ticket-groups/${id}`);
  },
};
