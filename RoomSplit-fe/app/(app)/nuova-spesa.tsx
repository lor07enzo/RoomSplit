import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useSpese } from '@/context/SpeseContext'; 
import { Euro, AlignLeft, Check, Type, Users } from 'lucide-react-native';
import { Documento } from '@/types/types';
import UploadDocumento from '@/components/spese/UploadDocumento';
import { documentiService } from '@/services/documenti';
import RicorrenzaSelector from '@/components/spese/RicorrenzaSelector';


// TODO: Sostituire questo mock con i gruppi reali provenienti dal Context o Backend
const GRUPPI_MOCK = [
  { id: '1', nome: 'Casa Studenti' },
  { id: '2', nome: 'Vacanze Estive' },
];

interface FormDataSpese {
  nome: string;
  descrizione: string;
  importo: string;
  categoria: string;
  gruppo: string;
  is_personale: boolean;
  is_ricorrente: boolean;
  frequenza_numero: string;
  frequenza_tipo: string;
}

export default function NuovaSpesaScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { addSpesa, updateSpesa, spese, categorie, isLoadingCategorie } = useSpese(); 
  const [fetchedDocument, setFetchedDocument] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentoId, setDocumentoId] = useState<string | null>(null);
  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormDataSpese>({
    defaultValues: {
      nome: '',
      descrizione: '',
      importo: '',
      categoria: '',
      gruppo: GRUPPI_MOCK[0]?.nome || '',
      is_personale: false,
      is_ricorrente: false,
      frequenza_numero: '1', 
      frequenza_tipo: 'mesi',
    }
  });

  const selectedCategoria = watch('categoria');
  const selectedGruppo = watch('gruppo');
  const isPersonale = watch('is_personale');
  const isRicorrente = watch('is_ricorrente');

  useEffect(() => {
    if (editId && spese.length > 0) {
      const spesaDaModificare = spese.find(s => s.id === editId);
      if (spesaDaModificare) {
        reset({
          nome: spesaDaModificare.nome,
          descrizione: spesaDaModificare.descrizione || '',
          importo: spesaDaModificare.importo.toString(),
          categoria: spesaDaModificare.categoria as unknown as string,
          is_personale: spesaDaModificare.is_personale,
          is_ricorrente: spesaDaModificare.is_ricorrente,
        });

        const fetchAllegato = async () => {
          try {
            const doc = await documentiService.getDocBySpesa(editId);
            if (doc) {
              setFetchedDocument(doc);
              setDocumentoId(doc.id);
            }
          } catch (err) {
            console.error("Errore durante il recupero dell'allegato:", err);
          }
        };
        fetchAllegato();
      }
    }
  }, [editId, spese]);

  const handleDocumentoCaricato = (doc: any) => {
    if (!doc) {
      setDocumentoId(null);
      return;
    }

    setDocumentoId(doc.id);
    
    if ( doc && doc.importo_estratto) {
      setValue('importo', doc.importo_estratto.toString());
    }
  };

  const onSubmit = async (data: FormDataSpese) => {
    setIsSubmitting(true);
    
    const payload = {
      ...data,
      importo: parseFloat(data.importo.replace(',', '.')),
      documento_id: documentoId,
      frequenza_valore: data.is_ricorrente ? parseInt(data.frequenza_numero) : null,
      frequenza_tipo: data.is_ricorrente ? data.frequenza_tipo : null,
    };

    let success;
    if (editId) {
      // Se è presente un'ID
      success = await updateSpesa(editId, payload);
    } else {
      // Altrimenti fa una CREATE
      success = await addSpesa(payload as any); //TODO: rimuovere "as any" quando creo i gruppi
    }

    setIsSubmitting(false);
    
    if (success) {
      router.back();
    } else {
      alert("Errore durante il salvataggio.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" keyboardShouldPersistTaps="handled">
      <View className="p-4 pt-8 pb-12">
        
        {/* --- IMPORTO --- */}
        <View className="mb-10 w-full items-center">
          <Text className="text-slate-500 dark:text-slate-400 font-medium mb-3">Importo Totale</Text>
          
          <View className="flex-row items-center justify-center border-b-2 border-blue-500 pb-2 min-w-[150px]">
            <View className="mr-2">
              <Euro size={36} color="#3b82f6" />
            </View>
            
            <Controller
              control={control}
              rules={{ required: "L'importo è obbligatorio", pattern: /^[0-9.,]+$/ }}
              name="importo"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="text-5xl font-bold text-slate-900 dark:text-white text-center min-w-[100px]"
                  placeholder="0.00"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="decimal-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  maxLength={10} 
                />
              )}
            />
          </View>
          {errors.importo && <Text className="text-red-500 text-xs mt-2">{errors.importo.message}</Text>}
        </View>
        
        {/* DOCUMENTO */}
        <UploadDocumento onDocumentUploaded={handleDocumentoCaricato} initialDocument={fetchedDocument} />

        {/* TITOLO SPESA */}
        <View className="mb-4">
          <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Titolo</Text>
          <View className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 flex-row items-center">
            <Type size={20} color="#94a3b8" />
            <Controller
              control={control}
              rules={{ required: "Il titolo è obbligatorio" }}
              name="nome"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
                  placeholder="Es. Spesa Esselunga"
                  placeholderTextColor="#94a3b8"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>
          {errors.nome && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.nome.message}</Text>}
        </View>

        {/* DESCRIZIONE */}
        <View className="mb-6">
          <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Dettagli / Descrizione</Text>
          <View className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 flex-row items-center">
            <AlignLeft size={20} color="#94a3b8" />
            <Controller
              control={control}
              name="descrizione"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
                  placeholder="Es. Pasta e sugo"
                  placeholderTextColor="#94a3b8"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>
        </View>

        {/* CATEGORIA */}
        <View className="mb-6">
          <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Categoria</Text>

          {isLoadingCategorie ? (
               <ActivityIndicator size="small" color="#3b82f6" className="ml-2 self-start" />
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingRight: 20, paddingBottom: 4 }}
                className="flex-row"
              >
                {categorie.map((cat) => {
                  const isSelected = selectedCategoria === cat.nome;
                  
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setValue('categoria', cat.nome)}
                      className="flex-row items-center px-4 py-2 rounded-full mr-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      style={isSelected ? {
                        // Aggiunge il 15% di opacità allo sfondo del bottone
                        backgroundColor: `${cat.colore}15`, 
                        borderColor: cat.colore,
                      } : {}}
                    >
                      <Text className="mr-2 text-base">{cat.icona}</Text>
                      <Text
                        className={`font-semibold text-sm ${isSelected ? '' : 'text-slate-600 dark:text-slate-400'}`}
                        style={isSelected ? { color: cat.colore } : {}}
                      >
                        {cat.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
        </View>

        {/* OPZIONI (Personale / Ricorrente) */}
        <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
          <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Spesa Personale</Text>
            <Controller
              control={control}
              name="is_personale"
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} trackColor={{ false: '#cbd5e1', true: '#3b82f6' }} />
              )}
            />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Spesa Ricorrente</Text>
            <Controller
              control={control}
              name="is_ricorrente"
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} trackColor={{ false: '#cbd5e1', true: '#6366f1' }} />
              )}
            />
          </View>
          
          {/* MOSTRA IL SELETTORE SOLO SE LA SPESA E' RICORRENTE */}
          {isRicorrente && (
            <Controller
              control={control}
              name="frequenza_numero"
              render={({ field: { onChange: onNumChange, value: numValue } }) => (
                <Controller
                  control={control}
                  name="frequenza_tipo"
                  render={({ field: { onChange: onTipoChange, value: tipoValue } }) => (
                    <RicorrenzaSelector
                      numero={numValue}
                      tipo={tipoValue}
                      onChangeNumero={onNumChange}
                      onChangeTipo={onTipoChange}
                    />
                  )}
                />
              )}
            />
          )}
        </View>

        {/* SELEZIONE GRUPPO (Visibile solo se NON è personale) */}
        {!isPersonale && (
          <View className="mb-8">
            <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 ml-1">Condividi con il Gruppo</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingRight: 20, paddingBottom: 4 }} 
              className="flex-row"
            >
              {GRUPPI_MOCK.map((gruppo) => {
                const isSelected = selectedGruppo === gruppo.id;
                return (
                  <TouchableOpacity
                    key={gruppo.id}
                    onPress={() => setValue('gruppo', gruppo.id)}
                    className={`flex-row items-center px-4 py-2 rounded-xl mr-3 border ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Users size={16} color={isSelected ? "#1d4ed8" : "#64748b"} className="mr-2" />
                    <Text className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      {gruppo.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* BOTTONE SALVA */}
        <TouchableOpacity 
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className={`mt-10 flex-row justify-center items-center py-4 rounded-2xl ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'}`}
        >
          {isSubmitting ? <ActivityIndicator color="white" /> : (
            <Text className="text-white text-lg font-bold">
              {editId ? 'Salva Modifiche' : 'Salva Spesa'}
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}