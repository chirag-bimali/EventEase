import { useState, useEffect, useCallback } from "react";
import type { TicketGroup } from "../types/ticketGroup.types";
import { loadCart, saveCart } from "../lib/posSessionStorage";

export interface CartItem {
  ticketGroup: TicketGroup;
  quantity?: number; // For GENERAL/QUEUE
  seatNumbers?: string[]; // For SEAT
}

export const usePOSCart = () => {
  const [cart, setCart] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addItem = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.ticketGroup.id === item.ticketGroup.id,
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      }

      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((ticketGroupId: number) => {
    setCart((prev) => prev.filter((i) => i.ticketGroup.id !== ticketGroupId));
  }, []);

  const updateQuantity = useCallback((ticketGroupId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ticketGroup.id === ticketGroupId ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const updateSeats = useCallback((ticketGroupId: number, seatNumbers: string[]) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ticketGroup.id === ticketGroupId ? { ...item, seatNumbers } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const quantity = item.quantity || item.seatNumbers?.length || 0;
      return total + Number(item.ticketGroup.price) * quantity;
    }, 0);
  }, [cart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((count, item) => {
      const quantity = item.quantity || item.seatNumbers?.length || 0;
      return count + quantity;
    }, 0);
  }, [cart]);

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
