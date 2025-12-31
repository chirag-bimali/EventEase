const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

import type {
  User,
  LoginResponse,
  RegisterResponse,
} from "../types/auth.types";

// Token management
export function setToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}

export function clearToken(): void {
  localStorage.removeItem("authToken");
}

// Decode JWT to get userId
function decodeToken(
  token: string
): { userId: number; iat: number; exp: number; roleId: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Login
export async function login(
  username: string,
  password: string
): Promise<{ token: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const data: LoginResponse = await response.json();
  setToken(data.token);
  return { token: data.token };
}

// Register
export async function register(
  username: string,
  password: string,
  roleId: number
): Promise<{ message: string; userId: number }> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, roleId }),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  const data: RegisterResponse = await response.json();
  return data;
}

// Logout
export function logout(): void {
  clearToken();
}

// Get current user from token
export function getCurrentUser(): User | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    username: "", // We only have userId from token, would need API call to get username
  };
}

// Get current user role from token
export function getCurrentUserRole(): number | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  return payload.roleId;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  const payload = decodeToken(token);
  if (!payload) return false;

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}
