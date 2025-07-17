import React, { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "admin" | "employee";
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
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

// Mock user data
const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    name: "Administrator",
    phone: "+1234567890",
    email: "admin@example.com",
    role: "admin",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    username: "employee",
    name: "John Doe",
    phone: "+1234567891",
    email: "employee@example.com",
    role: "employee",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // On app load, start with no user logged in
  React.useEffect(() => {
    setUser(null);
  }, []);

  // Mock login function
  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

    // Accept admin/admin or employee/employee
    const foundUser = mockUsers.find(
      (u) => u.username === username && password === username
    );
    if (foundUser) {
      setUser(foundUser);
      setIsLoading(false);
      return true;
    } else {
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
