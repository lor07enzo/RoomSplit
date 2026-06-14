import { api } from "@/lib/api";
import { Categoria, GruppoSpesa, Rimborso, SaldiResponse, TipologiaRimborso } from "@/types/types";


export type CreaSpesaPayload = Omit<GruppoSpesa, 'id' | 'created_at' | 'user' | 'pagatore' | 'gruppo' | 'categoria'> & { 
    gruppo?: string;
    categoria?: string;
    debitori?: string[]; 
    documento_id?: string;
};

export type InviaRimborsoPayload = { 
    from_membro: string; 
    to_membro: string; 
    importo: number; 
    tipologia: TipologiaRimborso; 
    nota?: string;
};

export const speseService = {
    // Recupera tutte le spese
    getSpese: async (): Promise<GruppoSpesa[]> => {
        const response = await api.get<GruppoSpesa[]>('/v1/spese/');
        return response.data;
    },
  
    // Aggiorna una spesa esistente
    updateSpesa: async (id: string, datiSpesa: Partial<CreaSpesaPayload>): Promise<GruppoSpesa> => {
        const response = await api.put<GruppoSpesa>(`/v1/spese/${id}/`, datiSpesa);
        return response.data;
    },
  
    // Elimina una spesa
    deleteSpesa: async (id: string): Promise<void> => {
        await api.delete(`/v1/spese/${id}/`);
    },
    
    // Recupera tutte le categorie
    getCategorie: async (): Promise<Categoria[]> => {
        const response = await api.get<Categoria[]>("/v1/categorie/");
        return response.data;
    },

    // Crea una nuova spesa
    createSpesa: async (datiSpesa: CreaSpesaPayload): Promise<GruppoSpesa> => {
        const response = await api.post<GruppoSpesa>('/v1/spese/', datiSpesa);
        return response.data;
    },

    // Recupera i saldi del gruppo
    getSaldiGruppo: async (gruppoId: string): Promise<SaldiResponse> => {
        const response = await api.get<SaldiResponse>('/v1/spese/saldi/', {
            params: { gruppo_id: gruppoId }
        });
        return response.data;
    },

    // Invia un nuovo rimborso
    inviaRimborso: async (datiRimborso: InviaRimborsoPayload): Promise<Rimborso> => {
        const response = await api.post<Rimborso>('/v1/rimborsi/', datiRimborso);
        return response.data;
    },

    // Recupera lo storico dei rimborsi
    getRimborsoHistory: async (): Promise<Rimborso[]> => {
        const response = await api.get<Rimborso[]>('/v1/rimborsi/');
        return response.data;
    }
    
};  