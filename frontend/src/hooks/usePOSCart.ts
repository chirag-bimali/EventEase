import { useState } from "react";
import type { TicketGroup } from "../types/ticketGroup.types";

export interface CartItem {
  ticketGroup: TicketGroup;
  quantity?: number; // For GENERAL/QUEUE
  seatNumbers?: string[]; // For SEAT
}

export const usePOSCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Add item to cart
  const addItem = (item: CartItem) => {
    setCart((prev) => {
      // Check if this ticket group already exists in cart
      const existingIndex = prev.findIndex(
        (i) => i.ticketGroup.id === item.ticketGroup.id
      );

      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      }

      // Add new item
      return [...prev, item];
    });
  };

  // Remove item from cart
  const removeItem = (ticketGroupId: number) => {
    setCart((prev) => prev.filter((i) => i.ticketGroup.id !== ticketGroupId));
  };

  // Update item quantity (for GENERAL/QUEUE)
  const updateQuantity = (ticketGroupId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ticketGroup.id === ticketGroupId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Update seat numbers (for SEAT)
  const updateSeats = (ticketGroupId: number, seatNumbers: string[]) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ticketGroup.id === ticketGroupId
          ? { ...item, seatNumbers }
          : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate total
  const getTotal = () => {
    return cart.reduce((total, item) => {
      const quantity = item.quantity || item.seatNumbers?.length || 0;
      return total + Number(item.ticketGroup.price) * quantity;
    }, 0);
  };

  // Get item count
  const getItemCount = () => {
    return cart.reduce((count, item) => {
      const quantity = item.quantity || item.seatNumbers?.length || 0;
      return count + quantity;
    }, 0);
  };

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    updateSeats,
    clearCart,
    getTotal,
    getItemCount,
  };
};
