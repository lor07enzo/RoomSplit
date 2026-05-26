import FormCreaLista from '@/components/liste/FormCreaLista';
import { useListaSpesa } from '@/context/ListaSpesaContext';
import { Gruppo, ListaSpesa } from '@/types/types';
import { useRouter } from 'expo-router';
import { Home, House, Plus, ShoppingCart, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions, Modal, Pressable, ActivityIndicator } from 'react-native';

// Breakpoint per rilevare i tablet
const TABLET_BREAKPOINT = 768;

export default function ListeSpeseScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'personali' | 'gruppo'>('personali');
  const { liste, loading, error, fetchListeEGruppi } = useListaSpesa();

  // Filtra le liste in base alla presenza del gruppo
  const listePersonali = liste.filter(l => !l.gruppo);
  const listeGruppo = liste.filter(l => l.gruppo);

  useEffect(() => {
    fetchListeEGruppi();
  }, [fetchListeEGruppi]);

  const sezioniGruppi = Object.values(
    listeGruppo.reduce((acc, item) => {
      if (!item.gruppo) return acc;
      
      const gruppoId = typeof item.gruppo === 'object' ? item.gruppo.id : item.gruppo;
      if (!gruppoId) return acc;

      if (!acc[gruppoId]) {
        acc[gruppoId] = { 
          gruppo: typeof item.gruppo === 'object' 
            ? item.gruppo 
            : { 
                id: gruppoId, 
                nome: `Gruppo ${gruppoId}`, 
                codice_invito: '', 
                created_at: '' 
              }, 
          items: [] 
        };
      }
      acc[gruppoId].items.push(item);
      return acc;
    }, {} as Record<string, { gruppo: Gruppo; items: ListaSpesa[] }>)
  );

  // Renderizza la singola scheda della lista
  const renderListaCard = (item: ListaSpesa, index: number) => (
    <TouchableOpacity 
      key={item.id ? `card-${item.id}` : `card-idx-${index}`} 
      onPress={() => router.push(`/lista-spesa/${item.id}` as any)}
      className="p-4 mb-3 bg-white rounded-xl border border-gray-100 shadow-sm active:opacity-70"
    >
      <Text className="text-base font-semibold text-gray-800">{item.titolo}</Text>
      <Text className="text-xs text-gray-400 mt-2">
        Aggiornata il: {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/D'}
      </Text>
    </TouchableOpacity>
  );

  const renderSezioneGruppo = (sezione: { gruppo: Gruppo; items: ListaSpesa[] }, index: number) => (
    <View 
      key={sezione.gruppo?.id ? `sec-${sezione.gruppo.id}` : `sec-idx-${index}`} 
      className="mb-6 bg-white/40 p-3 rounded-2xl border border-gray-200/30"
    >
      <View className="flex-row items-center gap-2 mb-3 px-1">
        <View className="bg-indigo-100 p-1.5 rounded-lg">
          <Home size={16} color="#4f46e5" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            {sezione.gruppo?.nome || 'Caricamento gruppo...'}
          </Text>
          {sezione.gruppo?.codice_invito ? (
            <Text className="text-[10px] text-gray-400">Codice casa: {sezione.gruppo.codice_invito}</Text>
          ) : null}
        </View>
        <View className="bg-indigo-50 px-2 py-0.5 rounded-full">
          <Text className="text-[10px] font-bold text-indigo-600">{sezione.items.length}</Text>
        </View>
      </View>

      {sezione.items.map((art, idx) => renderListaCard(art, idx))}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4 md:p-8">
      {/* HEADER */}
      <View className="mb-6 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl md:text-3xl font-bold text-gray-900">Liste della Spesa</Text>
          <Text className="text-sm text-gray-500">Gestisci i tuoi acquisti personali e condivisi</Text>
        </View>
      </View>

      {/* STATI LOGICI */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-2 font-medium">Caricamento in corso...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center font-medium mb-4">{error}</Text>
          <TouchableOpacity onPress={fetchListeEGruppi} className="bg-blue-600 px-4 py-2 rounded-xl">
            <Text className="text-white font-semibold">Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* CONTENUTO RESPONSIVE */
        isTablet ? (
          <View className="flex-1 flex-row gap-6">
            {/* Colonna Liste Personali */}
            <View className="flex-1 bg-gray-100/40 p-5 rounded-2xl border border-gray-200/50">
              <View className="flex-row items-center gap-2 mb-4">
                <ShoppingCart size={20}/>
                <Text className="text-lg font-bold text-gray-700">Liste Personali ({listePersonali.length})</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {listePersonali.length > 0 ? (
                  listePersonali.map((art, idx) => renderListaCard(art, idx))
                ) : (
                  <Text className="text-gray-400 italic text-center mt-4">Nessuna lista personale</Text>
                )}
              </ScrollView>
            </View>

            {/* Colonna Liste di Gruppo */}
            <View className="flex-1 bg-indigo-50/20 p-5 rounded-2xl border border-indigo-100/50">
              <View className="flex-row items-center gap-2 mb-4">
                <Users size={20} />
                <Text className="text-lg font-bold text-indigo-950">Liste delle Case ({listeGruppo.length})</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {sezioniGruppi.length > 0 ? (
                  sezioniGruppi.map((sezione, idx) => renderSezioneGruppo(sezione, idx))
                ) : (
                  <Text className="text-gray-400 italic text-center mt-4">Nessuna lista di gruppo attiva</Text>
                )}
              </ScrollView>
            </View>
          </View>
        ) : (
          /* LAYOUT SMARTPHONE */
          <View className="flex-1">
            <View className="flex-row bg-gray-200 p-1 rounded-xl mb-4">
              <TouchableOpacity 
                className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'personali' ? 'bg-white shadow' : ''}`}
                onPress={() => setActiveTab('personali')}
              >
                <Text className={`font-semibold ${activeTab === 'personali' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Personali ({listePersonali.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'gruppo' ? 'bg-white shadow' : ''}`}
                onPress={() => setActiveTab('gruppo')}
              >
                <Text className={`font-semibold ${activeTab === 'gruppo' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Di Gruppo ({listeGruppo.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeTab === 'personali' ? (
                listePersonali.length > 0 ? (
                  listePersonali.map((art, idx) => renderListaCard(art, idx))
                ) : (
                  <Text className="text-gray-400 italic text-center mt-8">Nessuna lista personale</Text>
                )
              ) : (
                sezioniGruppi.length > 0 ? (
                  sezioniGruppi.map((sezione, idx) => renderSezioneGruppo(sezione, idx))
                ) : (
                  <Text className="text-gray-400 italic text-center mt-8">Nessuna lista di gruppo attiva</Text>
                )
              )}
            </ScrollView>
          </View>
        )
      )}

      {/* FAB */}
      <TouchableOpacity 
        onPress={() => setIsFormVisible(true)}
        className="absolute bottom-6 right-6 md:bottom-8 md:right-8 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg active:scale-95"
      >
        <Plus size={30} color="white" />
      </TouchableOpacity>

      {/* MODAL RESPONSIVE */}
      <Modal
        transparent={true}
        visible={isFormVisible}
        animationType="slide"
        onRequestClose={() => setIsFormVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end md:justify-center md:items-center">
          <Pressable onPress={() => setIsFormVisible(false)} className="absolute inset-0" />
          <View className="bg-white w-full md:w-[500px] md:max-w-xl p-6 rounded-t-3xl md:rounded-2xl shadow-2xl">
            <FormCreaLista onClose={() => setIsFormVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}