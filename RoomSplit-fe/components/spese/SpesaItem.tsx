import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { GruppoSpesa } from '@/types/types';
import { Users, User } from 'lucide-react-native';
import { useSpese } from '@/context/SpeseContext';
import { useRouter } from 'expo-router';

interface Props {
  spesa: GruppoSpesa;
}

export default function SpesaItem({ spesa }: Props) {
  const { categorie } = useSpese();
  const router = useRouter();
  // Recupera l'icona e il colore in base al nome della categoria
  const nomeCategoria = spesa.categoria as unknown as string;
  const categoriaReale = categorie.find(c => c.nome === nomeCategoria) || { 
    icona: '💰', 
    colore: '#cbd5e1' 
  };

  // Formatta la data per renderla leggibile 
  const formattedDate = new Date(spesa.created_at || new Date()).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <TouchableOpacity 
      onPress={() => router.push(`/spesa/${spesa.id}` as any)}
      className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4 shadow-sm border border-slate-100 dark:border-slate-700"
    >
      <View className="flex-row items-center">
        
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${categoriaReale.colore}20` }}
        >
          <Text className="text-xl">{categoriaReale.icona}</Text>
        </View>

        <View className="flex-1">
          <Text className="font-bold text-slate-900 dark:text-white text-base" numberOfLines={1}>
            {spesa.nome}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-slate-500 text-xs mr-2">{formattedDate}</Text>
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
              {spesa.is_personale ? (
                <User size={10} color="#64748b" />
              ) : (
                <Users size={10} color="#64748b" />
              )}
              <Text className="text-[10px] text-slate-500 ml-1 font-medium uppercase">
                {spesa.is_personale ? 'Personale' : 'Gruppo'}
              </Text>
            </View>
          </View>
        </View>

        {/* --- SEZIONE IMPORTO E STATO --- */}
        <View className="items-end">
          <Text className="font-bold text-slate-900 dark:text-white text-lg">
            €{Number(spesa.importo).toFixed(2)}
          </Text>
          
          {!spesa.is_personale && (
            spesa.saldata ? (
              <Text className="text-green-500 text-[10px] font-bold uppercase mt-1">Saldata</Text>
            ) : (
              <Text className="text-orange-500 text-[10px] font-bold uppercase mt-1">Pendente</Text>
            )
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}