import React, { createContext, useContext, useState, ReactNode } from "react";
import { apiFetch } from "../lib/api";

interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // On app load, try to refresh session
  React.useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        await apiFetch("/auth/refresh", { method: "POST" });
        const userData = await apiFetch("/users/me");
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      // Fetch user info after successful login
      const userData = await apiFetch("/users/me");
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors during logout (user may already be logged out)
    }
    setUser(null);
    setIsLoading(false);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
