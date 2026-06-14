import React, { createContext, useCallback, useContext, useState } from 'react';
import { StatisticheService } from '@/services/statistiche';
import { SaldoMembro, StatisticheAnnualiResponse, StatisticheMensiliResponse, StatistichePersonaliResponse } from '@/types/types';

interface StatisticheContextType {
    saldi: SaldoMembro[];
    loadingSaldi: boolean;
    statisticheMensili: StatisticheMensiliResponse | null;
    statisticheAnnuali: StatisticheAnnualiResponse | null;
    statistichePersonali: StatistichePersonaliResponse | null;
    fetchMensili: (gruppoId?: string | null, mese?: number, anno?: number) => Promise<void>;
    fetchAnnuali: (gruppoId?: string | null, anno?: number) => Promise<void>;
    fetchPersonali: (userId: string, mese?: number, anno?: number) => Promise<void>;
}

const StatisticheContext = createContext<StatisticheContextType | undefined>(undefined);

export function StatisticheProvider({ children }: { children: React.ReactNode }) {
    const [saldi, setSaldi] = useState<SaldoMembro[]>([]);
    const [loadingSaldi, setLoadingSaldi] = useState(true);
    const [statisticheMensili, setStatisticheMensili] = useState<StatisticheMensiliResponse | null>(null);
    const [statisticheAnnuali, setStatisticheAnnuali] = useState<StatisticheAnnualiResponse | null>(null);
    const [statistichePersonali, setStatistichePersonali] = useState<StatistichePersonaliResponse | null>(null);

    const fetchMensili = useCallback(async (gruppoId?: string | null, mese?: number, anno?: number) => {
        try {
            const data = await StatisticheService.getStatisticheMensili(gruppoId, mese, anno);
            setStatisticheMensili(data);
        } catch (err) {
            console.error("Errore fetch statistiche mensili:", err);
        }
    }, []);

    const fetchAnnuali = useCallback(async (gruppoId?: string | null, anno?: number) => {
        try {
            const data = await StatisticheService.getStatisticheAnnuali(gruppoId, anno);
            setStatisticheAnnuali(data);
        } catch (err) {
            console.error("Errore fetch statistiche annuali:", err);
        }
    }, []);

    const fetchPersonali = useCallback(async (userId: string, mese?: number, anno?: number) => {
        try {
            const data = await StatisticheService.getStatistichePersonali(userId, mese, anno);
            setStatistichePersonali(data);
        } catch (err) {
            console.error("Errore fetch statistiche personali:", err);
        }
    }, []);

    return (
        <StatisticheContext.Provider value={{ 
            saldi, loadingSaldi, statisticheMensili, statisticheAnnuali, statistichePersonali,
            fetchMensili, fetchAnnuali, fetchPersonali
        }}>
            {children}
        </StatisticheContext.Provider>
    );
}

export const useStatistiche = () => {
    const context = useContext(StatisticheContext);
    if (!context) throw new Error("useStatistiche deve essere usato dentro StatisticheProvider");
    return context;
};