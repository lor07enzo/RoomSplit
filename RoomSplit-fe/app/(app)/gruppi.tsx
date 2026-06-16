import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Pressable, Platform } from 'react-native';
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

  // Funzione helper per mostrare gli avvisi in modo cross-platform (Web / Mobile)
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message, [{ text: "Ok" }]);
    }
  };

  const handleActionSubmit = async () => {
    if (!inputValue.trim()) return;
    setActionLoading(true);

    try {
      if (modalType === 'create') {
        const success = await createGruppo(inputValue);
        if (success) {
          setModalType('none');
          setInputValue('');
        } else {
          showAlert("Errore", "Impossibile creare il gruppo.");
        }
      } else if (modalType === 'join') {
        const res = await joinGruppo(inputValue.trim());
        
        if (res && res.success) {
          setModalType('none');
          setInputValue('');
        } else {
          const msg = res?.errore || "Codice non valido o sei già membro di questo gruppo.";
          showAlert("Attenzione", msg);
        }
      }
    } catch (err: any) {
      console.error("Errore azione gruppo:", err);

      if (err.response && err.response.status === 400) {
        const backendMsg = 
          err.response.data?.detail || 
          (err.response.data?.non_field_errors && err.response.data.non_field_errors[0]) ||
          "Sei già un membro di questo gruppo o il codice inserito è inesistente.";
        
        showAlert("Attenzione", backendMsg);
      } else {
        showAlert("Errore", "Si è verificato un problema di rete. Riprova più tardi.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-4">
      
      {/* BOTTONI DI AZIONE RAPIDA */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity 
          onPress={() => setModalType('create')}
          className="flex-1 bg-blue-600 flex-row justify-center items-center py-3 rounded-xl shadow-sm"
        >
          <Plus size={18} color="white" />
          <Text className="text-white font-bold ml-2 text-sm">Crea Gruppo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setModalType('join')}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row justify-center items-center py-3 rounded-xl shadow-sm"
        >
          <KeyRound size={18} color="#2563eb" />
          <Text className="text-blue-600 dark:text-blue-400 font-bold ml-2 text-sm">Usa Codice</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DEI GRUPPI */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center mt-20">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={gruppi}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              // FISSAATO: Corretto il path del router per puntare a /gruppi/[id] invece di /gruppo/[id]
              onPress={() => router.push(`/gruppo/${item.id}` as any)}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl mb-3 border border-slate-100 dark:border-slate-700 flex-row items-center justify-between shadow-sm active:opacity-80"
            >
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-xl justify-center items-center mr-4">
                  <Users size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-base" numberOfLines={1}>{item.nome}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Codice: {item.codice_invito}</Text>
                </View>
              </View>
              <ArrowRight size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text className="text-center text-slate-400 mt-20 font-medium px-4">
              Non fai ancora parte di nessun gruppo. Creane uno o unisciti a quelli esistenti!
            </Text>
          }
        />
      )}

      {/* MODAL DI DIALOGO UNICO (Creazione / Accesso) */}
      <Modal visible={modalType !== 'none'} transparent animationType="fade" onRequestClose={() => setModalType('none')}>
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
              className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 mb-5 text-base"
              placeholder={modalType === 'create' ? 'Es. Casa Pescara' : 'Es. RS-XYZ123'}
              placeholderTextColor="#94a3b8"
              autoCapitalize={modalType === 'join' ? 'characters' : 'sentences'}
              value={inputValue}
              onChangeText={(text) => setInputValue(modalType === 'join' ? text.toUpperCase() : text)}
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