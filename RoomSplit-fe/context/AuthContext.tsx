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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const savedToken = await tokenStorage.getToken();
        if (savedToken) {
          // Opzionale: Qui potresti fare una chiamata GET /v1/auth/user/ 
          // per verificare che il token sia ancora valido e prendere i dati aggiornati
          // Per ora simuliamo il ripristino se il token esiste
          console.log("Token trovato, ripristino sessione...");
        }
      } catch (e) {
        console.error("Errore recupero token", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);


  const login = async (credenziali: any) => {
    setIsLoading(true);
    try {
      const responseData = await authService.login(credenziali);
      if (responseData.key) {
        await tokenStorage.saveToken(responseData.key);
        setUser(responseData.user);
      }
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await tokenStorage.removeToken();
    setUser(null);
  };

  const register = async (dati: any) => {
    setIsLoading(true);
    try {
      const responseData = await authService.register(dati);
      
      if (responseData && responseData.user) {
        setUser(responseData.user);
        // TODO: In futuro qui salveremo responseData.key (il token) nel SecureStore
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