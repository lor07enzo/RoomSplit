import { api } from "@/lib/api";
import { Gruppo, Membro } from "@/types/types";


export const GruppiService = {
    getGruppi: async(): Promise<Gruppo[]> => {
        const response = await api.get<Gruppo[]>('/v1/gruppi/');
        return response.data;
    },

    joinGruppi: async (codiceInvito: string): Promise<{ messaggio: string; gruppo_id: string }> => {
        const response = await api.post('/v1/gruppi/join/', { codice_invito: codiceInvito });
        return response.data;
    },

    createGruppi: async(nome: string): Promise<Gruppo> => {
        const response = await api.post<Gruppo>('/v1/gruppi/', {
            nome: nome
        });
        return response.data;
    },

    updateGruppi: async(id: string, datiGruppo: any): Promise<Gruppo> => {
        const response = await api.put<Gruppo>(`/v1/gruppi/${id}/`, datiGruppo);
        return response.data;
    },

    deleteGruppi: async(id: string): Promise<void> => {
        await api.delete(`/v1/gruppi/${id}/`);
    },

    getMembriGruppo: async (gruppoId: string): Promise<Membro[]> => {
        const response = await api.get<Membro[]>(`/v1/gruppi/${gruppoId}/membri/`, {
            params: { gruppo: gruppoId }
        });
        return response.data;
    },

    removeMembro: async (gruppoId: string, userId: string): Promise<{ messaggio: string }> => {
        const response = await api.post(`/v1/gruppi/${gruppoId}/remove-member/`, { user_id: userId });
        return response.data;
    },
}