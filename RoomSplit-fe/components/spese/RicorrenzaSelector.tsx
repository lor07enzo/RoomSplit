import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Repeat } from 'lucide-react-native';

interface Props {
  numero: string;
  tipo: string;
  onChangeNumero: (val: string) => void;
  onChangeTipo: (val: string) => void;
}

export default function RicorrenzaSelector({ numero, tipo, onChangeNumero, onChangeTipo }: Props) {
  const opzioniPeriodo = [
    { id: 'giorni', label: 'Giorni' },
    { id: 'settimane', label: 'Sett.' },
    { id: 'mesi', label: 'Mesi' },
    { id: 'anni', label: 'Anni' },
  ];

  const handleTextChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    onChangeNumero(numericValue);
  };

  return (
    <View className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 mt-3">
      
      {/* Intestazione */}
      <View className="flex-row items-center mb-5">
        <Repeat size={18} color="#6366f1" />
        <Text className="text-indigo-900 dark:text-indigo-200 font-bold ml-2">Frequenza Ripetizione</Text>
      </View>
      
      {/* Riga Input Numerico (Ora distribuita sui lati e con larghezza fissa) */}
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-slate-700 dark:text-slate-300 font-semibold text-base">
          Ripeti ogni:
        </Text>
        
        {/* Larghezza fissa (w-20) ed altezza fissa (h-12) bloccano l'espansione */}
        <View className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-20 h-12 justify-center overflow-hidden shadow-sm">
          <TextInput
            className="text-xl font-bold text-slate-900 dark:text-white text-center w-full h-full"
            keyboardType="number-pad"
            value={numero}
            onChangeText={handleTextChange}
            maxLength={2}
            placeholder="1"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Selettori del Periodo (Ottimizzati per non strabordare) */}
      <View className="flex-row justify-between gap-1.5">
        {opzioniPeriodo.map((opzione) => {
          const isSelected = tipo === opzione.id;
          return (
             <TouchableOpacity
              key={opzione.id}
              onPress={() => onChangeTipo(opzione.id)}
              className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                isSelected 
                  ? 'bg-indigo-500 border-indigo-500' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text 
                className={`font-semibold text-[13px] ${
                  isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
                numberOfLines={1}
              >
                {opzione.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}