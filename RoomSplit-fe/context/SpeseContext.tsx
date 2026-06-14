import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Categoria, GruppoSpesa, Rimborso, SaldoMembro } from '@/types/types';
import { CreaSpesaPayload, InviaRimborsoPayload, speseService } from '@/services/spese';
import { useAuth } from './AuthContext';

interface SpeseContextType {
    spese: GruppoSpesa[];
    categorie: Categoria[];
    rimborsi: Rimborso[];
    saldiPerGruppo: Record<string, SaldoMembro[]>;
    isLoading: boolean;
    isLoadingCategorie: boolean;
    isLoadingSaldi: boolean;
    isLoadingRimborsi: boolean;
    error: string | null;
    fetchSpese: () => Promise<void>;
    fetchCategorie: () => Promise<void>;
    fetchSaldi: (gruppoId: string) => Promise<void>;
    addSpesa: (dati: CreaSpesaPayload) => Promise<boolean>;
    updateSpesa: (id: string, dati: Partial<CreaSpesaPayload>) => Promise<boolean>;
    removeSpesa: (id: string) => Promise<boolean>;
    inviaRimborso: (dati: InviaRimborsoPayload, gruppoId: string) => Promise<boolean>;
    fetchRimborsiPersonali: () => Promise<void>;
}

const SpeseContext = createContext<SpeseContextType | undefined>(undefined);

export function SpeseProvider({ children }: { children: React.ReactNode }) {
    const [spese, setSpese] = useState<GruppoSpesa[]>([]);
    const [categorie, setCategorie] = useState<Categoria[]>([]);
    const [rimborsi, setRimborsi] = useState<Rimborso[]>([]);
    const [saldiPerGruppo, setSaldiPerGruppo] = useState<Record<string, SaldoMembro[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCategorie, setIsLoadingCategorie] = useState(true);
    const [isLoadingSaldi, setIsLoadingSaldi] = useState(true);
    const [isLoadingRimborsi, setIsLoadingRimborsi] = useState(false);
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

    const fetchSaldi = useCallback(async (gruppoId: string) => {
        if (!user) return;
        setIsLoadingSaldi(true);
        try {
            const data = await speseService.getSaldiGruppo(gruppoId);
            setSaldiPerGruppo(prev => ({
                ...prev,
                [gruppoId]: data.saldi
            }));
        } catch (err: any) {
            console.error(`Errore nel fetch dei saldi per il gruppo ${gruppoId}:`, err);
        } finally {
            setIsLoadingSaldi(false);
        }
    }, [user]);

    const fetchRimborsiPersonali = useCallback(async () => {
        setIsLoadingRimborsi(true);
        try {
            const dati = await speseService.getRimborsoHistory(); 
            setRimborsi(dati || []);
        } catch (err) {
            console.error("Errore nel recupero dello storico rimborsi:", err);
        } finally {
            setIsLoadingRimborsi(false);
        }
    }, []);
  
    // Ricarica automaticamente le spese quando l'utente effettua l'accesso
    useEffect(() => {
        if (user) {
            fetchSpese();
            fetchCategorie();
            fetchRimborsiPersonali();
        } else {
            // Pulisce lo stato se l'utente fa logout
            setSpese([]); 
            setCategorie([]);
            setSaldiPerGruppo({});
        }
    }, [user, fetchSpese, fetchCategorie]);
  
    const addSpesa = async (dati: CreaSpesaPayload) => {
        try {
            const nuovaSpesa = await speseService.createSpesa(dati);
            setSpese(prev => [nuovaSpesa, ...prev]);
            
            if (dati.gruppo) {
                fetchSaldi(dati.gruppo); 
            }
            return true;
        } catch (err: any) {
            console.error("Errore validazione Django:", err.response?.data || err.message);
            return false;
        }
    };

    const updateSpesa = async (id: string, dati: Partial<CreaSpesaPayload>) => {
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

    const inviaRimborso = async (dati: InviaRimborsoPayload, gruppoId: string) => {
        try {
            await speseService.inviaRimborso(dati);
            await fetchSaldi(gruppoId);
            return true;
        } catch (err: any) {
            console.error("Errore durante l'invio del rimborso:", err.response?.data || err.message);
            return false;
        }
    };

    return (
        <SpeseContext.Provider value={{ 
          spese, categorie, rimborsi, saldiPerGruppo, isLoading, isLoadingCategorie, isLoadingSaldi, isLoadingRimborsi, error, 
          fetchSpese, fetchCategorie, fetchSaldi, fetchRimborsiPersonali, addSpesa, updateSpesa, removeSpesa, inviaRimborso
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