import React, { createContext, useContext, useState } from 'react';
import { StatisticheService } from '@/services/statistiche';

interface StatisticheContextType {
  saldi: any[];
  loadingSaldi: boolean;
  fetchSaldiGruppo: (gruppoId: string) => Promise<void>;
  statisticheMensili: any | null; // TODO: Da implementare
  fetchMensili: (gruppoId: string, mese?: number, anno?: number) => Promise<void>;
}

const StatisticheContext = createContext<StatisticheContextType | undefined>(undefined);

export function StatisticheProvider({ children }: { children: React.ReactNode }) {
    const [saldi, setSaldi] = useState<any[]>([]);
    const [loadingSaldi, setLoadingSaldi] = useState(true);
    const [statisticheMensili, setStatisticheMensili] = useState<any | null>(null);

    const fetchSaldiGruppo = async (gruppoId: string) => {
        setLoadingSaldi(true);
        try {
            const data = await StatisticheService.getSaldiGruppo(gruppoId);
            setSaldi(data.saldi || []);
        } catch (err) {
            console.error("Errore fetch saldi nel context:", err);
        } finally {
            setLoadingSaldi(false);
        }
    };

    const fetchMensili = async (gruppoId: string, mese?: number, anno?: number) => {
        try {
            const data = await StatisticheService.getStatisticheMensili(gruppoId, mese, anno);
            setStatisticheMensili(data);
        } catch (err) {
            console.error("Errore fetch statistiche mensili:", err);
        }
    };

    return (
        <StatisticheContext.Provider value={{ saldi, loadingSaldi, fetchSaldiGruppo, statisticheMensili, fetchMensili }}>
            {children}
        </StatisticheContext.Provider>
    );
}

export const useStatistiche = () => {
    const context = useContext(StatisticheContext);
    if (!context) throw new Error("useStatistiche deve essere usato dentro StatisticheProvider");
    return context;
};