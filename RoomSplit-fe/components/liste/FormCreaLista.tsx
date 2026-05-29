import { useListaSpesa } from '@/context/ListaSpesaContext';
import { House } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, Pressable } from 'react-native';


interface FormCreaListaProps {
  onClose: () => void;
}

export default function FormCreaLista({ onClose }: FormCreaListaProps) {
  const { gruppi, creaNuovaLista } = useListaSpesa();
  const [titolo, setTitolo] = useState('');
  const [isGruppo, setIsGruppo] = useState(false);
  const [selectedGruppoId, setSelectedGruppoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <View className="bg-white p-6 rounded-t-3xl shadow-xl border-t border-gray-100">
      <Text className="text-xl font-bold text-gray-900 mb-4">Nuova Lista della Spesa</Text>

      {/* Input Titolo */}
      <Text className="text-sm font-semibold text-gray-600 mb-2">Nome della lista</Text>
      <TextInput
        value={titolo}
        onChangeText={setTele => setTitolo(setTele)}
        placeholder="Es. Spesa per la cena, Prodotti pulizia..."
        className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-base text-gray-800 mb-5"
      />

      {/* Switch Personale / Gruppo */}
      <View className="flex-row justify-between items-center bg-gray-50 p-3 rounded-xl mb-6">
        <View>
          <Text className="font-semibold text-gray-800">Lista di Gruppo</Text>
          <Text className="text-xs text-gray-500">Condividila con i tuoi coinquilini</Text>
        </View>
        <Switch
          value={isGruppo}
          onValueChange={setIsGruppo}
          trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
          thumbColor={isGruppo ? '#2563eb' : '#f4f4f5'}
        />
      </View>

      {/* SELEZIONE GRUPPO ORIZZONTALE */}
      {isGruppo && (
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-600 mb-2">Seleziona il gruppo:</Text>
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
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-white border-gray-200 active:bg-gray-50'
                    }`}
                  >
                    <Text className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {g.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text className="text-xs text-amber-600 italic">Non sei ancora iscritto a nessun gruppo.</Text>
          )}
        </View>
      )}

      {/* Bottoni Azione */}
      <View className="flex-row gap-3">
        <TouchableOpacity onPress={onClose} className="flex-1 py-3.5 bg-gray-100 rounded-xl items-center">
          <Text className="text-gray-600 font-semibold">Annulla</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={!titolo.trim() || isSubmitting}
          className={`flex-1 py-3.5 rounded-xl items-center ${titolo.trim() && !isSubmitting ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <Text className="text-white font-semibold">Crea Lista</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}