// app/(app)/gruppi/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useGruppi } from '@/context/GruppiContext';
import { useRouter } from 'expo-router';
import { Plus, Users, KeyRound, ArrowRight } from 'lucide-react-native';

export default function GruppiScreen() {
  const { gruppi, isLoading, fetchGruppi, createGruppo, joinGruppo } = useGruppi();
  const router = useRouter();

  const [modalType, setModalType] = useState<'none' | 'create' | 'join'>('none');
  const [inputValue, setInputValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchGruppi();
  }, [fetchGruppi]);

  const handleActionSubmit = async () => {
    if (!inputValue.trim()) return;
    setActionLoading(true);

    if (modalType === 'create') {
      const success = await createGruppo(inputValue);
      if (success) {
        setModalType('none');
        setInputValue('');
      } else {
        Alert.alert("Errore", "Impossibile creare il gruppo.");
      }
    } else if (modalType === 'join') {
      const res = await joinGruppo(inputValue.trim());
      if (res.success) {
        setModalType('none');
        setInputValue('');
      } else {
        Alert.alert("Attenzione", res.errore);
      }
    }
    setActionLoading(false);
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-4">
      
      {/* BOTTONI DI AZIONE RAPIDA */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity 
          onPress={() => setModalType('create')}
          className="flex-1 bg-blue-600 flex-row justify-center items-center py-3 rounded-xl shadow-sm"
        >
          <Plus size={18} color="white" /><Text className="text-white font-bold ml-2 text-sm">Crea Gruppo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setModalType('join')}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row justify-center items-center py-3 rounded-xl shadow-sm"
        >
          <KeyRound size={18} color="#2563eb" /><Text className="text-blue-600 dark:text-blue-400 font-bold ml-2 text-sm">Usa Codice</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DEI GRUPPI */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#3b82f6" className="mt-20" />
      ) : (
        <FlatList
          data={gruppi}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/gruppo/${item.id}` as any)}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 border border-slate-100 dark:border-slate-700 flex-row items-center justify-between shadow-sm active:opacity-80"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-xl justify-center items-center mr-4">
                  <Users size={24} color="#3b82f6" />
                </View>
                <View>
                  <Text className="text-slate-900 dark:text-white font-bold text-base">{item.nome}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Codice: {item.codice_invito}</Text>
                </View>
              </View>
              <ArrowRight size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text className="text-center text-slate-400 mt-20">Non fai ancora parte di nessun gruppo. Creane uno o unisciti!</Text>
          }
        />
      )}

      {/* MODAL DI DIALOGO UNICO (Creazione / Accesso) */}
      <Modal visible={modalType !== 'none'} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/40 justify-center items-center p-4" onPress={() => setModalType('none')}>
          <Pressable className="bg-white dark:bg-slate-800 w-full max-w-[340px] p-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {modalType === 'create' ? 'Crea un nuovo gruppo' : 'Entra in un gruppo'}
            </Text>
            <Text className="text-xs text-slate-400 mb-4">
              {modalType === 'create' ? 'Dai un nome alla stanza per iniziare a dividere le spese.' : 'Inserisci il codice univoco che ti ha inviato un tuo coinquilino.'}
            </Text>

            <TextInput
              autoFocus
              className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 mb-5"
              placeholder={modalType === 'create' ? 'Es. Casa Pescara' : 'Es. RS-XYZ123'}
              placeholderTextColor="#94a3b8"
              value={inputValue}
              onChangeText={setInputValue}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setModalType('none')} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl items-center">
                <Text className="text-slate-600 dark:text-slate-300 font-semibold">Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleActionSubmit} disabled={actionLoading} className="flex-1 py-3 bg-blue-600 rounded-xl items-center">
                {actionLoading ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold">Conferma</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}