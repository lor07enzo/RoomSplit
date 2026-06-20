import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGruppi } from '@/context/GruppiContext';
import { useAuth } from '@/context/AuthContext';
import { GruppiService } from '@/services/gruppi';
import { ListaSpesa, Membro, SaldoMembro, TipologiaRimborso } from '@/types/types';
import { Trash2, ArrowRight, ChevronDown, ChevronUp, ShoppingBag, Share2 } from 'lucide-react-native';
import { useSpese } from '@/context/SpeseContext';
import StoricoSpeseGruppo from '@/components/gruppi/StoricoSpeseGruppo';
import { useListaSpesa } from '@/context/ListaSpesaContext';
import BilanciGruppoScreen from '@/components/gruppi/BilanciGruppo';
import { MembriGruppoWidget } from '@/components/gruppi/MembriGruppo';
import { ModalSaldaDebito } from '@/components/ModalSaldaDebito';

export default function GruppoDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gruppi, removeMembroGruppo, eliminaGruppo } = useGruppi();
  const { spese, fetchSpese, saldiPerGruppo, isLoadingSaldi, fetchSaldi, inviaRimborso } = useSpese();
  const { liste, fetchListeEGruppi } = useListaSpesa();
  
  const [membri, setMembri] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [espansoListe, setEspansoListe] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [membroDaSaldare, setMembroDaSaldare] = useState<SaldoMembro | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const gruppoCorrente = gruppi.find(g => g.id === id);
  const mIOProfiloNelGruppo = membri.find(m => m.user.id === user?.id);
  const sonoAdmin = mIOProfiloNelGruppo?.ruolo === 'admin';
  const saldi = saldiPerGruppo[id] || [];

  const apriModalSalda = (creditore: SaldoMembro) => {
    setMembroDaSaldare(creditore);
    setModalVisible(true);
  };

  const confermaRimborsoGruppo = async (tipologia: TipologiaRimborso, notaFirma: string) => {
    if (!membroDaSaldare || !id || !mIOProfiloNelGruppo) return;
    
    // Calcolo dell'importo esatto da saldare basandosi sul bilancio del creditore
    const importoDaSaldare = Math.abs(parseFloat(membroDaSaldare.bilancio as any)) || 0;
    
    if (importoDaSaldare <= 0) {
      Alert.alert("Attenzione", "L'importo del rimborso deve essere maggiore di zero.");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        from_membro: mIOProfiloNelGruppo.id,
        to_membro: membroDaSaldare.membro_id,
        importo: importoDaSaldare,
        tipologia: tipologia,
        nota: notaFirma.trim() || `Saldato tramite ${tipologia}`
      };

      const esito = await inviaRimborso(payload, id);

      if (esito) {
        Alert.alert("Operazione Completata", "Il rimborso è stato registrato con successo.");
        setModalVisible(false);
        // Ricarica i saldi e le spese del gruppo per aggiornare l'interfaccia grafica
        await Promise.all([
          fetchSaldi(id),
          fetchSpese ? fetchSpese() : Promise.resolve()
        ]);
      } else {
        Alert.alert("Errore", "Impossibile elaborare la richiesta di rimborso.");
      }
    } catch (error) {
      console.error("Errore durante l'invio del rimborso:", error);
      Alert.alert("Errore", "Si è verificato un problema imprevisto.");
    } finally {
      setIsProcessing(false);
    }
  };

  const listeDelGruppo = useMemo(() => {
    return (liste || []).filter(l => {
      if (!l.gruppo) return false;
      const gId = typeof l.gruppo === 'object' ? l.gruppo.id : l.gruppo;
      return gId === id;
    });
  }, [liste, id]);

  const speseDelGruppo = useMemo(() => {
    return spese.filter(s => {
      if (s.is_personale) return false;
      const gruppoId = typeof s.gruppo === 'object' && s.gruppo !== null ? s.gruppo.id : s.gruppo;
      return gruppoId === id;
    });
  }, [spese, id]);

  const caricaDatiGruppo = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await Promise.all([
        GruppiService.getMembriGruppo(id).then(setMembri),
        fetchSaldi(id), 
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
        console.error("Errore eliminazione gruppo:", err);
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

  const chiediConferma = (titolo: string, messaggio: string, testoAzione: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        resolve(window.confirm(messaggio));
      } else {
        Alert.alert(titolo, messaggio, [
          { text: "Annulla", style: "cancel", onPress: () => resolve(false) },
          { text: testoAzione, style: "destructive", onPress: () => resolve(true) }
        ]);
      }
    });
  };

  const handleRemoveUser = async (userId: string, nomeMembro: string, isSelf: boolean) => {
    const titolo = isSelf ? "Abbandona Gruppo" : "Rimuovi Membro";
    const azione = isSelf ? "Esci" : "Rimuovi";
    const messaggio = isSelf 
      ? `Sei sicuro di voler uscire dal gruppo "${gruppoCorrente.nome}"?`
      : `Sei sicuro di voler espellere ${nomeMembro} dal gruppo?`;

    const isConfirmed = await chiediConferma(titolo, messaggio, azione);
    
    if (!isConfirmed) return;

    try {
      await removeMembroGruppo(gruppoCorrente.id, userId);

      if (isSelf) {
        router.replace('/gruppi');
        return; 
      } 
      
      setMembri(prev => prev.filter(m => m.user.id !== userId));
      await fetchSaldi(gruppoCorrente.id); 

    } catch (err) {
      console.error(err);
      Alert.alert("Errore", "Impossibile completare l'operazione.");
    }
  };

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

  const listeDaMostrare = espansoListe ? listeDelGruppo : listeDelGruppo.slice(0, 1);

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" showsVerticalScrollIndicator={false}>
      <View className="w-full max-w-5xl mx-auto p-4 pb-12">
        
        {/* SEZIONE CODICE INVITO (Hero) */}
        <View className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-3xl shadow-md mb-6 relative overflow-hidden">
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

        <View className="flex flex-col md:flex-row md:gap-6">
          {/* COLONNA SINISTRA */}
          <View className="w-full md:flex-1">
            
            {/* RIEPILOGO FINANZIARIO */}
            <BilanciGruppoScreen 
              saldi={saldi} 
              loading={isLoadingSaldi} 
              currentUserId={user?.id} 
              onSaldaPress={apriModalSalda} 
            />

            {/* MODALE DI SALDAMENTO DEBITO */}
            <ModalSaldaDebito
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              nomeCreditore={membroDaSaldare?.nome || ''}
              importo={membroDaSaldare ? Math.abs(parseFloat(membroDaSaldare.bilancio as any)) : 0}
              isProcessing={isProcessing}
              onConfirm={confermaRimborsoGruppo}
            />

            {/* SEZIONE ACCESSO LISTE DELLA SPESA */}
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  LISTE DELLA SPESA ({listeDelGruppo.length})
                </Text>
                
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
          </View>

          {/* COLONNA DESTRA */}
          <View className="w-full md:flex-1">

            {/* ELENCO PARTECIPANTI */}
            <MembriGruppoWidget 
              membri={membri}
              loading={loading}
              currentUser={user}
              sonoAdmin={sonoAdmin}
              onRemoveMembro={handleRemoveUser}
            />

            {/* STORICO DELLE SPESE DEL GRUPPO */}
            <StoricoSpeseGruppo 
              spese={speseDelGruppo}
              membriGruppo={membri}
              onSpesaPress={(spesaId) => router.push(`/spesa/${spesaId}`)} 
            />

          </View>
        </View>

        {/* PULSANTE PER ELIMINARE IL GRUPPO (se Admin) */}
        {sonoAdmin && (
          <View className="bg-red-50 dark:bg-red-950/20 rounded-3xl p-5 border border-red-100 dark:border-red-900/50 shadow-sm mt-4">
            <Text className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">
              Attenzione
            </Text>
            <Text className="text-xs text-red-600 dark:text-red-400/70 mb-5">
              L'eliminazione del gruppo cancellerà in modo permanente tutti i bilanci, i dati di riepilogo e lo storico. Questa azione non può essere annullata.
            </Text>
            <TouchableOpacity
              onPress={handleEliminaGruppo}
              className="bg-red-600 p-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-90"
            >
              <Trash2 size={18} color="white" />
              <Text className="text-white font-bold text-sm">Elimina definitivamente questo gruppo</Text>
            </TouchableOpacity>
          </View>
        )}
        
      </View>
    </ScrollView>
  );
}