import type { Ticket } from "./ticket.types";

export const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
  ONLINE: "ONLINE",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface PosOrderItem {
  id: number;
  ticketGroupId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tickets: Ticket[];
}

export interface PosOrder {
  id: number;
  orderNumber: string;
  eventId: number;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  notes?: string;
  items: PosOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePosOrderRequest {
  eventId: number;
  items: {
    ticketGroupId: number;
    seatType: string;
    quantity?: number;
    seatNumbers?: string[];
    unitPrice: number;
  }[];
  paymentMethod: PaymentMethod;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  notes?: string;
}