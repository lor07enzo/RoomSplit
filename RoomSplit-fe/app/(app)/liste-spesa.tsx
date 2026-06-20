import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ShoppingCart, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import FormCreaLista from '@/components/liste/FormCreaLista';
import SezioneGruppoCard from '@/components/liste/SezioneGruppoCard';
import { useListaSpesa } from '@/context/ListaSpesaContext';
import { raggruppaPerGruppo } from '@/utils/listeUtils';
import ListaCard from '@/components/liste/ListaCard';

const TABLET_BREAKPOINT = 768;

export default function ListeSpeseScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'personali' | 'gruppo'>('personali');
  const { liste, loading, error, fetchListeEGruppi } = useListaSpesa();

  useEffect(() => {
    fetchListeEGruppi();
  }, [fetchListeEGruppi]);

  // Memoizzazione dei dati filtrati e strutturati
  const listePersonali = useMemo(() => liste.filter(l => !l.gruppo), [liste]);
  const listeGruppo = useMemo(() => liste.filter(l => l.gruppo), [liste]);
  const sezioniGruppi = useMemo(() => raggruppaPerGruppo(listeGruppo), [listeGruppo]);

  const handleNavigate = (id: string) => router.push(`/lista-spesa/${id}` as any);

  // Gestione dinamica degli stati logici principali
  const renderContenutoPrincipale = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Caricamento in corso...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 dark:text-red-400 text-center font-medium mb-4">{error}</Text>
          <TouchableOpacity onPress={fetchListeEGruppi} className="bg-blue-600 px-4 py-2 rounded-xl">
            <Text className="text-white font-semibold">Riprova</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isTablet) {
      return (
        <View className="flex-1 flex-row gap-6">
          {/* Colonna Liste Personali */}
          <View className="flex-1 bg-slate-100/40 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
            <View className="flex-row items-center gap-2 mb-4">
              <ShoppingCart size={20} color={isDark ? "#cbd5e1" : "#334155"} />
              <Text className="text-lg font-bold text-slate-700 dark:text-slate-200">Liste Personali ({listePersonali.length})</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {listePersonali.length > 0 ? (
                listePersonali.map((art) => <ListaCard key={`card-${art.id}`} item={art} onPress={() => handleNavigate(art.id as any)} />)
              ) : (
                <Text className="text-slate-400 dark:text-slate-500 italic text-center mt-4">Nessuna lista personale</Text>
              )}
            </ScrollView>
          </View>

          {/* Colonna Liste di Gruppo */}
          <View className="flex-1 bg-indigo-50/20 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
            <View className="flex-row items-center gap-2 mb-4">
              <Users size={20} color={isDark ? "#c7d2fe" : "#1e1b4b"} />
              <Text className="text-lg font-bold text-indigo-950 dark:text-indigo-200">Liste delle Case ({listeGruppo.length})</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {sezioniGruppi.length > 0 ? (
                sezioniGruppi.map((sezione) => <SezioneGruppoCard key={`sec-${sezione.gruppo.id}`} sezione={sezione} isDark={isDark} onNavigate={handleNavigate} />)
              ) : (
                <Text className="text-slate-400 dark:text-slate-500 italic text-center mt-4">Nessuna lista di gruppo attiva</Text>
              )}
            </ScrollView>
          </View>
        </View>
      );
    }

    // Layout Smartphone standard
    return (
      <View className="flex-1">
        <View className="flex-row bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-4">
          <TouchableOpacity 
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'personali' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
            onPress={() => setActiveTab('personali')}
          >
            <Text className={`font-semibold ${activeTab === 'personali' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
              Personali ({listePersonali.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'gruppo' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
            onPress={() => setActiveTab('gruppo')}
          >
            <Text className={`font-semibold ${activeTab === 'gruppo' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
              Di Gruppo ({listeGruppo.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === 'personali' ? (
            listePersonali.length > 0 ? (
              listePersonali.map((art) => <ListaCard key={`card-${art.id}`} item={art} onPress={() => handleNavigate(art.id as any)} />)
            ) : (
              <Text className="text-slate-400 dark:text-slate-500 italic text-center mt-8">Nessuna lista personale</Text>
            )
          ) : (
            sezioniGruppi.length > 0 ? (
              sezioniGruppi.map((sezione) => <SezioneGruppoCard key={`sec-${sezione.gruppo.id}`} sezione={sezione} isDark={isDark} onNavigate={handleNavigate} />)
            ) : (
              <Text className="text-slate-400 dark:text-slate-500 italic text-center mt-8">Nessuna lista di gruppo attiva</Text>
            )
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      {/* HEADER */}
      <View className="mb-6 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Liste della Spesa</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">Gestisci i tuoi acquisti personali e condivisi</Text>
        </View>
      </View>

      {/* CONTENUTO INIETTATO */}
      {renderContenutoPrincipale()}

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
        <View className="flex-1 bg-black/50 dark:bg-black/70 justify-end md:justify-center md:items-center">
          <Pressable onPress={() => setIsFormVisible(false)} className="absolute inset-0" />
          <View className="bg-white dark:bg-slate-900 w-full md:w-[500px] md:max-w-xl p-6 rounded-t-3xl md:rounded-2xl shadow-2xl border-t border-slate-100 dark:border-slate-800 md:border">
            <FormCreaLista onClose={() => setIsFormVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}