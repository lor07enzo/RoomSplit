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
    if (id) {
      const fetchAllegato = async () => {
        try {
          const doc = await documentiService.getDocBySpesa(id);
          setAllegato(doc);
        } catch (err) {
          console.error("Errore recupero allegato:", err);
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
    icona: '💰', colore: '#94a3b8' 
  };

  const dataCreazione = new Date(spesa.created_at || new Date()).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Funzione per aprire il file nel browser/visualizzatore di sistema
  const handleOpenExternal = async () => {
    if (!allegato?.file) return;
    try {
      // 'allegato.file' contiene l'URL remoto di Cloudinary
      await Linking.openURL(allegato.file); 
    } catch (err) {
      Alert.alert("Errore", "Impossibile aprire il file con il browser.");
    }
  };

  // Funzione di condivisione file con altre app
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
      // Logica per il Browser
      const confermato = window.confirm(`Sei sicuro di voler eliminare definitivamente "${spesa.nome}"?`);
      if (confermato) {
        executeDelete();
      }
    } else {
      // Logica per Mobile
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
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900">

      {/* HEADER */}
      <View className="bg-white dark:bg-slate-800 p-6 items-center border-b border-slate-200 dark:border-slate-700 pt-10 pb-8">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${categoriaReale.colore}20` }}>
          <Text className="text-3xl">{categoriaReale.icona}</Text>
        </View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-1 text-center">{spesa.nome}</Text>
        <Text className="text-5xl font-black text-slate-900 dark:text-white">€{Number(spesa.importo).toFixed(2)}</Text>
      </View>

      {/* DETTAGLI CARD */}
      <View className="p-4 space-y-4 mt-2 mb-10">
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
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

        {/* DESCRIZIONE */}
        {spesa.descrizione ? (
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <View className="flex-row items-center mb-3"><AlignLeft size={20} color="#64748b" /><Text className="text-slate-700 dark:text-slate-300 font-bold ml-2">Descrizione</Text></View>
            <Text className="text-slate-600 dark:text-slate-400 leading-6">{spesa.descrizione}</Text>
          </View>
        ) : null}

        {/* FILE ALLEGATO (se presente) */}
        {loadingDoc ? (
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 items-center justify-center border border-slate-200 dark:border-slate-700">
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        ) : allegato ? (
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
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

            {/* Pulsanti di interazione col file */}
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={handleOpenExternal}
                className="flex-1 flex-row items-center justify-center bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 py-2.5 rounded-xl"
              >
                <ExternalLink size={16} color="#3b82f6" />
                <Text className="text-blue-600 dark:text-blue-400 font-semibold text-xs ml-2">Visualizza</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleShareFile}
                disabled={isSharing}
                className="flex-1 flex-row items-center justify-center bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 py-2.5 rounded-xl"
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#475569" />
                ) : (
                  <>
                    <Share2 size={16} color="#475569" className="dark:color-slate-300" />
                    <Text className="text-slate-600 dark:text-slate-300 font-semibold text-xs ml-2">Condividi / Apri in...</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* SEZIONE BADGE */}
        <View className="flex-row gap-3">
          {spesa.is_ricorrente && (
            <View className="flex-1 flex-row items-center bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl">
              <Repeat size={18} color="#6366f1" /><Text className="ml-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">Ricorrente</Text>
            </View>
          )}
          {!spesa.is_personale && (
            <View className={`flex-1 flex-row items-center p-3 rounded-xl border ${spesa.saldata ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/30'}`}>
              <Text className={`font-bold text-sm text-center w-full ${spesa.saldata ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                {spesa.saldata ? '✓ SALDATA' : '⚠ DA SALDARE'}
              </Text>
            </View>
          )}
        </View>

        {/* PULSANTI ELIMINA/MODIFICA */}
        <View className="flex-row justify-between gap-4 mt-8 pb-8">
          <TouchableOpacity 
            onPress={() => router.push(`/nuova-spesa?editId=${spesa.id}` as any)}
            className="flex-1 flex-row items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-4 rounded-xl"
          >
            <Edit size={20} color="#475569" />
            <Text className="text-slate-700 dark:text-slate-300 font-bold ml-2">Modifica</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDelete} disabled={isDeleting}
            className="flex-1 flex-row items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl"
          >
            {isDeleting ? <ActivityIndicator color="#ef4444" /> : (
              <><Trash2 size={20} color="#ef4444" /><Text className="text-red-600 dark:text-red-400 font-bold ml-2">Elimina</Text></>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}