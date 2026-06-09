import type { CartItem } from "../hooks/usePOSCart";

const CART_KEY = "eventease-pos-cart";
const SESSION_KEY = "eventease-pos-session";

export type POSStep = "event" | "ticketing" | "payment";

export interface StoredPOSSession {
  eventId: number | null;
  step: POSStep;
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function loadSession(): StoredPOSSession {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { eventId: null, step: "event" };
    const parsed = JSON.parse(raw) as StoredPOSSession;
    return {
      eventId: parsed.eventId ?? null,
      step: parsed.step ?? "event",
    };
  } catch {
    return { eventId: null, step: "event" };
  }
}

export function saveSession(session: StoredPOSSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearPOSSession(): void {
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(SESSION_KEY);
}
