import { useListaSpesa } from '@/context/ListaSpesaContext';
import { House } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, Pressable } from 'react-native';
import { useColorScheme } from 'nativewind';

interface FormCreaListaProps {
  onClose: () => void;
}

export default function FormCreaLista({ onClose }: FormCreaListaProps) {
  const { gruppi, creaNuovaLista } = useListaSpesa();
  const [titolo, setTitolo] = useState('');
  const [isGruppo, setIsGruppo] = useState(false);
  const [selectedGruppoId, setSelectedGruppoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSave = async () => {
    if (!titolo.trim()) return;
    if (isGruppo && !selectedGruppoId) {
      alert('Seleziona un gruppo per questa lista!');
      return;
    }

    try {
      setIsSubmitting(true);
      await creaNuovaLista(titolo, isGruppo ? selectedGruppoId : null);
      onClose();
    } catch (err) {
      alert('Errore durante il salvataggio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Il contenitore eredita il dark mode dal modale genitore, ma rafforziamo i colori qui
    <View className="bg-white dark:bg-slate-900 p-6 rounded-t-3xl shadow-xl border-t border-slate-100 dark:border-slate-800">
      <Text className="text-xl font-bold text-slate-900 dark:text-white mb-4">Nuova Lista della Spesa</Text>

      {/* Input Titolo */}
      <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Nome della lista</Text>
      <TextInput
        value={titolo}
        onChangeText={text => setTitolo(text)}
        placeholder="Es. Spesa per la cena, Prodotti pulizia..."
        placeholderTextColor={isDark ? "#64748b" : "#9ca3af"}
        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-base text-slate-800 dark:text-slate-200 mb-5"
      />

      {/* Switch Personale / Gruppo */}
      <View className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-6">
        <View>
          <Text className="font-semibold text-slate-800 dark:text-slate-200">Lista di Gruppo</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">Condividila con i tuoi coinquilini</Text>
        </View>
        <Switch
          value={isGruppo}
          onValueChange={setIsGruppo}
          trackColor={{ false: isDark ? '#334155' : '#e2e8f0', true: isDark ? '#3b82f6' : '#93c5fd' }}
          thumbColor={isGruppo ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#f4f4f5')}
        />
      </View>

      {/* SELEZIONE GRUPPO ORIZZONTALE */}
      {isGruppo && (
        <View className="mb-6">
          <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Seleziona il gruppo:</Text>
          {gruppi.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4, gap: 8 }}
            >
              {gruppi.map((g) => {
                const isSelected = selectedGruppoId === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => setSelectedGruppoId(g.id)}
                    className={`px-4 py-2.5 rounded-full border ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                        : 'bg-white border-slate-200 active:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:active:bg-slate-700'
                    }`}
                  >
                    <Text className={`font-medium text-sm ${
                      isSelected 
                        ? 'text-white' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {g.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text className="text-xs text-amber-600 dark:text-amber-400 italic">Non sei ancora iscritto a nessun gruppo.</Text>
          )}
        </View>
      )}

      {/* Bottoni Azione */}
      <View className="flex-row gap-3">
        <TouchableOpacity 
          onPress={onClose} 
          className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
        >
          <Text className="text-slate-600 dark:text-slate-300 font-semibold">Annulla</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={!titolo.trim() || isSubmitting}
          className={`flex-1 py-3.5 rounded-xl items-center ${
            titolo.trim() && !isSubmitting 
              ? 'bg-blue-600 dark:bg-blue-500' 
              : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <Text className={`font-semibold ${titolo.trim() && !isSubmitting ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            Crea Lista
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}