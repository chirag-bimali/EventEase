import { useState, useEffect, useCallback, useRef } from "react";
import type { Event, GetAllEventsFilters } from "../types/event.types";
import { eventService } from "../services/event.service";

export const useEvents = (filters: GetAllEventsFilters = {}) => {
  const filtersKey = JSON.stringify(filters ?? {});
  const filtersRef = useRef(filters);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  filtersRef.current = filters;

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getAllEvents(filtersRef.current);
      setEvents(data);
      setError(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch events";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, filtersKey]);

  return { events, loading, error, refetch: fetchEvents };
};
