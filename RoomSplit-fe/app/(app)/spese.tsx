import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Search, Plus, Receipt } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSpese } from '@/context/SpeseContext';
import SpesaItem from '@/components/spese/SpesaItem';

export default function SpeseScreen() {
  const router = useRouter();
  const { spese, isLoading } = useSpese(); 
  const [filter, setFilter] = useState<'tutte' | 'gruppo' | 'personali'>('tutte');
  const [searchQuery, setSearchQuery] = useState('');

  // Logica per filtrare le spese in base alla ricerca e ai tab
  const speseFiltrate = useMemo(() => {
    return spese.filter(spesa => {
      const testoSpesa = `${spesa.nome} ${spesa.descrizione || ''}`.toLowerCase();
      const matchSearch = testoSpesa.includes(searchQuery.toLowerCase());
      
      const matchFilter = 
        filter === 'tutte' ? true : 
        filter === 'personali' ? spesa.is_personale : !spesa.is_personale;
        
      return matchSearch && matchFilter;
    });
  }, [spese, searchQuery, filter]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      
      {/* Barra di Ricerca e Filtri */}
      <View className="px-4 pt-4 pb-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl mb-4">
          <Search size={20} color="#64748b" />
          <TextInput
            placeholder="Cerca spesa..."
            className="flex-1 ml-2 text-slate-900 dark:text-white"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="flex-row gap-2 pb-2">
          {['tutte', 'gruppo', 'personali'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full border ${
                filter === f 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text className={`capitalize font-medium ${filter === f ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista delle Spese */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={speseFiltrate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => <SpesaItem spesa={item} />}
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
              <Receipt size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-4">Nessuna spesa trovata</Text>
            </View>
          }
        />
      )}

      {/* FAB che apre nuova-spesa.tsx */}
      <TouchableOpacity 
        onPress={() => router.push('/nuova-spesa')}
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={30} color="white" />
      </TouchableOpacity>
      
    </View>
  );
}