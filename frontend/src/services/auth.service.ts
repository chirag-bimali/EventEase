import axios from "axios";
import axiosInstance from "../lib/axios";

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
  token: string,
): { userId: number; iat: number; exp: number; roleId: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Login
export async function login(
  username: string,
  password: string,
): Promise<{ token: string }> {
  try {
    const response = await axiosInstance.post<LoginResponse>("/auth/login", {
      username,
      password,
    });

    const data = response.data;
    setToken(data.token);
    return { token: data.token };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error?.response?.data?.message || "Login failed";
    }
    throw error instanceof Error ? error.message : new Error("Login failed");
  }
}

// Register
export async function register(
  username: string,
  password: string,
  roleId: number,
): Promise<{ message: string; userId: number }> {
  const response = await axiosInstance.post<RegisterResponse>(
    "/auth/register",
    {
      username,
      password,
      roleId,
    },
  );

  return response.data;
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
