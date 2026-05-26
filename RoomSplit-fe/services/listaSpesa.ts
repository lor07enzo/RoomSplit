import { api } from "@/lib/api";
import { Articolo, ListaSpesa } from "@/types/types";


export const ListaSpesaService = {
    // Recupera tutte le liste dell'utente
    getListe: async (): Promise<ListaSpesa[]> => {
        const response = await api.get<ListaSpesa[]>('/v1/liste/');
        return response.data;
    },

    // Crea una nuova lista della spesa
    createLista: async (titolo: string, gruppoId: string | null): Promise<ListaSpesa> => {
        const response = await api.post<ListaSpesa>('/v1/liste/', {
            titolo,
            gruppo: gruppoId,
        });
        return response.data;
    },

    // Recupera i dettagli di una singola lista e i suoi articoli
    getDettaglioLista: async (id: string): Promise<ListaSpesa & { articoli: Articolo[] }> => {
        const response = await api.get<ListaSpesa & { articoli: Articolo[] }>(`/v1/liste/${id}/`);
        return response.data;
    },

    // Aggiunge un articolo alla lista
    addArticolo: async (listaId: string, nome: string, quantita: number): Promise<Articolo> => {
        const response = await api.post<Articolo>(`/v1/articoli/`, {
            lista_spesa: listaId,
            nome,
            quantita
        });
        return response.data;
    },

    // Segna come preso (passando l'ID utente) o rilascia (passando null)
    toggleArticolo: async (articoloId: string, preso: boolean): Promise<Articolo> => {
        const response = await api.post<Articolo>(`/v1/articoli/${articoloId}/toggle-check/`, {
            segna_come_preso: preso 
        });
        return response.data;
    },

    async deleteLista(id: string): Promise<void> {
        await api.delete(`/v1/liste/${id}/`);
    },

    async deleteArticolo(id: string): Promise<void> {
        await api.delete(`/v1/articoli/${id}/`);
    },

    // Svuota tutti gli articoli segnati come presi in una lista
    async svuotaArticoliPresi(listaId: string): Promise<void> {
        await api.post(`/v1/liste/${listaId}/svuota-presi/`);
    }
};