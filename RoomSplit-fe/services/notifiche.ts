import { api } from "@/lib/api";


export const getTelegramStatus = async () => {
    const response = await api.get('/v1/notifiche/telegram/status/');
    return response.data;
};

export const generateTelegramToken = async () => {
    const response = await api.post('/v1/notifiche/telegram/generate-token/');
    return response.data;
};

export const apiDisconnectTelegram = async () => {
    const response = await api.delete('/v1/notifiche/telegram/status/');
    return response.data;
};