import type { ReactNode } from "react";
import type { Role } from "./role.types";

export interface User {
  id: number;
  username: string;
  role?: Role;
}

export interface AuthContextType {
  user: User | null;
  role: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, roleId: number) => Promise<void>;
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

