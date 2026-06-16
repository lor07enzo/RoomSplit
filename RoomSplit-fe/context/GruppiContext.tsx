import { Gruppo } from "@/types/types";
import { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import { GruppiService } from "@/services/gruppi";


interface GruppiContextType {
    gruppi: Gruppo[];
    isLoading: boolean;
    error: string | null;
    fetchGruppi: () => Promise<void>;
    createGruppo: (nome: string) => Promise<boolean>;
    joinGruppo: (codice_invito: string) => Promise<{ success: boolean; errore?: string }>;
    removeMembroGruppo: (gruppoId: string, userId: string) => Promise<void>;
    eliminaGruppo: (gruppoId: string) => Promise<void>;
}

const GruppiContext = createContext<GruppiContextType | undefined>(undefined);

export function GruppiProvider({ children }: { children: React.ReactNode }) {
    const [gruppi, setGruppi] = useState<Gruppo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();


    const fetchGruppi = useCallback(async() => {
        if (!user) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await GruppiService.getGruppi();
            setGruppi(data);
        } catch (err: any) {
            console.error("Errore nel recupero dei gruppi:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user])

    const createGruppo = async (nome: string) => {
        try {
            const nuovo = await GruppiService.createGruppi(nome);
            setGruppi(prev => [nuovo, ...prev]);
            return true;
        } catch (err) {
            console.error("Errore creazione gruppo:", err);
            return false;
        }
    };

    const joinGruppo = async (codice_invito: string) => {
        try {
           await GruppiService.joinGruppi(codice_invito);
           await fetchGruppi();
           return { success: true };
        } catch (err: any) {
            const msg = err.response?.data?.errore || "Codice non valido.";
            return { success: false, errore: msg };
        }
    };

    const removeMembroGruppo = async (gruppoId: string, userId: string) => {
        try {
            await GruppiService.removeMembro(gruppoId, userId);
        } catch (err) {
            console.error("Errore nel context durante la rimozione del membro:", err);
            throw err;
        }
    };

    const eliminaGruppo = async (gruppoId: string) => {
        try {
            await GruppiService.deleteGruppi(gruppoId);
            setGruppi((prev) => prev.filter((g) => g.id !== gruppoId));
        } catch (err) {
            console.error("Errore durante l'eliminazione del gruppo:", err);
            throw err;
        }
        };

    return (
        <GruppiContext.Provider value={{ gruppi, isLoading, error, fetchGruppi, createGruppo, joinGruppo, removeMembroGruppo, eliminaGruppo }}>
            {children}
        </GruppiContext.Provider>
    );
}

export const useGruppi = () => {
    const context = useContext(GruppiContext);
    if (context === undefined) {
        throw new Error("useGruppi deve essere usato all'interno di un GruppoProvider");
    }
    return context;
};