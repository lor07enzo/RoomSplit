import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, useWindowDimensions, ActivityIndicator, Pressable, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, CheckCircle, Circle, Trash2, CreditCard, ShoppingCart, User, Home, Sparkles, AlertTriangle } from 'lucide-react-native';
import { Articolo } from '@/types/types';
import { useListaSpesa } from '@/context/ListaSpesaContext';

const TABLET_BREAKPOINT = 768;

export default function ListaSpesaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const { 
    articoli, currentLista, loadingArticoli, 
    fetchDettaglioLista, aggiungiArticolo, toggleArticolo, cancellaArticolo, cancellaLista 
  } = useListaSpesa();
  
  const [nuovoArticolo, setNuovoArticolo] = useState('');
  const [quantita, setQuantita] = useState('1');

  useEffect(() => {
    if (id) fetchDettaglioLista(id);
  }, [id, fetchDettaglioLista]);

  const handleAddArticolo = async () => {
    if (!nuovoArticolo.trim() || !id) return;
    try {
      const qty = parseInt(quantita) || 1;
      await aggiungiArticolo(id, nuovoArticolo, qty);
      setNuovoArticolo('');
      setQuantita('1');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArticolo = async (artId: string) => {
    try {
      await cancellaArticolo(artId);
    } catch (err) {
      Alert.alert("Errore", "Impossibile eliminare l'articolo");
    }
  };

  const handleConvertToExpense = () => {
    if (!id || giaPresi.length === 0) return;
    
    const descrizioneArticoli = giaPresi
      .map(art => `${art.nome} x${art.quantita}`)
      .join(', ');

    const isPersonale = !currentLista?.gruppo;

    router.push({
      pathname: '/nuova-spesa',
      params: { 
        nome: currentLista?.titolo || '',
        descrizione: descrizioneArticoli,
        gruppo: currentLista?.gruppo?.id || '',
        is_personale: isPersonale ? 'true' : 'false',
        fromListaId: id
      }
    });
  };

  const handleDeleteLista = () => {
    if (!id || !currentLista) return;

    const messaggio = `Sei sicuro di voler eliminare definitivamente la lista "${currentLista.titolo}"? Tutti i prodotti al suo interno verranno persi.`;

    const eseguiCancellazione = async () => {
      try {
        await cancellaLista(id);
        router.replace('/liste-spesa'); 
      } catch (err) {
        Alert.alert("Errore", "Impossibile eliminare la lista corrente.");
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(messaggio)) eseguiCancellazione();
    } else {
      Alert.alert("Elimina Lista", messaggio, [
        { text: "Annulla", style: "cancel" },
        { text: "Elimina", style: "destructive", onPress: eseguiCancellazione }
      ]);
    }
  };

  if (loadingArticoli) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const daPrendere = (articoli || []).filter(art => !art.preso_da);
  const giaPresi = (articoli || []).filter(art => art.preso_da);

  const renderArticoloRow = (item: Articolo, index: number) => {
    const isPreso = !!item.preso_da;
    return (
      <View 
        key={item.id ? `art-${item.id}` : `index-${index}`} 
        className={`flex-row items-center justify-between p-4 mb-2 bg-white rounded-xl border border-gray-100 shadow-sm ${
          isPreso ? 'opacity-60 bg-gray-50/50' : ''
        }`}
      >
        <View className="flex-row items-center flex-1 gap-3">
          <Pressable onPress={() => toggleArticolo(item.id, isPreso)} className="active:scale-90">
            {isPreso ? (
              <CheckCircle size={24} color="#2563eb" />
            ) : (
              <Circle size={24} color="#94a3b8" />
            )}
          </Pressable>
          
          <View className="flex-1">
            <Text className={`text-base font-semibold text-gray-800 ${isPreso ? 'line-through text-gray-400' : ''}`}>
              {item.nome}
            </Text>
            
            {/* Sostituito omino ed emoji carrello con icone Lucid vettoriali */}
            <View className="flex-row items-center flex-wrap gap-x-2 mt-1">
              <View className="flex-row items-center gap-1">
                <User size={12} color="#94a3b8" />
                <Text className="text-xs text-gray-400">{item.inserito_da?.nome || 'Utente'}</Text>
              </View>
              
              {isPreso && item.preso_da && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs text-gray-300">•</Text>
                  <ShoppingCart size={12} color="#2563eb" />
                  <Text className="text-xs text-blue-600 font-medium">Preso da: {item.preso_da?.nome || 'Utente'}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200/40">
            <Text className="text-xs font-bold text-gray-600">x{item.quantita}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleDeleteArticolo(item.id)}
            className="p-1 rounded-lg active:opacity-50"
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderExpenseConversionBanner = () => {
    if (giaPresi.length === 0) return null;
    const isPersonale = !currentLista?.gruppo;
    
    return (
      <View className="mb-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl flex-row justify-between items-center shadow-sm">
        <View className="flex-1 pr-3">
          <Text className="text-blue-900 dark:text-blue-200 font-bold text-sm md:text-base">Pronto per la cassa?</Text>
          <Text className="text-blue-700 dark:text-blue-400 text-xs md:text-sm mt-0.5">
            {isPersonale 
              ? `Registra i ${giaPresi.length} articoli presi come spesa personale.`
              : `Registra i ${giaPresi.length} articles presi come spesa di gruppo.`}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleConvertToExpense}
          className="bg-blue-600 px-4 py-2.5 rounded-xl flex-row items-center gap-2 active:scale-95"
        >
          <CreditCard size={16} color="white" />
          <Text className="text-white text-xs font-bold">
            {isPersonale ? 'Registra' : 'Dividi Costo'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      
      {/* HEADER SUPERIORE */}
      <View className="bg-white py-4 px-5 md:py-6 md:px-8 border-b border-gray-100 shadow-sm flex-row justify-between items-center">
        <View>
          <Text className="text-xl md:text-2xl font-bold text-gray-900">{currentLista?.titolo}</Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            {currentLista?.gruppo ? (
              <>
                <Home size={13} color="#94a3b8" />
                <Text className="text-xs font-semibold text-gray-400">Area comune: {currentLista.gruppo.nome}</Text>
              </>
            ) : (
              <>
                <User size={13} color="#94a3b8" />
                <Text className="text-xs font-semibold text-gray-400">Spazio Personale</Text>
              </>
            )}
          </View>
        </View>
        
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            onPress={handleDeleteLista}
            className="p-2.5 bg-red-50 rounded-xl border border-red-100 active:opacity-60"
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>

          {isTablet && (
            <View className={`px-4 py-2 rounded-full border ${currentLista?.gruppo ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
              <Text className={`text-xs font-bold ${currentLista?.gruppo ? 'text-blue-700' : 'text-gray-600'}`}>
                {currentLista?.gruppo ? 'Lista Condivisa' : 'Lista Personale'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* CONTENUTO RESPONSIVE */}
      <View className="flex-1 p-4 md:p-6 pb-36">
        {isTablet ? (
          <View className="flex-1 flex-row gap-6">
            
            {/* Colonna Da Prendere */}
            <View className="flex-1 bg-gray-100/40 p-5 rounded-2xl border border-gray-200/50">
              <View className="flex-row items-center gap-2 mb-4">
                <ShoppingCart size={18} color="#475569" />
                <Text className="text-base font-bold text-gray-700">Da prendere ({daPrendere.length})</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {daPrendere.length > 0 ? (
                  daPrendere.map((art, index) => renderArticoloRow(art, index))
                ) : (
                  <View className="flex-row items-center justify-center gap-2 mt-4">
                    <Sparkles size={16} color="#94a3b8" />
                    <Text className="text-gray-400 italic text-center">Tutto preso! Ottimo lavoro</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Colonna Già Presi */}
            <View className="flex-1 bg-gray-100/40 p-5 rounded-2xl border border-gray-200/50">
              <View className="flex-row items-center gap-2 mb-4">
                <CheckCircle size={18} color="#94a3b8" />
                <Text className="text-base font-bold text-gray-400">Messi nel carrello ({giaPresi.length})</Text>
              </View>
              
              {renderExpenseConversionBanner()}

              <ScrollView showsVerticalScrollIndicator={false}>
                {giaPresi.length > 0 ? (
                  giaPresi.map((art, index) => renderArticoloRow(art, index))
                ) : (
                  <Text className="text-gray-400 italic text-center mt-4">Il carrello è vuoto</Text>
                )}
              </ScrollView>
            </View>
          </View>
        ) : (
          /* LAYOUT SMARTPHONE */
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {renderExpenseConversionBanner()}

            {daPrendere.map((art, index) => renderArticoloRow(art, index))}
            
            {giaPresi.length > 0 && (
              <View className="mt-5 mb-2 border-t border-gray-200 pt-4 flex-row items-center gap-2">
                <CheckCircle size={14} color="#94a3b8" />
                <Text className="text-sm font-bold text-gray-400">Già presi ({giaPresi.length})</Text>
              </View>
            )}
            
            {giaPresi.map((art, index) => renderArticoloRow(art, index))}

            {articoli.length === 0 && (
              <Text className="text-gray-400 italic text-center mt-12">La lista è vuota. Inizia ad aggiungere prodotti!</Text>
            )}
          </ScrollView>
        )}
      </View>

      {/* INPUT BAR */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-8 z-50 shadow-2xl md:bottom-6 md:left-auto md:right-auto md:w-[650px] md:self-center md:rounded-2xl md:border md:p-4">
        <View className="flex-row gap-1.5 md:gap-2 items-center w-full">
          {/* Aggiunto min-w-0 e text-sm per impedire la forzatura della larghezza su smartphone */}
          <TextInput
            value={nuovoArticolo}
            onChangeText={setNuovoArticolo}
            placeholder="Aggiungi articolo..."
            placeholderTextColor="#94a3b8"
            className="flex-1 min-w-0 bg-gray-50 border border-gray-200 px-3 py-2.5 md:p-3 rounded-xl text-sm md:text-base text-gray-800"
          />
          
          <TextInput
            value={quantita}
            onChangeText={setQuantita}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor="#94a3b8"
            className="w-12 md:w-16 bg-gray-50 border border-gray-200 py-2.5 md:p-3 rounded-xl text-center text-sm md:text-base font-bold text-gray-700"
          />

          <TouchableOpacity 
            onPress={handleAddArticolo}
            disabled={!nuovoArticolo.trim()}
            className={`w-11 h-11 md:w-12 md:h-12 rounded-xl items-center justify-center active:scale-95 ${
              nuovoArticolo.trim() ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <Plus size={22} color={nuovoArticolo.trim() ? 'white' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}