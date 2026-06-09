import axiosInstance from "../lib/axios";
import type {
  Event,
  CreateEventDTO,
  UpdateEventDTO,
  GetAllEventsFilters,
} from "../types/event.types";

import type {
  TicketGroup,
  CreateTicketGroupDTO,
} from "../types/ticketGroup.types";

export const eventService = {
  async getAllEvents(filters: GetAllEventsFilters = {}): Promise<Event[]> {
    const { status, statusNot, name, startFrom, startTo } = filters;

    const params = new URLSearchParams();

    // handles both single and array values
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      statuses.forEach((s) => params.append("status", s));
    }

    if (statusNot) {
      const statuses = Array.isArray(statusNot) ? statusNot : [statusNot];
      statuses.forEach((s) => params.append("statusNot", s));
    }

    if (name) params.set("name", name);
    if (startFrom) params.set("startFrom", new Date(startFrom).toISOString());
    if (startTo) params.set("startTo", new Date(startTo).toISOString());

    const queryString = params.toString();
    const response = await axiosInstance.get(
      queryString ? `/events?${queryString}` : "/events",
    );
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

  async updateEvent(id: number, data: UpdateEventDTO): Promise<number> {
    const response = await axiosInstance.patch(`/events/${id}`, data);
    return response.data;
  },

  async uploadEventImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await axiosInstance.post(
      "/events/upload-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  async deleteEvent(id: number): Promise<void> {
    await axiosInstance.delete(`/events/${id}`);
  },

  async createTicketGroup(data: CreateTicketGroupDTO): Promise<TicketGroup> {
    const response = await axiosInstance.post("/events/ticket-groups", data);
    return response.data;
  },

  async getTicketGroupsByEvent(eventId: number): Promise<TicketGroup[]> {
    const response = await axiosInstance.get(
      `/events/${eventId}/ticket-groups`,
    );
    return response.data;
  },

  async deleteTicketGroup(id: number): Promise<void> {
    await axiosInstance.delete(`/events/ticket-groups/${id}`);
  },
};
