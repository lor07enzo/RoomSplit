// app/(app)/gruppi/[id].tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGruppi } from '@/context/GruppiContext';
import { useAuth } from '@/context/AuthContext';
import { GruppiService } from '@/services/gruppi';
import { ListaSpesa, Membro } from '@/types/types';
import { Crown, LogOut, Trash2, ArrowRight, ReceiptText, Copy, Check, ChevronRight, ShoppingBag, Share2, ChevronUp, ChevronDown, User } from 'lucide-react-native';
import { useSpese } from '@/context/SpeseContext';
import { useStatistiche } from '@/context/StatisticheContext';
import * as Clipboard from 'expo-clipboard';
import StoricoSpeseGruppo from '@/components/gruppi/StoricoSpeseGruppo';
import { useListaSpesa } from '@/context/ListaSpesaContext';


export default function GruppoDetailScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gruppi, removeMembroGruppo, eliminaGruppo } = useGruppi();
  const { spese, fetchSpese } = useSpese();
  const { saldi, loadingSaldi, fetchSaldiGruppo } = useStatistiche();
  const { liste, fetchListeEGruppi } = useListaSpesa();
  const [membri, setMembri] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [espansoListe, setEspansoListe] = useState(false);

  const gruppoCorrente = gruppi.find(g => g.id === id);
  // Determina se l'utente loggato è l'admin di questo gruppo specifico
  const mIOProfiloNelGruppo = membri.find(m => m.user.id === currentUser?.id);
  const sonoAdmin = mIOProfiloNelGruppo?.ruolo === 'admin';

  // Filtra le liste della spesa del gruppo corrente
  const listeDelGruppo = useMemo(() => {
    return (liste || []).filter(l => {
      if (!l.gruppo) return false;
      const gId = typeof l.gruppo === 'object' ? l.gruppo.id : l.gruppo;
      return gId === id;
    });
  }, [liste, id]);

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

  // Funzione centralizzata per caricare membri, liste e saldi del gruppo
  const caricaDatiGruppo = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await Promise.all([
        GruppiService.getMembriGruppo(id).then(setMembri),
        fetchSaldiGruppo(id),
        fetchListeEGruppi ? fetchListeEGruppi() : Promise.resolve(),
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

  // Funzione per condividere il codice invito del gruppo
  const handleShareCodice = async () => {
    try {
      await Share.share({
        message: `Entra nel mio gruppo RoomSplit per gestire le spese di casa!\nCodice invito: ${gruppoCorrente.codice_invito}`,
      });
    } catch (error) {
      console.error("Errore condivisione:", error);
    }
  };

  const handleEliminaGruppo = async () => {
    const messaggio = `Sei sicuro di voler eliminare definitivamente il gruppo "${gruppoCorrente.nome}"? Questa azione è irreversibile e cancellerà tutte le spese, i saldi e le liste della spesa collegate.`;

    const eseguiCancellazione = async () => {
      try {
        if (eliminaGruppo) {
          await eliminaGruppo(gruppoCorrente.id);
          fetchSpese();
        } 
        router.replace('/gruppi');
      } catch (err) {
        Alert.alert("Errore", "Impossibile eliminare il gruppo corrente.");
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(messaggio)) eseguiCancellazione();
    } else {
      Alert.alert("Elimina Gruppo", messaggio, [
        { text: "Annulla", style: "cancel" },
        { text: "Elimina Tutto", style: "destructive", onPress: eseguiCancellazione }
      ]);
    }
  };

  // Funzione per rimuovere un membro (o per uscire dal gruppo se è se stesso)
  const handleRemoveUser = async (userId: string, nomeMembro: string, isSelf: boolean) => {
    const titolo = isSelf ? "Abbandona Gruppo" : "Rimuovi Membro";
    const messaggio = isSelf 
      ? `Sei sicuro di voler uscire dal gruppo "${gruppoCorrente.nome}"?`
      : `Sei sicuro di voler espellere ${nomeMembro} dal gruppo?`;

    const eseguiChiamata = async () => {
      try {
        await removeMembroGruppo(gruppoCorrente.id, userId);
        if (isSelf) {
          router.replace('/gruppi');
        } else {
          setMembri(prev => prev.filter(m => m.user.id !== userId));
          await fetchSaldiGruppo(gruppoCorrente.id); 
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

  // Rendering delle card delle liste incorporate nella pagina
  const renderListaInLineCard = (item: ListaSpesa, index: number) => (
    <TouchableOpacity
      key={item.id ? `list-${item.id}` : `list-idx-${index}`}
      onPress={() => router.push(`/lista-spesa/${item.id}`)}
      className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex-row items-center justify-between mb-2 active:bg-slate-100/70"
    >
      <View className="flex-row items-center flex-1 pr-2 gap-3">
        <View className="bg-blue-100 dark:bg-blue-950 p-2 rounded-lg">
          <ShoppingBag size={18} color="#2563eb" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.titolo}</Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            Aggiornata il: {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/D'}
          </Text>
        </View>
      </View>
      <ArrowRight size={14} color="#94a3b8" />
    </TouchableOpacity>
  );

  // Calcola quali liste mostrare in base allo stato di espansione
  const listeDaMostrare = espansoListe ? listeDelGruppo : listeDelGruppo.slice(0, 1);

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900 p-4" showsVerticalScrollIndicator={false}>
      
      {/* SEZIONE CODICE INVITO */}
      <View className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl shadow-md mb-6 relative overflow-hidden">
        {/* Cerchi decorativi stile biglietto (visibili solo se non siamo su layout complessi) */}
        <View className="absolute -left-4 top-1/2 -mt-3 w-7 h-7 bg-slate-50 dark:bg-slate-900 rounded-full" />
        <View className="absolute -right-4 top-1/2 -mt-3 w-7 h-7 bg-slate-50 dark:bg-slate-900 rounded-full" />
        
        <View className="flex-row justify-between items-center px-2">
          <View className="flex-1 pr-4">
            <Text className="text-[12px] font-black text-blue-100 uppercase tracking-widest">Codice Invito</Text>
            <Text className="text-2xl md:text-3xl font-mono font-black text-white mt-1 tracking-wider select-text">
              {gruppoCorrente?.codice_invito || '------'}
            </Text>
            <Text className="text-xs text-blue-100/80 mt-1">
              Fallo usare ai tuoi coinquilini o ai tuoi amici per unire i bilanci.
            </Text>
          </View>

          <TouchableOpacity 
            onPress={handleShareCodice}
            className="w-12 h-12 rounded-xl items-center justify-center bg-white/15 active:scale-95 border border-white/20"
          >
            <Share2 size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEZIONE ACCESSO LISTE DELLA SPESA */}
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            LISTE DELLA SPESA ({listeDelGruppo.length})
          </Text>
          
          {/* Mostra il pulsante di attivazione dinamico solo se ci sono più liste */}
          {listeDelGruppo.length > 1 && (
            <TouchableOpacity 
              onPress={() => setEspansoListe(!espansoListe)}
              className="flex-row items-center gap-1 py-1 px-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg active:opacity-60"
            >
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {espansoListe ? "Mostra meno" : "Vedi tutto"}
              </Text>
              {espansoListe ? <ChevronUp size={14} color="#2563eb" /> : <ChevronDown size={14} color="#2563eb" />}
            </TouchableOpacity>
          )}
        </View>

        {/* Corpo delle liste */}
        {listeDelGruppo.length === 0 ? (
          <View className="py-4 items-center justify-center">
            <Text className="text-sm italic text-slate-400 text-center">Nessuna lista creata per questa casa.</Text>
          </View>
        ) : (
          <View className="mt-1">
            {listeDaMostrare.map((lista, idx) => renderListaInLineCard(lista, idx))}
          </View>
        )}
      </View>

      {/* RIEPILOGO FINANZIARIO */}
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
              return (
                <View key={membro.utente_id} className="flex-row items-center justify-between py-1.5">
                  <View className="flex-row items-center">
                    <View className={`w-2 h-2 rounded-full mr-3 ${isCredit ? 'bg-emerald-500' : isDebt ? 'bg-orange-500' : 'bg-slate-300'}`} />
                    <Text className="text-slate-800 dark:text-slate-200 font-medium text-sm">{membro.nome}</Text>
                  </View>
                  <View className="items-end">
                    {isCredit && <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Deve ricevere €{bilancio.toFixed(2)}</Text>}
                    {isDebt && <Text className="text-orange-600 dark:text-orange-400 font-bold text-sm">Deve dare €{Math.abs(bilancio).toFixed(2)}</Text>}
                    {bilancio === 0 && <Text className="text-slate-400 dark:text-slate-500 text-sm font-medium">In pari</Text>}
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
              const avatarMembro = membro.user.avatar || membro.user.nome ? membro.user.nome.charAt(0).toUpperCase() : null;
              return (
                <View key={membro.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex-row items-center justify-between shadow-sm mb-2">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 justify-center items-center mr-3">
                      {avatarMembro ? (
                        <Text className="text-slate-700 dark:text-slate-300 font-bold">{avatarMembro}</Text>
                      ) : (
                        <User size={20} color="#64748b" />
                      )}
                    </View>
                    <View>
                      <Text className="text-slate-900 dark:text-white font-semibold text-sm">{membro.user.nome} {membro.user.cognome || ''} {isMe && '(Tu)'}</Text>
                      {membroAdmin && (
                        <View className="flex-row items-center mt-0.5">
                          <Crown size={12} color="#eab308" />
                          <Text className="text-[10px] text-yellow-600 font-medium ml-1">Amministratore</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {isMe ? (
                    <TouchableOpacity onPress={() => handleRemoveUser(membro.user.id, membro.user.nome, true)} className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <LogOut size={16} color="#ef4444" />
                    </TouchableOpacity>
                  ) : (
                    sonoAdmin && !membroAdmin && (
                      <TouchableOpacity onPress={() => handleRemoveUser(membro.user.id, membro.user.nome, false)} className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg">
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
      <StoricoSpeseGruppo 
        spese={speseDelGruppo} 
        onSpesaPress={(spesaId) => router.push(`/spesa/${spesaId}`)} 
      />

      {/* PULSANTE PER ELIMINARE IL GRUPPO (se Admin) */}
      {sonoAdmin && (
        <View className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-4 border border-red-100 dark:border-red-900/50 shadow-sm mb-12">
          <Text className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">
            Attenzione
          </Text>
          <Text className="text-xs text-red-600 dark:text-red-400/70 mb-4">
            L'eliminazione del gruppo cancellerà in modo permanente tutti i bilanci, i dati di riepilogo e lo storico. Questa azione non può essere annullata.
          </Text>
          <TouchableOpacity
            onPress={handleEliminaGruppo}
            className="bg-red-600 p-3.5 rounded-xl flex-row items-center justify-center gap-2 active:opacity-90"
          >
            <Trash2 size={18} color="white" />
            <Text className="text-white font-bold text-sm">Elimina definitivamente questo gruppo</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}