import { useState, useCallback } from "react";
import { ticketValidationService } from "../services/ticketValidation.service";
import axios from "axios";

export interface ValidationResult {
  success: boolean;
  message: string;
  ticketData?: {
    ticketId: number;
    seatNumber: string;
    eventName: string;
    groupName: string;
    validatedAt: string;
  };
}

export const useTicketValidation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validateTicket = useCallback(async (qrToken: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await ticketValidationService.validateTicket(qrToken);
      setResult(response);
      return response;
    } catch (err: unknown) {
      if(axios.isAxiosError(err) && err.response && err.response.data && typeof err.response.data.message === 'string') {
        setError(err.response.data.message);
        throw new Error(err.response.data.message);
      }
      const errorMessage = err instanceof Error ? err.message : "Failed to validate ticket";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    validateTicket,
    clearResult,
    loading,
    error,
    result,
  };
};