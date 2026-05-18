import { api } from "@/lib/api";
import { Categoria, GruppoSpesa } from "@/types/types";

export const speseService = {
    // Recupera tutte le spese
    getSpese: async (): Promise<GruppoSpesa[]> => {
        const response = await api.get<GruppoSpesa[]>('/v1/spese/');
        return response.data;
    },
  
    // Aggiorna una spesa esistente
    updateSpesa: async (id: string, datiSpesa: any): Promise<GruppoSpesa> => {
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
    createSpesa: async (datiSpesa: any): Promise<GruppoSpesa> => {
        const response = await api.post<GruppoSpesa>('/v1/spese/', datiSpesa);
        return response.data;
    },
};  