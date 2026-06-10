import { useState, useCallback } from "react";
import type {
  TicketGroup,
  CreateTicketGroupDTO,
  UpdateTicketGroupDTO,
  SeatLayoutRow,
  SeatStatus,
  SeatInfo,
} from "../types/ticketGroup.types";
import { ticketGroupService } from "../services/ticketGroup.service";
import { getApiErrorMessage } from "../lib/apiError";
import type { SeatingRow } from "../types/posOrder.types";

interface UseTicketGroupsState {
  ticketGroups: TicketGroup[];
  ticketGroup: TicketGroup | null;
  loading: boolean;
  error: string | null;
}

export const useTicketGroups = () => {
  const [state, setState] = useState<UseTicketGroupsState>({
    ticketGroups: [],
    ticketGroup: null,
    loading: false,
    error: null,
  });

  /**
   * Fetch all ticket groups
   */
  const fetchAllTicketGroups = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await ticketGroupService.getAllTicketGroups();
      setState((prev) => ({ ...prev, ticketGroups: data, loading: false }));
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to fetch ticket groups");
      setState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  /**
   * Fetch ticket groups for a specific event
   */
  const fetchTicketGroupsByEvent = useCallback(async (eventId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await ticketGroupService.getTicketGroupsByEventId(eventId);
      setState((prev) => ({ ...prev, ticketGroups: data, loading: false }));
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        "Failed to fetch ticket groups for event",
      );
      setState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  /**
   * Fetch a single ticket group by ID
   */
  const fetchTicketGroupById = useCallback(async (id: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await ticketGroupService.getTicketGroupById(id);
      setState((prev) => ({ ...prev, ticketGroup: data, loading: false }));
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to fetch ticket group");
      setState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  /**
   * Create a new ticket group
   */
  const createTicketGroup = useCallback(async (data: CreateTicketGroupDTO) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const newTicketGroup = await ticketGroupService.createTicketGroup(data);
      setState((prev) => ({
        ...prev,
        ticketGroups: [...prev.ticketGroups, newTicketGroup],
        loading: false,
      }));
      return newTicketGroup;
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to create ticket group");
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw new Error(message);
    }
  }, []);

  /**
   * Update a ticket group
   */
  const updateTicketGroup = useCallback(
    async (id: number, data: UpdateTicketGroupDTO) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const updatedTicketGroup = await ticketGroupService.updateTicketGroup(
          id,
          data,
        );
        setState((prev) => ({
          ...prev,
          ticketGroups: prev.ticketGroups.map((tg) =>
            tg.id === id ? updatedTicketGroup : tg,
          ),
          ticketGroup:
            prev.ticketGroup?.id === id ? updatedTicketGroup : prev.ticketGroup,
          loading: false,
        }));
        return updatedTicketGroup;
      } catch (err: unknown) {
        const message = getApiErrorMessage(err, "Failed to update ticket group");
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw new Error(message);
      }
    },
    [],
  );

  /**
   * Delete a ticket group
   */
  const deleteTicketGroup = useCallback(async (id: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await ticketGroupService.deleteTicketGroup(id);
      setState((prev) => ({
        ...prev,
        ticketGroups: prev.ticketGroups.filter((tg) => tg.id !== id),
        ticketGroup: prev.ticketGroup?.id === id ? null : prev.ticketGroup,
        loading: false,
      }));
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to delete ticket group");
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw new Error(message);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const getSeatLayout = useCallback(
    (ticketGroup: TicketGroup): SeatLayoutRow[] | null => {
      try {
        if (ticketGroup.seatType !== "SEAT") {
          throw new Error("Only SEAT type ticket groups have seat layouts");
        }

        if (!ticketGroup.seatingConfig) {
          throw new Error("Seating configuration not found");
        }

        const seatingConfig = JSON.parse(
          ticketGroup.seatingConfig as string,
        ) as SeatingRow[];

        const seatStatusMap = new Map<string, SeatStatus>();
        for (const ticket of ticketGroup.tickets || []) {
          if (ticket.status === "RESERVED") {
            const expired =
              !ticket.reservedAt ||
              Date.now() - Date.parse(ticket.reservedAt) > 10 * 60 * 1000;
            seatStatusMap.set(
              ticket.seatNumber,
              expired ? "AVAILABLE" : "RESERVED",
            );
          } else {
            seatStatusMap.set(ticket.seatNumber, ticket.status);
          }
        }

        const rows: SeatLayoutRow[] = seatingConfig.map((rowConfig) => {
          const seats: SeatInfo[] = [];

          for (let col = 1; col <= rowConfig.columns; col++) {
            const seatNumber = `${rowConfig.row}${col}`;
            const seatStatus = seatStatusMap.get(seatNumber) ?? "AVAILABLE";

            seats.push({
              seatNumber,
              status: seatStatus,
            });
          }

          return {
            row: rowConfig.row,
            seats,
          };
        });

        return rows;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch seat layout";
        setState((prev) => ({ ...prev, error: message }));
        return null;
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [],
  );

  return {
    ticketGroups: state.ticketGroups,
    ticketGroup: state.ticketGroup,
    loading: state.loading,
    error: state.error,
    getSeatLayout,
    fetchAllTicketGroups,
    fetchTicketGroupsByEvent,
    fetchTicketGroupById,
    createTicketGroup,
    updateTicketGroup,
    deleteTicketGroup,
    clearError,
  };
};
