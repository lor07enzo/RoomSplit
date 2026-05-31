import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSpese } from '@/context/SpeseContext';
import { Calendar, AlignLeft, Users, User, Repeat, Edit, Trash2, Share2, ExternalLink, FileText, Paperclip } from 'lucide-react-native';
import { documentiService } from '@/services/documenti';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


export default function SpesaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { spese, categorie, removeSpesa } = useSpese();
  const [isDeleting, setIsDeleting] = useState(false);
  const [allegato, setAllegato] = useState<any | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const spesa = spese.find(s => s.id === id);

  useEffect(() => {
    setAllegato(null);
    setLoadingDoc(true);

    if (id) {
      const fetchAllegato = async () => {
        try {
          const doc = await documentiService.getDocBySpesa(id);
          setAllegato(doc);
        } catch (err) {
          console.error("Errore recupero allegato:", err);
          setAllegato(null);
        } finally {
          setLoadingDoc(false);
        }
      };
      fetchAllegato();
    }
  }, [id]);

  if (!spesa) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900 justify-center items-center">
        <Stack.Screen options={{ title: 'Errore' }} />
        <Text className="text-slate-500">Spesa non trovata</Text>
      </View>
    );
  }

  const nomeCategoria = spesa.categoria as unknown as string;
  const categoriaReale = categorie.find(c => c.nome === nomeCategoria) || { 
    id: 'fallback',
    nome: nomeCategoria || 'Altro',
    icona: 'DollarSign', colore: '#94a3b8' 
  };

  const dataCreazione = new Date(spesa.created_at || new Date()).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const handleOpenExternal = async () => {
    if (!allegato?.file) return;
    try {
      await Linking.openURL(allegato.file); 
    } catch (err) {
      Alert.alert("Errore", "Impossibile aprire il file con il browser.");
    }
  };

  const handleShareFile = async () => {
    if (!allegato?.file) return;
    
    if (Platform.OS === 'web') {
      handleOpenExternal();
      return;
    }

    setIsSharing(true);
    try {
      const cacheDir = (FileSystem as any).cacheDirectory;

      if (!cacheDir) {
        Alert.alert("Errore", "Cartella temporanea non trovata sul dispositivo.");
        return;
      }
      const localUri = `${cacheDir}${allegato.nome_file}`;
      const { uri } = await FileSystem.downloadAsync(allegato.file, localUri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: allegato.tipo_file,
          dialogTitle: `Condividi scontrino: ${allegato.nome_file}`,
        });
      } else {
        Alert.alert("Non supportato", "La condivisione nativa non è disponibile su questo dispositivo.");
      }
    } catch (err) {
      console.error("Errore condivisione file:", err);
      Alert.alert("Errore", "Impossibile elaborare e condividere l'allegato.");
    } finally {
      setIsSharing(false);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    const success = await removeSpesa(spesa.id);
    
    if (success) {
      router.back();
    } else {
      setIsDeleting(false);
      if (Platform.OS === 'web') {
        alert("Impossibile eliminare la spesa.");
      } else {
        Alert.alert("Errore", "Impossibile eliminare la spesa.");
      }
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confermato = window.confirm(`Sei sicuro di voler eliminare definitivamente "${spesa.nome}"?`);
      if (confermato) {
        executeDelete();
      }
    } else {
      Alert.alert(
        "Elimina Spesa",
        `Sei sicuro di voler eliminare definitivamente "${spesa.nome}"?`,
        [
          { text: "Annulla", style: "cancel" },
          { text: "Elimina", style: "destructive", onPress: executeDelete }
        ]
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" showsVerticalScrollIndicator={false}>
      
      {/* Contenitore principale limitato e centrato */}
      <View className="w-full max-w-4xl mx-auto pb-12">
        
        {/* HEADER (Adattato con bordi arrotondati laterali su tablet) */}
        <View className="bg-white dark:bg-slate-800 p-6 items-center border-b border-slate-200 dark:border-slate-700 pt-10 pb-8 md:mt-4 md:rounded-3xl md:border md:shadow-sm md:mx-4">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${categoriaReale.colore}20` }}>
            <Text className="text-3xl">{categoriaReale.icona}</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-1 text-center">{spesa.nome}</Text>
          <Text className="text-5xl font-black text-slate-900 dark:text-white">€{Number(spesa.importo).toFixed(2)}</Text>
        </View>

        {/* CONTENUTO PRINCIPALE A GRIGLIA */}
        <View className="p-4 mt-2">
          <View className="md:flex-row md:gap-6">
            
            {/* COLONNA SINISTRA: Dettagli e Info Base */}
            <View className="md:flex-1 flex-col gap-4">
              <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                  <View className="flex-row items-center"><Calendar size={20} color="#64748b" /><Text className="text-slate-600 dark:text-slate-400 font-medium ml-3">Data</Text></View>
                  <Text className="text-slate-900 dark:text-white font-semibold capitalize">{dataCreazione}</Text>
                </View>
                <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                  <View className="flex-row items-center"><View className="w-5 h-5 rounded-full mr-3" style={{ backgroundColor: categoriaReale.colore }} /><Text className="text-slate-600 dark:text-slate-400 font-medium">Categoria</Text></View>
                  <Text className="font-bold" style={{ color: categoriaReale.colore }}>{categoriaReale.nome}</Text>
                </View>
                <View className="flex-row items-center justify-between pb-2">
                  <View className="flex-row items-center">
                    {spesa.is_personale ? <User size={20} color="#64748b" /> : <Users size={20} color="#64748b" />}
                    <Text className="text-slate-600 dark:text-slate-400 font-medium ml-3">Tipologia</Text>
                  </View>
                  <Text className="text-slate-900 dark:text-white font-semibold">{spesa.is_personale ? 'Personale' : 'Condivisa (Gruppo)'}</Text>
                </View>
              </View>

              {/* SEZIONE BADGE */}
              {spesa.is_ricorrente && (
                <View className="flex-row gap-3">
                  <View className="flex-1 flex-row items-center bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 p-4 rounded-2xl shadow-sm">
                    <Repeat size={20} color="#6366f1" />
                    <Text className="ml-3 text-indigo-700 dark:text-indigo-300 font-bold text-sm">Spesa Ricorrente</Text>
                  </View>
                </View>
              )}
            </View>

            {/* COLONNA DESTRA: Descrizione e Allegati */}
            <View className="md:flex-1 flex-col gap-4 mt-4 md:mt-0">
              
              {/* DESCRIZIONE */}
              {spesa.descrizione ? (
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <View className="flex-row items-center mb-3"><AlignLeft size={20} color="#64748b" /><Text className="text-slate-700 dark:text-slate-300 font-bold ml-2">Descrizione</Text></View>
                  <Text className="text-slate-600 dark:text-slate-400 leading-6">{spesa.descrizione}</Text>
                </View>
              ) : null}

              {/* FILE ALLEGATO */}
              {loadingDoc ? (
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                  <ActivityIndicator size="small" color="#3b82f6" />
                </View>
              ) : allegato ? (
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <View className="flex-row items-center mb-4">
                    <Paperclip size={20} color="#3b82f6" />
                    <Text className="text-slate-700 dark:text-slate-300 font-bold ml-2">Documento Allegato</Text>
                  </View>
                  
                  <View className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1 pr-3">
                      <FileText size={24} color="#64748b" />
                      <View className="ml-3 flex-1">
                        <Text className="text-slate-800 dark:text-slate-200 font-semibold text-sm" numberOfLines={1}>
                          {allegato.nome_file}
                        </Text>
                        <Text className="text-xs text-slate-400 mt-0.5">
                          {allegato.tipo_file.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity 
                      onPress={handleOpenExternal}
                      className="flex-1 flex-row items-center justify-center bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 py-3 rounded-xl active:opacity-80"
                    >
                      <ExternalLink size={16} color="#3b82f6" />
                      <Text className="text-blue-600 dark:text-blue-400 font-semibold text-xs ml-2">Visualizza</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={handleShareFile}
                      disabled={isSharing}
                      className="flex-1 flex-row items-center justify-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 py-3 rounded-xl active:opacity-80"
                    >
                      {isSharing ? (
                        <ActivityIndicator size="small" color="#475569" />
                      ) : (
                        <>
                          <Share2 size={16} color="#475569" className="dark:color-slate-300" />
                          <Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs ml-2">Condividi</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>

          </View>

          {/* PULSANTI ELIMINA/MODIFICA (In fondo, occupano tutta la larghezza) */}
          <View className="flex-row justify-between gap-4 mt-8 pb-4 md:mt-10">
            <TouchableOpacity 
              onPress={() => router.push(`/nuova-spesa?editId=${spesa.id}` as any)}
              className="flex-1 flex-row items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-4 rounded-2xl shadow-sm active:opacity-80"
            >
              <Edit size={20} color="#475569" />
              <Text className="text-slate-700 dark:text-slate-300 font-bold ml-2 text-base">Modifica</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleDelete} disabled={isDeleting}
              className="flex-1 flex-row items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl shadow-sm active:opacity-80"
            >
              {isDeleting ? <ActivityIndicator color="#ef4444" /> : (
                <><Trash2 size={20} color="#ef4444" /><Text className="text-red-600 dark:text-red-400 font-bold ml-2 text-base">Elimina</Text></>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}