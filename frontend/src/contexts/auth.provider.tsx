import { useState, useEffect } from "react";
import type { AuthProviderProps, AuthContextType, User } from "../types/auth.types";
import { AuthContext } from "./auth.context";

import * as authService from "../services/auth.service";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check token on mount and restore session
  useEffect(() => {
    const restoreSession = () => {
      const token = authService.getToken();
      if (token && authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          setRole(authService.getCurrentUserRole());
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      await authService.login(username, password);
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string, roleId: number) => {
    try {
      setIsLoading(true);
      await authService.register(username, password, roleId);
      // Optionally auto-login after registration
      await login(username, password);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    user,
    role,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

