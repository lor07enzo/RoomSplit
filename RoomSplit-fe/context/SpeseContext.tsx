import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Categoria, GruppoSpesa } from '@/types/types';
import { speseService } from '@/services/spese';
import { useAuth } from './AuthContext';

interface SpeseContextType {
    spese: GruppoSpesa[];
    categorie: Categoria[];
    isLoading: boolean;
    isLoadingCategorie: boolean;
    error: string | null;
    fetchSpese: () => Promise<void>;
    fetchCategorie: () => Promise<void>;
    addSpesa: (dati: Partial<GruppoSpesa>) => Promise<boolean>;
    updateSpesa: (id: string, dati: any) => Promise<boolean>;
    removeSpesa: (id: string) => Promise<boolean>;
}

const SpeseContext = createContext<SpeseContextType | undefined>(undefined);

export function SpeseProvider({ children }: { children: React.ReactNode }) {
    const [spese, setSpese] = useState<GruppoSpesa[]>([]);
    const [categorie, setCategorie] = useState<Categoria[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCategorie, setIsLoadingCategorie] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
  
    // Funzione centralizzata per caricare i dati dal backend
    const fetchSpese = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        setError(null);
        try {
            const data = await speseService.getSpese();
            setSpese(data);
        } catch (err: any) {
            console.error("Errore nel fetch delle spese:", err);
            setError("Impossibile caricare le spese.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const fetchCategorie = useCallback(async () => {
        if (!user) return;
        setIsLoadingCategorie(true);
        try {
            const data = await speseService.getCategorie(); 
            setCategorie(data);
        } catch (err: any) {
            console.error("Errore nel fetch delle categorie:", err);
        } finally {
            setIsLoadingCategorie(false);
        }
    }, [user]);
  
    // Ricarica automaticamente le spese quando l'utente effettua l'accesso
    useEffect(() => {
        if (user) {
            fetchSpese();
            fetchCategorie();
        } else {
            // Pulisce lo stato se l'utente fa logout
            setSpese([]); 
            setCategorie([]);
        }
    }, [user, fetchSpese, fetchCategorie]);
  
    const addSpesa = async (dati: Partial<GruppoSpesa>) => {
        try {
            const nuovaSpesa = await speseService.createSpesa(dati);
            setSpese(prev => [nuovaSpesa, ...prev]);
            return true;
        } catch (err: any) {
            console.error("Errore validazione Django:", err.response?.data || err.message);
            return false;
        }
    };

    const updateSpesa = async (id: string, dati: any) => {
        try {
            const spesaAggiornata = await speseService.updateSpesa(id, dati);
            setSpese(prev => prev.map(s => s.id === id ? spesaAggiornata : s));
            return true;
        } catch (err: any) {
            console.error("Errore aggiornamento spesa:", err.response?.data || err.message);
            return false;
        }
    };
  
    const removeSpesa = async (id: string) => {
        try {
            await speseService.deleteSpesa(id);
            setSpese(prev => prev.filter(s => s.id !== id));
            return true;
        } catch (err) {
            console.error("Errore durante l'eliminazione:", err);
            return false;
        }
    };

    return (
        <SpeseContext.Provider value={{ 
          spese, categorie, isLoading, isLoadingCategorie, error, 
          fetchSpese, fetchCategorie, addSpesa, updateSpesa, removeSpesa 
        }}>
            {children}
        </SpeseContext.Provider>
    );
}

// Hook personalizzato per un utilizzo rapido nei componenti
export const useSpese = () => {
    const context = useContext(SpeseContext);
    if (context === undefined) {
        throw new Error("useSpese deve essere usato all'interno di uno SpeseProvider");
    }
    return context;
};