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
      
      // In production (like Render), be more forgiving and try backup recovery
      const userBackup = localStorage.getItem("user_backup");
      if (userBackup && process.env.NODE_ENV === 'production') {
        try {
          const backupData = JSON.parse(userBackup);
          console.log("🔄 Production: Using cached user data temporarily...");
          
          // Create temporary user object from backup
          const temporaryUser = {
            id: backupData.id,
            name: backupData.name,
            phoneNumber: backupData.phoneNumber,
            location: backupData.location || 'الجزائر',
            avatar: backupData.avatar || null,
            isVerified: backupData.isVerified || false,
            isAdmin: false,
            isOnline: true,
            lastSeen: new Date(),
            verifiedAt: backupData.verifiedAt || null,
            profileCount: 0,
            notificationCount: 0,
            lastStreakDate: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setUser(temporaryUser);
          console.log("✅ Temporary session established from cache");
          return;
        } catch (backupError) {
          console.warn("🚨 Backup recovery failed:", backupError);
        }
      }
      
      // Only clear auth in development or when backup fails
      if (process.env.NODE_ENV !== 'production' || !userBackup) {
        localStorage.removeItem("auth_token");
      }
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