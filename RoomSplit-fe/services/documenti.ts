import { api } from "@/lib/api";
import { Documento } from "@/types/types";
import { Platform } from "react-native";


export const documentiService = {
    // Endpoint per l'upload del PDF/Immagine della bolletta
    uploadDocumento: async (asset: any): Promise<Documento> => {
        const formData = new FormData();
    
        if (Platform.OS === 'web') {
            // SU WEB: Passiamo direttamente il file HTML nativo
            formData.append('file', asset.file);
        } else {

            // @ts-ignore - Necessario per far accettare il formato file a React Native FormData
            formData.append('file', {
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType || 'image/jpeg',
            });
        }

        formData.append('nome_file', asset.name);
        formData.append('tipo_file', asset.mimeType || 'application/octet-stream');

        const response = await api.post('/v1/documenti/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Chiede a Django lo stato aggiornato del documento
    checkStatus: async (id: string): Promise<Documento> => {
        const response = await api.get<Documento>(`/v1/documenti/${id}/`);
        return response.data;
    },

    // Metodo per recuperare il documento di una singola spesa
    getDocBySpesa: async (gruppoSpesaId: string): Promise<Documento | null> => {
        const response = await api.get<Documento[]>('/v1/documenti/', {
            params: { gruppo_spesa: gruppoSpesaId }
        });

        if (response.data && response.data.length > 0) {
            return response.data[0];
        }
        return null;
    },
}