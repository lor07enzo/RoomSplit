import { api } from "@/lib/api";

export const StatisticheService = {
  
    // Mappa le statistiche mensili dei gruppi
    getStatisticheMensili: async (gruppoId?: string | null, mese?: number, anno?: number) => {
        const response = await api.get('/v1/statistiche/gruppo/mensili/', {
            params: { gruppo_id: gruppoId || 'all', mese, anno }
        });
        return response.data;
    },
  
    // Mappa le statistiche annuali dei gruppi
    getStatisticheAnnuali: async (gruppoId?: string | null, anno?: number) => {
        const response = await api.get('/v1/statistiche/gruppo/annuali/', {
            params: { gruppo_id: gruppoId || 'all', anno }
        });
        return response.data;
    },

    // Mappa le statistiche personali dell'utente
    getStatistichePersonali: async (userId: string, mese?: number, anno?: number) => {
        const response = await api.get('/v1/statistiche/personali/', {
            params: {
                user_id: userId,
                mese,
                anno
            }
        });
        return response.data;
    }
};