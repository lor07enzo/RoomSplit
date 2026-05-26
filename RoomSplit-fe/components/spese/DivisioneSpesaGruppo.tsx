import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { useGruppi } from '@/context/GruppiContext';
import { GruppiService } from '@/services/gruppi';
import { Membro } from '@/types/types';
import { Users, CheckCircle2, Circle } from 'lucide-react-native';

interface DivisioneSpesaProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export default function DivisioneSpesaGruppoScreen({ watch, setValue }: DivisioneSpesaProps) {
  const { gruppi, fetchGruppi } = useGruppi();
  const [membri, setMembri] = useState<Membro[]>([]);
  const [loadingMembri, setLoadingMembri] = useState(false);
  
  const [tipoDivisione, setTipoDivisione] = useState<'tutti' | 'selezionati'>('tutti');
  const [membriSelezionati, setMembriSelezionati] = useState<string[]>([]); // Conterrà gli ID degli User

  const selectedGruppoId = watch('gruppo');

  useEffect(() => {
    fetchGruppi();
  }, []);

  // Quando viene selezionato un gruppo, scarica i membri reali
  useEffect(() => {
    if (selectedGruppoId) {
      setLoadingMembri(true);
      GruppiService.getMembriGruppo(selectedGruppoId)
        .then((data) => {
          setMembri(data);
          const allUserIds = data.map(m => m.user.id);
          setMembriSelezionati(allUserIds);
          setTipoDivisione('tutti');
        })
        .catch((err) => console.error("Errore fetch membri:", err))
        .finally(() => setLoadingMembri(false));
    }
  }, [selectedGruppoId]);

  // Sincronizza la selezione con react-hook-form
  useEffect(() => {
    setValue('debitori', membriSelezionati);
  }, [membriSelezionati, setValue]);

  const toggleMembro = (userId: string) => {
    if (membriSelezionati.includes(userId)) {
      if (membriSelezionati.length === 1) return; // Almeno un debitore deve esserci
      setMembriSelezionati(prev => prev.filter(id => id !== userId));
    } else {
      setMembriSelezionati(prev => [...prev, userId]);
    }
  };

  const handleImpostaTutti = () => {
    setTipoDivisione('tutti');
    setMembriSelezionati(membri.map(m => m.user.id));
  };

  if (gruppi.length === 0) {
    return <Text className="text-sm text-slate-400 italic ml-1">Non sei iscritto a nessun gruppo.</Text>;
  }

  return (
    <View className="mb-8 mt-6">
      <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-3 ml-1">Condividi con il Gruppo</Text>
      
      {/* SELEZIONE DELLA CARD DEL GRUPPO */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
        {gruppi.map((g) => {
          const isSelected = selectedGruppoId === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              onPress={() => setValue('gruppo', g.id)}
              className={`flex-row items-center px-4 py-2 rounded-xl mr-3 border ${
                isSelected 
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Users size={16} color={isSelected ? "#1d4ed8" : "#64748b"} className="mr-2" />
              <Text className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
                {g.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SEZIONE PARTECIPANTI (Dinamica) */}
      {!!selectedGruppoId && (
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 mt-2">
          <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">DIVISIONE SPESA</Text>
          
          <View className="flex-row bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-4">
            <TouchableOpacity 
              onPress={handleImpostaTutti}
              className={`flex-1 py-2 rounded-lg items-center ${tipoDivisione === 'tutti' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}
            >
              <Text className={`font-semibold text-xs ${tipoDivisione === 'tutti' ? 'text-blue-600' : 'text-slate-500'}`}>Tutti</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTipoDivisione('selezionati')}
              className={`flex-1 py-2 rounded-lg items-center ${tipoDivisione === 'selezionati' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}
            >
              <Text className={`font-semibold text-xs ${tipoDivisione === 'selezionati' ? 'text-blue-600' : 'text-slate-500'}`}>Seleziona Membri</Text>
            </TouchableOpacity>
          </View>

          {loadingMembri ? (
            <ActivityIndicator size="small" color="#3b82f6" className="py-4" />
          ) : (
            <View className="space-y-2">
              {membri.map((membro) => {
                const isChecked = membriSelezionati.includes(membro.user.id);
                const disabilitato = tipoDivisione === 'tutti';

                return (
                  <TouchableOpacity
                    key={membro.id}
                    disabled={disabilitato}
                    onPress={() => toggleMembro(membro.user.id)}
                    className={`flex-row items-center justify-between p-3 rounded-xl border ${
                      isChecked ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100' : 'border-transparent opacity-50'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <Text className="text-blue-700 font-bold text-xs">{membro.user.nome[0].toUpperCase()}</Text>
                      </View>
                      <Text className="text-slate-800 dark:text-slate-200 font-medium">
                        {membro.user.nome} {membro.user.cognome || ''}
                      </Text>
                    </View>

                    {tipoDivisione === 'selezionati' && (
                      <View>
                        {isChecked ? (
                          <CheckCircle2 size={20} color="#3b82f6" />
                        ) : (
                          <Circle size={20} color="#cbd5e1" />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}