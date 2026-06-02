import { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import { apiDisconnectTelegram, generateTelegramToken, getTelegramStatus } from "@/services/notifiche";
import { Linking } from "react-native";


interface NotificheContextType {
    isTelegramConnected: boolean;
    loading: boolean;
    error: string | null;
    fetchTelegramStatus: () => Promise<void>;
    connectTelegram: () => Promise<string | null>;
    disconnectTelegram: () => Promise<boolean>;
}

const NotificheContext = createContext<NotificheContextType | undefined>(undefined);

export function NotificheProvider({ children }: { children: React.ReactNode }) {
    const [isTelegramConnected, setIsTelegramConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchTelegramStatus = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            setLoading(true);
            const res = await getTelegramStatus();
            setIsTelegramConnected(res.connected);
        } catch (e) {
            console.error(e);
            setError("Impossibile recuperare lo stato di Telegram.");
        } finally {
            setLoading(false);
        }
    };

    const connectTelegram = async () => {

        try {
            const { token, bot_url } = await generateTelegramToken();
            const url = `${bot_url}?start=${token}`;
            await Linking.openURL(url);
            return token;
        } catch (err) {
            console.error("Errore connesione con Telegram: " + err);
            return null;
        }
    };

    const disconnectTelegram = async () => {
        try {
            await apiDisconnectTelegram();
            setIsTelegramConnected(false);
            return true;
        } catch (err) {
            console.error("Errore disconnessione da Telegram: " + err);
            return false;
        }
    }


    return (
        <NotificheContext.Provider value={{ isTelegramConnected, loading, error, fetchTelegramStatus, connectTelegram, disconnectTelegram}}>
            {children}
        </NotificheContext.Provider>
    );
}

export const useNotifiche = () => {
    const context = useContext(NotificheContext);
    if (context === undefined) {
        throw new Error("useNotifiche deve essere usato all'interno di un NotificheProvider");
    }
    return context;
};