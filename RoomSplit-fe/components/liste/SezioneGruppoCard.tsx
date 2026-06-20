import React from 'react';
import { View, Text } from 'react-native';
import { Home } from 'lucide-react-native';
import { Gruppo, ListaSpesa } from '@/types/types';
import ListaCard from './ListaCard';

interface SezioneGruppoCardProps {
  sezione: { gruppo: Gruppo; items: ListaSpesa[] };
  isDark: boolean;
  onNavigate: (id: string) => void;
}

export default function SezioneGruppoCard({ sezione, isDark, onNavigate }: SezioneGruppoCardProps) {
  return (
    <View className="mb-6 bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/30 dark:border-slate-700/50">
      <View className="flex-row items-center gap-2 mb-3 px-1">
        <View className="bg-indigo-100 dark:bg-indigo-900/40 p-1.5 rounded-lg">
          <Home size={16} color={isDark ? "#818cf8" : "#4f46e5"} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {sezione.gruppo?.nome || 'Caricamento gruppo...'}
          </Text>
          {sezione.gruppo?.codice_invito ? (
            <Text className="text-[10px] text-slate-400 dark:text-slate-500">
              Codice casa: {sezione.gruppo.codice_invito}
            </Text>
          ) : null}
        </View>
        <View className="bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
          <Text className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            {sezione.items.length}
          </Text>
        </View>
      </View>

      {sezione.items.map((art) => (
        <ListaCard 
          key={`card-${art.id}`} 
          item={art} 
          onPress={() => onNavigate(art.id as any)} 
        />
      ))}
    </View>
  );
}