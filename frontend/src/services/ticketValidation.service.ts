import axios from "axios";
import axiosInstance from "../lib/axios";

export const ticketValidationService = {
  /**
   * Validate a ticket using QR token
   */
  async validateTicket(qrToken: string) {
    try {
      console.log("Validating ticket with QR token:", qrToken);
      const response = await axiosInstance.post("/tickets/validation/validate", {
        qrToken,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response?.data || { message: "Validation failed" };
      }
      throw { message: "Validation failed" };
    }
  },

  /**
   * Get ticket status without validating
   */
  async getTicketStatus(qrToken: string) {
    try {
      const response = await axiosInstance.get(`/tickets/validation/
        status/${qrToken}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response?.data || { message: "Validation failed" };
      }
      throw { message: "Validation failed" };
    }
  },
};
