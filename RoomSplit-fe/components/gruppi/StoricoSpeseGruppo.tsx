import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ReceiptText, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { GruppoSpesa } from '@/types/types';

interface StoricoSpeseGruppoProps {
    spese: GruppoSpesa[];
    onSpesaPress: (id: string) => void;
}

export default function StoricoSpeseGruppo({ spese, onSpesaPress }: StoricoSpeseGruppoProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const speseDaMostrare = isExpanded ? spese : spese.slice(0, 3);
    const hasMore = spese.length > 3;

    return (
        <View className="mb-12">
            <Text className="text-slate-500 font-bold text-xs tracking-wider uppercase mb-3 ml-1">
                Storico Spese del Gruppo ({spese.length})
            </Text>

            {spese.length === 0 ? (
                <View className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 items-center justify-center">
                    <ReceiptText size={32} color="#94a3b8" />
                    <Text className="text-slate-400 text-sm mt-2 text-center">
                        Nessuna spesa caricata in questo gruppo.
                    </Text>
                </View>
            ) : (
                <View>
                    <View>
                        {speseDaMostrare.map((spesa) => {
                            const dataFormattata = new Date(spesa.created_at).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                            });

                            return (
                                <TouchableOpacity
                                    key={spesa.id}
                                    onPress={() => onSpesaPress(spesa.id)}
                                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex-row items-center justify-between shadow-sm mb-2 active:opacity-80"
                                >
                                    <View className="flex-row items-center flex-1 pr-3">
                                        <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 px-2.5 py-1.5 rounded-lg items-center justify-center mr-3 min-w-[45px]">
                                            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                                                {dataFormattata}
                                            </Text>
                                        </View>

                                        <View className="flex-1">
                                            <Text className="text-slate-900 dark:text-white font-semibold text-sm" numberOfLines={1}>
                                                {spesa.nome}
                                            </Text>
                                            <Text className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5" numberOfLines={1}>
                                                {spesa.descrizione || 'Nessuna descrizione'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-base font-black text-slate-900 dark:text-white">
                                            €{Number(spesa.importo).toFixed(2)}
                                        </Text>
                                        <ArrowRight size={14} color="#cbd5e1" />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Pulsante di Espansione dinamico */}
                    {hasMore && (
                        <TouchableOpacity 
                            onPress={() => setIsExpanded(!isExpanded)}
                            activeOpacity={0.7}
                            className="mt-2 py-3 flex-row items-center justify-center bg-slate-100/50 dark:bg-slate-800/40 rounded-xl border border-slate-200/40 dark:border-slate-700/30 active:opacity-75"
                        >
                            <Text className="text-xs font-bold text-blue-600 dark:text-blue-400 mr-1.5">
                                {isExpanded ? 'Mostra meno' : `Vedi tutto (${spese.length})`}
                            </Text>
                            {isExpanded ? (
                                <ChevronUp size={14} className="text-blue-600 dark:text-blue-400" />
                            ) : (
                                <ChevronDown size={14} className="text-blue-600 dark:text-blue-400" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}