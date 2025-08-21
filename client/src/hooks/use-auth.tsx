import { useState, useEffect, createContext, useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (userData: User, token: string) => {
    localStorage.setItem("auth_token", token);
    setUser(userData);
  };

  const logout = async () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        await apiRequest("/api/auth/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiRequest("/api/user/current");
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("auth_token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
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