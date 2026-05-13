import { tokenStorage } from "@/lib/storage";
import { authService } from "@/services/auth";
import { User } from "@/types/types";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  register: (dati: any) => Promise<boolean>;
  login: (credenziali: any) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await tokenStorage.getAccessToken();
      
      if (token) {
        try {
          const realUser = await authService.getUserProfile();
          setUser(realUser);
        } catch (error) {
          await tokenStorage.clearAllTokens();
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credenziali: any) => {
    setIsLoading(true);
    try {
      const responseData = await authService.login(credenziali);
      
      if (responseData.access && responseData.refresh) {
        
        await tokenStorage.saveTokens(responseData.access, responseData.refresh);
        
        const realUser = await authService.getUserProfile();
        setUser(realUser);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Errore di login:", error.response?.data || error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await tokenStorage.clearAllTokens();
    setUser(null);
  };

  const register = async (dati: any) => {
    setIsLoading(true);
    try {
      const responseData = await authService.register(dati);
      
      if (responseData && responseData.user) {
        setUser(responseData.user);
      }
      return true;
    } catch (error) {
      console.error("Errore di registrazione:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve essere usato dentro un AuthProvider");
  }
  return context;
};