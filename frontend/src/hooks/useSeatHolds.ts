import { useState, useEffect, useCallback } from "react";
import type { SeatHold } from "../types/seatHold.types";

interface SeatHoldWithTimer extends SeatHold {
  ticketGroupId: number;
  seatNumbers: string[];
}

export const useSeatHolds = () => {
  const [activeHolds, setActiveHolds] = useState<SeatHoldWithTimer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Add holds with expiry tracking
  const addHolds = useCallback((holds: SeatHold[], ticketGroupId: number, seatNumbers: string[]) => {
    if (holds.length === 0) return;

    const holdWithTimer: SeatHoldWithTimer = {
      ...holds[0],
      ticketGroupId,
      seatNumbers,
    };

    setActiveHolds((prev) => {
      // Remove any existing holds for this ticket group
      const filtered = prev.filter((h) => h.ticketGroupId !== ticketGroupId);
      return [...filtered, holdWithTimer];
    });
  }, []);

  // Remove holds
  const removeHolds = useCallback((ticketGroupId: number) => {
    setActiveHolds((prev) => prev.filter((h) => h.ticketGroupId !== ticketGroupId));
  }, []);

  // Clear all holds
  const clearAllHolds = useCallback(() => {
    setActiveHolds([]);
    setTimeRemaining(null);
  }, []);

  // Get held seats for a ticket group
  const getHeldSeats = useCallback((ticketGroupId: number): string[] => {
    const hold = activeHolds.find((h) => h.ticketGroupId === ticketGroupId);
    return hold?.seatNumbers || [];
  }, [activeHolds]);

  // Calculate time remaining for all holds
  useEffect(() => {
    if (activeHolds.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const earliest = activeHolds.reduce((min, hold) => {
        const expiryTime = new Date(hold.expiresAt).getTime();
        return expiryTime < min ? expiryTime : min;
      }, Infinity);

      const remaining = Math.max(0, Math.floor((earliest - now) / 1000));
      setTimeRemaining(remaining);

      // Auto-clear expired holds
      if (remaining === 0) {
        clearAllHolds();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHolds, clearAllHolds]);


  // Format time remaining as MM:SS
  const formatTimeRemaining = useCallback(() => {
    if (timeRemaining === null) return null;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeRemaining]);

  return {
    activeHolds,
    addHolds,
    removeHolds,
    clearAllHolds,
    getHeldSeats,
    timeRemaining,
    formatTimeRemaining,
    hasActiveHolds: activeHolds.length > 0,
  };
};
