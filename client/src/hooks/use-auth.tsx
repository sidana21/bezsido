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
    console.log("🔐 User login initiated for:", userData.name);
    localStorage.setItem("auth_token", token);
    
    // Advanced user data protection - multiple backup layers
    localStorage.setItem("user_backup", JSON.stringify({
      id: userData.id,
      name: userData.name,
      phoneNumber: userData.phoneNumber,
      location: userData.location,
      avatar: userData.avatar,
      isVerified: userData.isVerified,
      lastLogin: new Date().toISOString()
    }));
    
    // Additional emergency backup with different key
    localStorage.setItem("profile_cache", JSON.stringify({
      userId: userData.id,
      userPhone: userData.phoneNumber,
      cachedAt: Date.now()
    }));
    
    setUser(userData);
    console.log("✅ User logged in and data backed up successfully");
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
    
    // Keep backup data for quick re-login (don't remove user_backup on logout)
    localStorage.removeItem("auth_token");
    console.log("🔓 User logged out but backup data preserved for quick re-entry");
    setUser(null);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      console.log("🔍 Checking authentication and user data...");
      const userData = await apiRequest("/api/user/current");
      
      if (userData) {
        console.log("✅ User authenticated successfully:", userData.name);
        setUser(userData);
        
        // Auto-save user session data to prevent data loss
        localStorage.setItem("user_backup", JSON.stringify({
          id: userData.id,
          name: userData.name,
          phoneNumber: userData.phoneNumber,
          lastLogin: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      
      // Try to recover from backup if available
      const userBackup = localStorage.getItem("user_backup");
      if (userBackup) {
        try {
          const backupData = JSON.parse(userBackup);
          console.log("🔄 Attempting to recover user session from backup...");
          
          // Try to re-authenticate with stored phone number
          const recoveryAttempt = await apiRequest("/api/auth/recover-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              phoneNumber: backupData.phoneNumber,
              userId: backupData.id 
            }),
          });
          
          if (recoveryAttempt.success) {
            console.log("✅ Session recovered successfully!");
            localStorage.setItem("auth_token", recoveryAttempt.token);
            setUser(recoveryAttempt.user);
            return;
          }
        } catch (recoveryError) {
          console.warn("🚨 Session recovery failed:", recoveryError);
        }
      }
      
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_backup");
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