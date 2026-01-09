import { useState, useEffect } from "react";
import { ticketGroupService } from "../services/ticketGroup.service";
import type { TicketGroupAvailability } from "../types/ticketGroup.types";

export const useTicketAvailability = (ticketGroupId: number) => {
  const [availability, setAvailability] = useState<TicketGroupAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ticketGroupService.getTicketGroupAvailability(ticketGroupId);
        setAvailability(data);
      } catch (err) {
        console.error("Failed to fetch availability:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch availability");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [ticketGroupId]);

  const isUnlimited = availability?.available === -1;
  const isSoldOut = availability?.available === 0;
  const hasAvailability = availability && (isUnlimited || availability.available > 0);

  return {
    availability,
    loading,
    error,
    isUnlimited,
    isSoldOut,
    hasAvailability,
  };
};