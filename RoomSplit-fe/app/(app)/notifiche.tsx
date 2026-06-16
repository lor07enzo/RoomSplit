import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Send, CheckCircle2, Trash2 } from 'lucide-react-native';
import { useNotifiche } from '@/context/NotificheContext';
import { useCallback } from 'react';

export default function NotificheScreen() {
  const { isTelegramConnected, loading, fetchTelegramStatus, connectTelegram, disconnectTelegram} = useNotifiche();

  // useFocusEffect per aggiornare lo stato quando l'utente torna su questa schermata
  useFocusEffect(
    useCallback(() => {
      fetchTelegramStatus();
    }, [])
  );

  const handleConnect = async () => {
    try {
      const tokenGenerato = await connectTelegram();
      
      if (tokenGenerato) {
        const messaggio = `Telegram dovrebbe collegarsi in automatico.\n\nSe nella chat vedi solo "/start", invia manualmente questo codice:\n\n${tokenGenerato}`;
        
        if (Platform.OS === 'web') {
          window.alert(messaggio);
        } else {
          Alert.alert("Fase Finale", messaggio);
        }
      } else {
        Platform.OS === 'web' ? window.alert("Errore: Impossibile generare il token.") : Alert.alert("Errore", "Impossibile generare il token.");
      }
    } catch (e) {
      Platform.OS === 'web' ? window.alert("Errore: Impossibile avviare la procedura.") : Alert.alert("Errore", "Impossibile avviare la procedura.");
    }
  };

  const eseguiDisconnessione = async () => {
    try {
      const success = await disconnectTelegram();
      if (success) {
        Platform.OS === 'web' ? window.alert("Notifiche disattivate con successo.") : Alert.alert("Successo", "Notifiche disattivate.");
      } else {
        Platform.OS === 'web' ? window.alert("Errore durante la disconnessione.") : Alert.alert("Errore", "Si è verificato un problema durante la disconnessione.");
      }
    } catch (e) {
      Platform.OS === 'web' ? window.alert("Impossibile scollegare l'account.") : Alert.alert("Errore", "Impossibile scollegare l'account.");
    }
  };

  const handleDisconnect = async () => {
    const messaggio = "Vuoi davvero scollegare il tuo account Telegram? Non riceverai più notifiche sulle spese.";

    if (Platform.OS === 'web') {
      const confermato = window.confirm(messaggio);
      if (confermato) {
        await eseguiDisconnessione();
      }
    } else {
      Alert.alert(
        "Conferma",
        messaggio,
        [
          { text: "Annulla", style: "cancel" },
          { 
            text: "Scollega", 
            style: "destructive",
            onPress: () => eseguiDisconnessione()
          }
        ]
      );
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator /></View>;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 items-center">
      <View className="w-full max-w-lg">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Notifiche</Text>

        <View className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <Text className="font-bold text-slate-800 dark:text-slate-200 mb-1">Telegram</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6">Ricevi aggiornamenti in tempo reale su spese e rimborsi.</Text>

          {isTelegramConnected ? (
            <View className="gap-4">
              <View className="flex-row items-center gap-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle2 size={20} color="#16a34a" />
                <Text className="text-green-700 dark:text-green-400 font-medium">Account collegato</Text>
              </View>
              <TouchableOpacity onPress={handleDisconnect} className="flex-row items-center justify-center gap-2 p-4 border border-red-200 dark:border-red-900/50 rounded-xl">
                <Trash2 size={18} color="#ef4444" />
                <Text className="text-red-500 font-bold">Scollega account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleConnect} className="bg-blue-600 p-4 rounded-xl flex-row items-center justify-center gap-3">
              <Send size={20} color="white" />
              <Text className="text-white font-bold text-lg">Collega Telegram</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}