import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSpese } from '@/context/SpeseContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowUpRight, ArrowDownRight, Banknote, CreditCard, Wallet, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Rimborso } from '@/types/types';

export function StoricoRimborsiWidget() {
    const { user } = useAuth();
    const { rimborsi, isLoadingRimborsi, fetchRimborsiPersonali } = useSpese();
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (fetchRimborsiPersonali) {
            fetchRimborsiPersonali();
        }
    }, []);

    const getMetodoIcon = (tipologia: 'contanti' | 'paypal' | 'stripe') => {
        switch (tipologia) {
            case 'contanti': return <Banknote size={14} className="text-slate-500 dark:text-slate-400" />;
            case 'paypal': return <Wallet size={14} className="text-slate-500 dark:text-slate-400" />;
            case 'stripe': return <CreditCard size={14} className="text-slate-500 dark:text-slate-400" />;
            default: return <Banknote size={14} className="text-slate-500 dark:text-slate-400" />;
        }
    };

    if (isLoadingRimborsi) {
        return (
            <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 border border-slate-100 dark:border-slate-700/60 items-center justify-center py-8">
                <ActivityIndicator size="small" color="#2563eb" />
                <Text className="text-slate-400 text-xs mt-2">Caricamento rimborsi...</Text>
            </View>
        );
    }

    if (!rimborsi || rimborsi.length === 0) {
        return (
            <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 border border-slate-100 dark:border-slate-700/60">
                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">Storico Rimborsi</Text>
                <Text className="text-slate-400 dark:text-slate-500 text-sm italic py-2">
                    Nessun rimborso registrato recentemente.
                </Text>
            </View>
        );
    }

    // Determino quanti rimborsi mostrare: tutti se espanso, altrimenti solo i primi 2
    const rimborsiDaMostrare = isExpanded ? rimborsi : rimborsi.slice(0, 2);

    return (
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 mb-2 border border-slate-100 dark:border-slate-700/60 shadow-sm">
            
            {/* HEADER */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Storico Rimborsi</Text>
                
                {/* Mostra il pulsante solo se ci sono più di 2 rimborsi in totale */}
                {rimborsi.length > 2 && (
                    <TouchableOpacity 
                        onPress={() => setIsExpanded(!isExpanded)}
                        className="flex-row items-center gap-1 py-1 px-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg active:opacity-60"
                    >
                        <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {isExpanded ? "Mostra meno" : "Vedi tutto"}
                        </Text>
                        {isExpanded ? <ChevronUp size={14} color="#2563eb" /> : <ChevronDown size={14} color="#2563eb" />}
                    </TouchableOpacity>
                )}
            </View>

            <View className="gap-y-1">
                {rimborsiDaMostrare.map((rimborso: Rimborso, index: number) => {
                    const IsInviatoDaMe = rimborso?.from_membro?.user?.id === user?.id;
                    const controparteNome = IsInviatoDaMe 
                        ? rimborso?.to_membro?.user?.nome || 'Utente' 
                        : rimborso?.from_membro?.user?.nome || 'Utente';
                        
                    const dataFormattata = new Date(rimborso.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

                    return (
                        <View 
                            key={rimborso.id} 
                            className={`flex-row items-center justify-between py-3.5 ${
                                index !== rimborsiDaMostrare.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/30' : ''
                            }`}
                        >
                            <View className="flex-row items-center flex-1 pr-2">
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                                    IsInviatoDaMe ? 'bg-red-50 dark:bg-red-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20'
                                }`}>
                                    {IsInviatoDaMe ? (
                                        <ArrowUpRight size={18} color="#ef4444" />
                                    ) : (
                                        <ArrowDownRight size={18} color="#10b981" />
                                    )}
                                </View>
                                
                                <View className="flex-1">
                                    <Text className="font-semibold text-sm text-slate-900 dark:text-white" numberOfLines={1}>
                                        {IsInviatoDaMe ? `Inviato a ${controparteNome}` : `Ricevuto da ${controparteNome}`}
                                    </Text>
                                    
                                    {rimborso.nota ? (
                                        <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5" numberOfLines={1}>
                                            {rimborso.nota}
                                        </Text>
                                    ) : null}

                                    <View className="flex-row items-center gap-1.5 mt-1">
                                        <View className="bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                                            {getMetodoIcon(rimborso.tipologia)}
                                            <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                                                {rimborso.tipologia}
                                            </Text>
                                        </View>
                                        <Text className="text-[10px] text-slate-400 dark:text-slate-500">
                                            • {dataFormattata}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="items-end">
                                <Text className={`font-bold text-base ${IsInviatoDaMe ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {IsInviatoDaMe ? '-' : '+'}€{rimborso.importo}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}