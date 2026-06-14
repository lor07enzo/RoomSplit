import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Crown, LogOut, Trash2 } from 'lucide-react-native';
import { Membro, User } from '@/types/types';

interface MembriGruppoWidgetProps {
    membri: Membro[];
    loading: boolean;
    currentUser: User | null;
    sonoAdmin: boolean;
    onRemoveMembro: (userId: string, nomeMembro: string, isSelf: boolean) => void;
}

export function MembriGruppoWidget({membri, loading, currentUser, sonoAdmin, onRemoveMembro}: MembriGruppoWidgetProps) {
    return (
        <View className="mb-6 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-4">
                Membri del Gruppo ({membri.length})
            </Text>
            
            {loading ? (
                <ActivityIndicator size="small" color="#3b82f6" className="py-6" />
            ) : (
                <View className="space-y-2">
                    {membri.map((membro, index) => {
                        const isMe = membro.user.id === currentUser?.id;
                        const membroAdmin = membro.ruolo === 'admin';
                        const isBordered = index !== membri.length - 1;
                        const initial = membro.user.nome ? membro.user.nome.charAt(0).toUpperCase() : '?';

                        const finalAvatarUri = membro.user.avatar;
                        const hasAvatar = !!finalAvatarUri;

                        return (
                            <View 
                                key={membro.id} 
                                className={`flex-row items-center justify-between py-3 ${isBordered ? 'border-b border-slate-50 dark:border-slate-700/50' : ''}`}
                            >
                                <View className="flex-row items-center">
                                    {/* Avatar o Iniziale dell'utente */}
                                    <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 justify-center items-center mr-3 overflow-hidden border border-slate-200 dark:border-slate-700">
                                        {hasAvatar ? (
                                            <Image 
                                                source={{ uri: finalAvatarUri }} 
                                                className="w-full h-full" 
                                                resizeMode="cover" 
                                                onError={(e) => console.log(`Errore caricamento avatar per ${membro.user.nome}:`, e.nativeEvent.error)}
                                            />
                                        ) : (
                                            <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                                                {initial}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Nome e Ruolo */}
                                    <View>
                                        <Text className="text-slate-900 dark:text-white font-semibold text-sm">
                                            {membro.user.nome} {membro.user.cognome || ''} {isMe && <Text className="text-slate-400 font-normal">(Tu)</Text>}
                                        </Text>
                                        {membroAdmin && (
                                            <View className="flex-row items-center mt-0.5">
                                                <Crown size={12} color="#eab308" />
                                                <Text className="text-[10px] text-yellow-600 font-medium ml-1">Amministratore</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                
                                {/* Azioni di rimozione/abbandono */}
                                {isMe ? (
                                    <TouchableOpacity 
                                        onPress={() => onRemoveMembro(membro.user.id, membro.user.nome, true)} 
                                        className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg active:opacity-70"
                                    >
                                        <LogOut size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                ) : (
                                    sonoAdmin && !membroAdmin && (
                                        <TouchableOpacity 
                                            onPress={() => onRemoveMembro(membro.user.id, membro.user.nome, false)} 
                                            className="p-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-lg active:opacity-70"
                                        >
                                            <Trash2 size={16} color="#94a3b8" />
                                        </TouchableOpacity>
                                    )
                                )}
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}