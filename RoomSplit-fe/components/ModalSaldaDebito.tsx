import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { Banknote, CreditCard, X, Wallet } from 'lucide-react-native';
import { TipologiaRimborso } from '@/types/types';

interface ModalSaldaDebitoProps {
    visible: boolean;
    onClose: () => void;
    nomeCreditore: string;
    importo: number;
    isProcessing: boolean;
    onConfirm: (tipologia: TipologiaRimborso, nota: string) => void;
}

export function ModalSaldaDebito({ visible, onClose, nomeCreditore, importo, isProcessing, onConfirm }: ModalSaldaDebitoProps) {
    const [metodoSelezionato, setMetodoSelezionato] = useState<TipologiaRimborso>('contanti');
    const [nota, setNota] = useState<string>('');

    useEffect(() => {
        if (visible) {
            setMetodoSelezionato('contanti');
            setNota('');
        }
    }, [visible]);

    const metodiPagamento = [
        { id: 'contanti' as TipologiaRimborso, label: 'Contanti', icon: Banknote },
        { id: 'paypal' as TipologiaRimborso, label: 'PayPal', icon: Wallet },
        { id: 'stripe' as TipologiaRimborso, label: 'Stripe', icon: CreditCard },
    ];

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-xl">
                    
                    {/* Header Modale */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white">Salda il debito</Text>
                        <TouchableOpacity onPress={onClose} disabled={isProcessing} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <X size={20} className="text-slate-500 dark:text-slate-400" />
                        </TouchableOpacity>
                    </View>

                    {/* Riepilogo Importo */}
                    <View className="items-center mb-6">
                        <Text className="text-slate-500 dark:text-slate-400 mb-1">Stai per inviare a {nomeCreditore}</Text>
                        <Text className="text-4xl font-black text-slate-900 dark:text-white">
                            €{importo.toFixed(2)}
                        </Text>
                    </View>

                    {/* Selezione Metodo */}
                    <Text className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Scegli il metodo di rimborso</Text>
                    <View className="flex-row gap-3 mb-8">
                        {metodiPagamento.map((metodo) => {
                            const isSelected = metodoSelezionato === metodo.id;
                            const Icon = metodo.icon;
                            return (
                                <TouchableOpacity
                                    key={metodo.id}
                                    onPress={() => setMetodoSelezionato(metodo.id)}
                                    className={`flex-1 items-center p-3 rounded-2xl border-2 ${
                                        isSelected 
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                                            : 'border-slate-200 dark:border-slate-700 bg-transparent'
                                    }`}
                                >
                                    <Icon size={24} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                                    <Text className={`mt-2 font-medium text-xs ${isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-500"}`}>
                                        {metodo.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Campo Input Nota */}
                    <Text className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Aggiungi una nota (opzionale)</Text>
                    <TextInput
                        value={nota}
                        onChangeText={setNota}
                        placeholder="Es. Affitto Maggio, Spesa Esselunga..."
                        placeholderTextColor="#94a3b8"
                        editable={!isProcessing}
                        className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 text-sm"
                    />

                    {/* Pulsante Conferma */}
                    <TouchableOpacity
                        disabled={isProcessing}
                        onPress={() => onConfirm(metodoSelezionato, nota)}
                        className={`py-4 rounded-xl items-center flex-row justify-center ${isProcessing ? 'bg-blue-400' : 'bg-blue-600'}`}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Conferma Rimborso</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}