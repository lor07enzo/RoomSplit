import React, { useState, useMemo, useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useSpese } from '@/context/SpeseContext';
import { useGruppi } from '@/context/GruppiContext';
import { Repeat, Calendar, Users, Wallet, ChevronDown, ChevronUp } from 'lucide-react-native';
import { GruppoSpesa } from '@/types/types';

interface SpeseRicorrentiWidgetProps {
    viewMode: 'gruppo' | 'personali';
}

export function SpeseRicorrentiWidget({ viewMode }: SpeseRicorrentiWidgetProps) {
    const { user } = useAuth();
    const { gruppi } = useGruppi();
    const { spese, saldiPerGruppo, isLoading } = useSpese();
    
    // Stato per gestire l'espansione della lista
    const [isExpanded, setIsExpanded] = useState(false);

    // Richiude la tendina automaticamente quando si cambia tab
    useEffect(() => {
        setIsExpanded(false);
    }, [viewMode]);

    const ottieniDataProssimoPagamento = (spesa: GruppoSpesa) => {
        let dataOggetto: Date;

        if (spesa.prossimo_pagamento) {
            dataOggetto = new Date(spesa.prossimo_pagamento);
        } else {
            const dataBase = spesa.created_at ? new Date(spesa.created_at) : new Date();
            dataOggetto = new Date(dataBase);
            const numero = parseInt(spesa.frequenza_numero) || 1;
            const tipo = String(spesa.frequenza_tipo).toLowerCase();

            if (tipo.includes('giorn') || tipo.includes('day')) {
                dataOggetto.setDate(dataOggetto.getDate() + numero);
            } else if (tipo.includes('sett') || tipo.includes('week')) {
                dataOggetto.setDate(dataOggetto.getDate() + numero * 7);
            } else if (tipo.includes('mes') || tipo.includes('month')) {
                dataOggetto.setMonth(dataOggetto.getMonth() + numero);
            } else if (tipo.includes('ann') || tipo.includes('year')) {
                dataOggetto.setFullYear(dataOggetto.getFullYear() + numero);
            } else {
                dataOggetto.setMonth(dataOggetto.getMonth() + 1);
            }
        }

        if (isNaN(dataOggetto.getTime())) return "Da definire";

        return dataOggetto.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    };

    const ottieniNomePagatore = (spesa: GruppoSpesa) => {
        if (spesa.pagatore && typeof spesa.pagatore === 'object' && spesa.pagatore.nome) {
            return `${spesa.pagatore.nome} ${spesa.pagatore.cognome || ''}`.trim();
        }
        if (spesa.user && typeof spesa.user === 'object' && spesa.user.nome) {
            return `${spesa.user.nome} ${spesa.user.cognome || ''}`.trim();
        }

        const targetId = typeof spesa.pagatore === 'string' ? spesa.pagatore 
                       : (spesa.pagatore?.id || (typeof spesa.user === 'string' ? spesa.user : spesa.user?.id));

        if (targetId) {
            if (targetId === user?.id) return "Tu";
            
            for (const saldi of Object.values(saldiPerGruppo)) {
                const utenteTrovato = saldi.find(s => s.utente_id === targetId);
                if (utenteTrovato) return utenteTrovato.nome;
            }
        }

        return "Sconosciuto";
    };

    const ottieniNomeGruppo = (spesa: GruppoSpesa) => {
        if (spesa.is_personale) return "Personale";

        if (spesa.gruppo && typeof spesa.gruppo === 'object' && spesa.gruppo.nome) {
            return spesa.gruppo.nome;
        }

        const gruppoId = typeof spesa.gruppo === 'string' ? spesa.gruppo : spesa.gruppo?.id;
        if (gruppoId) {
            const gruppoTrovato = gruppi.find(g => g.id === gruppoId);
            if (gruppoTrovato) return gruppoTrovato.nome;
        }

        return "Gruppo";
    };

    // Estrae tutte le spese ricorrenti
    const tutteLeSpeseRicorrenti = useMemo(() => {
        if (!spese || !user) return [];
        
        return spese
            .filter(s => {
                if (!s.is_ricorrente) return false;
                
                if (viewMode === 'gruppo') {
                    return s.is_personale === false;
                } else {
                    const sonoCoinvolto = s.pagatore?.id === user.id || s.user?.id === user.id;
                    return s.is_personale === true || sonoCoinvolto;
                }
            })
            .sort((a, b) => {
                const timeA = a.prossimo_pagamento ? new Date(a.prossimo_pagamento).getTime() : new Date(a.created_at).getTime();
                const timeB = b.prossimo_pagamento ? new Date(b.prossimo_pagamento).getTime() : new Date(b.created_at).getTime();
                return timeA - timeB;
            });
    }, [spese, viewMode, user]);

    // Taglia l'array in base allo stato di espansione (mostra max 2 elementi di default)
    const speseDaMostrare = isExpanded ? tutteLeSpeseRicorrenti : tutteLeSpeseRicorrenti.slice(0, 2);
    const hasMore = tutteLeSpeseRicorrenti.length > 2;

    return (
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 mb-6 shadow-sm border border-slate-100 dark:border-slate-700/60">
            {/* Widget Header */}
            <View className="flex-row items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                <View className="flex-row items-center">
                    <View className="bg-blue-50 dark:bg-blue-950/40 w-10 h-10 items-center justify-center rounded-2xl mr-3">
                        <Repeat size={18} className="text-blue-600 dark:text-blue-400" />
                    </View>
                    <View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                            {viewMode === 'gruppo' ? "Scadenze di Gruppo" : "I Miei Abbonamenti"}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                            {tutteLeSpeseRicorrenti.length} {tutteLeSpeseRicorrenti.length === 1 ? 'spesa attiva' : 'spese attive'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Contenuto o Loading */}
            {isLoading ? (
                <ActivityIndicator className="py-6" size="small" color="#2563eb" />
            ) : tutteLeSpeseRicorrenti.length === 0 ? (
                <View className="py-6 items-center justify-center">
                    <Text className="text-slate-400 dark:text-slate-500 text-sm italic text-center">
                        Nessuna spesa ricorrente pianificata.
                    </Text>
                </View>
            ) : (
                <View>
                    <View className="gap-y-1">
                        {speseDaMostrare.map((spesa, index) => {
                            const nomePagatore = ottieniNomePagatore(spesa);
                            const dataFormattata = ottieniDataProssimoPagamento(spesa);
                            const nomeGruppo = ottieniNomeGruppo(spesa);

                            return (
                                <View 
                                    key={spesa.id} 
                                    className={`flex-row items-center justify-between py-3.5 ${index !== speseDaMostrare.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/30' : ''}`}
                                >
                                    {/* Blocco Sinistro: Icona + Testi */}
                                    <View className="flex-row items-center flex-1 pr-3">
                                        <View className="bg-slate-50 dark:bg-slate-700/50 w-12 h-12 rounded-full items-center justify-center mr-3 border border-slate-100/60 dark:border-slate-700/20">
                                            <Calendar size={18} className="text-slate-500 dark:text-slate-400" />
                                        </View>
                                        
                                        <View className="flex-1">
                                            <Text className="font-semibold text-base text-slate-900 dark:text-white" numberOfLines={1}>
                                                {spesa.nome || spesa.descrizione}
                                            </Text>
                                            
                                            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                Entro il {dataFormattata} • <Text className="text-slate-400 dark:text-slate-500 font-normal italic">Ogni {spesa.frequenza_numero} {spesa.frequenza_tipo}</Text>
                                            </Text>
                                            
                                            {/* Badge Layout */}
                                            {!spesa.is_personale ? (
                                                <View className="flex-row flex-wrap items-center gap-1.5 mt-2">
                                                    <View className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md flex-row items-center">
                                                        <Users size={11} className="text-slate-500 dark:text-slate-400 mr-1" />
                                                        <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300" numberOfLines={1}>
                                                            {nomeGruppo}
                                                        </Text>
                                                    </View>
                                                    <View className="bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md flex-row items-center">
                                                        <Wallet size={11} className="text-blue-500 dark:text-blue-400 mr-1" />
                                                        <Text className="text-[11px] font-medium text-blue-600 dark:text-blue-400" numberOfLines={1}>
                                                            {nomePagatore}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View className="flex-row items-center mt-2">
                                                    <View className="bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-md">
                                                        <Text className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                                                            Spesa privata
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Blocco Destro: Importo Premium */}
                                    <View className="items-end justify-center pl-2">
                                        <Text className="text-slate-900 dark:text-white">
                                            <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400 mr-0.5">€</Text>
                                            <Text className="text-lg font-bold tracking-tight">{spesa.importo}</Text>
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Bottone Vedi Tutto / Riduci */}
                    {hasMore && (
                        <TouchableOpacity 
                            onPress={() => setIsExpanded(!isExpanded)}
                            activeOpacity={0.7}
                            className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex-row items-center justify-center"
                        >
                            <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400 mr-1">
                                {isExpanded ? 'Mostra meno' : `Vedi tutte e ${tutteLeSpeseRicorrenti.length}`}
                            </Text>
                            {isExpanded ? (
                                <ChevronUp size={16} className="text-blue-600 dark:text-blue-400" />
                            ) : (
                                <ChevronDown size={16} className="text-blue-600 dark:text-blue-400" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}