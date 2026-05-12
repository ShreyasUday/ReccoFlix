import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchUser } from "./api";

interface AuthContextType {
  user: any;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await fetchUser();
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { loginUser } = await import("./api");
    const data = await loginUser(email, password);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { registerUser } = await import("./api");
    const data = await registerUser(name, email, password);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const { logoutUser } = await import("./api");
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, logout, login, register, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
