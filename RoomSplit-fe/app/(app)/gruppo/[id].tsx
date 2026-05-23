// app/(app)/gruppi/[id].tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGruppi } from '@/context/GruppiContext';
import { useAuth } from '@/context/AuthContext';
import { GruppiService } from '@/services/gruppi';
import { Membro } from '@/types/types';
import { Share2, Crown, LogOut, Trash2, ArrowRight, ReceiptText } from 'lucide-react-native';
import { useSpese } from '@/context/SpeseContext';
import { useStatistiche } from '@/context/StatisticheContext';


export default function GruppoDetailScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gruppi } = useGruppi();
  const { spese, fetchSpese } = useSpese();
  const { saldi, loadingSaldi, fetchSaldiGruppo } = useStatistiche();
  const [membri, setMembri] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);

  const gruppoCorrente = gruppi.find(g => g.id === id);
  // Determina se l'utente loggato è l'admin di questo gruppo specifico
  const mIOProfiloNelGruppo = membri.find(m => m.user.id === currentUser?.id);
  const sonoAdmin = mIOProfiloNelGruppo?.ruolo === 'admin';

  // Filtra le spese del gruppo corrente
  const speseDelGruppo = useMemo(() => {
    return spese.filter(s => {

      if (s.is_personale) return false;
      const gruppoId = typeof s.gruppo === 'object' && s.gruppo !== null 
        ? s.gruppo.id 
        : s.gruppo;
        
      return gruppoId === id;
    });
  }, [spese, id]);

  // Calcola la somma totale del gruppo basandosi direttamente sui saldi di Django
  const totaleSpesoNelGruppo = useMemo(() => {
    return saldi.reduce((acc, curr) => acc + (parseFloat(curr.pagato_totale) || 0), 0);
  }, [saldi]);

  // Funzione centralizzata per caricare sia i membri che i saldi del gruppo
  const caricaDatiGruppo = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await Promise.all([
        GruppiService.getMembriGruppo(id).then(setMembri),
        fetchSaldiGruppo(id),
        fetchSpese ? fetchSpese() : Promise.resolve()
      ]);
    } catch (err) {
      console.error("Errore caricamento dati del gruppo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    caricaDatiGruppo();
  }, [id]); 

  if (!gruppoCorrente) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900 justify-center items-center">
        <Text className="text-slate-400">Gruppo non trovato.</Text>
      </View>
    );
  }

  const handleShareCodice = async () => {
    try {
      await Share.share({
        message: `Entra nel mio gruppo RoomSplit per gestire le spese di casa!\nCodice invito: ${gruppoCorrente.codice_invito}`,
      });
    } catch (error) {
      console.error("Errore condivisione:", error);
    }
  };

  const handleRemoveUser = async (userId: string, nomeMembro: string, isSelf: boolean) => {
    const titolo = isSelf ? "Abbandona Gruppo" : "Rimuovi Membro";
    const messaggio = isSelf 
      ? `Sei sicuro di voler uscire dal gruppo "${gruppoCorrente.nome}"?`
      : `Sei sicuro di voler espellere ${nomeMembro} dal gruppo?`;

    const eseguiChiamata = async () => {
      try {
        await GruppiService.removeMembro(gruppoCorrente.id, userId);
        if (isSelf) {
          router.replace('/gruppi');
        } else {
          setMembri(prev => prev.filter(m => m.user.id !== userId));
          await fetchSaldiGruppo(gruppoCorrente.id); // Ricalcola i saldi dopo l'espulsione
        }
      } catch (err) {
        Alert.alert("Errore", "Impossibile completare l'operazione.");
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(messaggio)) eseguiChiamata();
    } else {
      Alert.alert(titolo, messaggio, [
        { text: "Annulla", style: "cancel" },
        { text: isSelf ? "Esci" : "Rimuovi", style: "destructive", onPress: eseguiChiamata }
      ]);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900 p-4" showsVerticalScrollIndicator={false}>
      
      {/* SEZIONE CODICE INVITO */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 items-center shadow-sm mb-6 mt-2">
        <Text className="text-slate-400 font-medium text-xs tracking-wider uppercase mb-1">Codice Invito del Gruppo</Text>
        <Text className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-widest my-2 selection:bg-blue-100">
          {gruppoCorrente.codice_invito}
        </Text>
        
        <TouchableOpacity 
          onPress={handleShareCodice}
          className="mt-3 flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl"
        >
          <Share2 size={16} color="#475569" /><Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs ml-2">Condividi Codice</Text>
        </TouchableOpacity>
      </View>

      {/* SEZIONE RIEPILOGO FINANZIARIO */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm mb-6">
        <View className="flex-row justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">BILANCIO ATTUALE</Text>
          <View className="bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
              Totale: €{totaleSpesoNelGruppo.toFixed(2)}
            </Text>
          </View>
        </View>

        {loadingSaldi ? (
          <ActivityIndicator size="small" color="#3b82f6" className="py-4" />
        ) : (
          <View className="space-y-3">
            {saldi.map((membro) => {
              const bilancio = parseFloat(membro.bilancio) || 0;
              const isCredit = bilancio > 0;
              const isDebt = bilancio < 0;
              const isEven = bilancio === 0;

              return (
                // CORREZIONE: usiamo membro.utente_id e membro.nome piatti inviati da Django
                <View key={membro.utente_id} className="flex-row items-center justify-between py-1.5">
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-3 ${isCredit ? 'bg-emerald-500' : isDebt ? 'bg-orange-500' : 'bg-slate-300'}`} />
                    <Text className="text-slate-800 dark:text-slate-200 font-medium text-sm">{membro.nome}</Text>
                  </View>

                  <View className="items-end">
                    {isCredit && (
                      <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        Deve ricevere €{bilancio.toFixed(2)}
                      </Text>
                    )}
                    {isDebt && (
                      <Text className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                        Deve dare €{Math.abs(bilancio).toFixed(2)}
                      </Text>
                    )}
                    {isEven && (
                      <Text className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                        In pari
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ELENCO PARTECIPANTI */}
      <View className="mb-10">
        <Text className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-3 ml-1">Membri del Gruppo ({membri.length})</Text>

        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" className="py-6" />
        ) : (
          <View className="space-y-2">
            {membri.map((membro) => {
              const isMe = membro.user.id === currentUser?.id;
              const membroAdmin = membro.ruolo === 'admin';

              return (
                <View 
                  key={membro.id}
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex-row items-center justify-between shadow-sm mb-2"
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 justify-center items-center mr-3">
                      <Text className="text-slate-700 dark:text-slate-300 font-bold">{membro.user.nome[0].toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                        {membro.user.nome} {membro.user.cognome || ''} {isMe && '(Tu)'}
                      </Text>
                      {membroAdmin && (
                        <View className="flex-row items-center mt-0.5">
                          <Crown size={12} color="#eab308" />
                          <Text className="text-[10px] text-yellow-600 font-medium ml-1">Amministratore</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {isMe ? (
                    <TouchableOpacity 
                      onPress={() => handleRemoveUser(membro.user.id, membro.user.nome, true)}
                      className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg"
                    >
                      <LogOut size={16} color="#ef4444" />
                    </TouchableOpacity>
                  ) : (
                    sonoAdmin && !membroAdmin && (
                      <TouchableOpacity 
                        onPress={() => handleRemoveUser(membro.user.id, membro.user.nome, false)}
                        className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg"
                      >
                        <Trash2 size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    )
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* STORICO DELLE SPESE DEL GRUPPO */}
      <View className="mb-12">
        <Text className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-3 ml-1">
          Storico Spese del Gruppo ({speseDelGruppo.length})
        </Text>

        {speseDelGruppo.length === 0 ? (
          <View className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 items-center justify-center">
            <ReceiptText size={32} color="#94a3b8" />
            <Text className="text-slate-400 text-sm mt-2 text-center">Nessuna spesa caricata in questo gruppo.</Text>
          </View>
        ) : (
          <View>
            {speseDelGruppo.map((spesa) => {
              const dataFormattata = new Date(spesa.created_at).toLocaleDateString('it-IT', {
                day: 'numeric', month: 'short'
              });

              return (
                <TouchableOpacity
                  key={spesa.id}
                  onPress={() => router.push(`/spesa/${spesa.id}`)}
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex-row items-center justify-between shadow-sm mb-2 active:opacity-80"
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg items-center justify-center mr-3 min-w-[45px]">
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{dataFormattata}</Text>
                    </View>
                    
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white font-semibold text-sm" numberOfLines={1}>
                        {spesa.nome}
                      </Text>
                      <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
                        {spesa.descrizione || 'Nessuna descrizione'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-black text-slate-900 dark:text-white">
                      €{Number(spesa.importo).toFixed(2)}
                    </Text>
                    <ArrowRight size={14} color="#cbd5e1" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}