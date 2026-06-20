import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { ListaSpesa } from '@/types/types';

interface ListaCardProps {
  item: ListaSpesa;
  onPress: () => void;
}

export default function ListaCard({ item, onPress }: ListaCardProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="p-4 mb-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm active:opacity-70"
    >
      <Text className="text-base font-semibold text-slate-800 dark:text-slate-200">
        {item.titolo}
      </Text>
      <Text className="text-xs text-slate-400 dark:text-slate-500 mt-2">
        Aggiornata il: {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/D'}
      </Text>
    </TouchableOpacity>
  );
}