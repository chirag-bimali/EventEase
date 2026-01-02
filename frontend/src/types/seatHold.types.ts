export interface SeatHold {
  id: number;
  ticketGroupId: number;
  seatNumber: string;
  expiresAt: string;
}

export interface CreateSeatHoldRequest {
  ticketGroupId: number;
  seatNumbers: string[];
  durationMinutes?: number;
}