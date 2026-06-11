import type { ReactNode } from "react";
import type { Role } from "./role.types";

export interface User {
  id: number;
  email: string;
  role?: Role;
}

export interface AuthContextType {
  user: User | null;
  role: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, roleId: number) => Promise<void>;
  logout: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}
