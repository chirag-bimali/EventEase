// frontend/src/services/role.service.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
import type { Role } from "../types/role.types";

export async function getRoles(): Promise<Role[]> {
  const res = await fetch(`${API_URL}/roles`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch roles");
  }
  return res.json();
}