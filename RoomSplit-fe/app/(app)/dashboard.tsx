import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { ArrowUpRight, Bell, Plus, Receipt } from 'lucide-react-native';

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const [viewMode, setViewMode] = useState<'gruppo' | 'personali'>('gruppo');

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>

                {/* Header e Toggle */}
                <View className="flex-row items-center mb-6">
                    <View className="flex-row items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1 flex-1">
                        <TouchableOpacity 
                          onPress={() => setViewMode('gruppo')}
                          className={`flex-1 py-2 rounded-md items-center ${viewMode === 'gruppo' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                        >
                            <Text className={`font-semibold ${viewMode === 'gruppo' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Di Gruppo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => setViewMode('personali')}
                          className={`flex-1 py-2 rounded-md items-center ${viewMode === 'personali' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                        >
                            <Text className={`font-semibold ${viewMode === 'personali' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Personali</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Card Saldo Netto */}
                <View className="bg-blue-600 rounded-2xl p-6 mb-6 shadow-md">
                    <Text className="text-blue-100 text-sm font-medium mb-1">Saldo Netto Totale</Text>
                    <Text className="text-white text-4xl font-bold mb-4">+ €45.50</Text>
                    <View className="flex-row gap-3">
                        <View className="bg-green-400/20 px-3 py-1.5 rounded-full flex-row items-center">
                            <ArrowUpRight size={16} color="#4ade80" />
                            <Text className="text-green-400 font-medium ml-1">In Credito</Text>
                        </View>
                    </View>
                </View>

                {/* Scadenze e notifiche urgenti */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <View>
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Bollette da pagare</Text>
                            <View className="flex-row items-center">
                                <Text className="text-3xl font-bold text-slate-900 dark:text-white mr-3">3</Text>
                                <View className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                                    <Text className="text-red-600 dark:text-red-400 font-medium">-€82.00</Text>
                                </View>
                            </View>
                        </View>
                        <Receipt size={28} color="#cbd5e1" />
                    </View>
                    <View className="flex-row justify-between items-center pt-2">
                        <Text className="text-slate-600 dark:text-slate-300">Prossimo Affitto</Text>
                        <View className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                            <Text className="font-bold text-slate-900 dark:text-white">01 Ott</Text>
                        </View>
                    </View>
                </View>

                {/* Grafico andamento */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-end mb-4">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white">Andamento Annuale</Text>
                        <TouchableOpacity>
                            <Text className="text-blue-600 font-medium">Vedi Dettagli</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 h-64 justify-center items-center">
                        {/* Qui inserirai il tuo <ExpenseChart data={...} /> */}
                        <Text className="text-slate-400">Placeholder Grafico (Recharts / ChartKit)</Text>
                    </View>
                </View>

                {/* Ripartizione Categorie */}
                <View className="mb-8">
                    <Text className="text-xl font-bold text-slate-900 dark:text-white mb-4">Ripartizione Categorie</Text>
                    <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                        {/* Item 1 */}
                        <View className="flex-row items-center mb-4">
                            <View className="bg-orange-100 p-3 rounded-full mr-4">
                                <Text className="text-orange-600 text-lg">⚡</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-slate-900 dark:text-white">Utenze</Text>
                                <Text className="text-slate-500 text-sm">€245.50 questo mese</Text>
                            </View>
                            <Text className="font-bold text-slate-900 dark:text-white">24%</Text>
                        </View>
                        {/* Item 2 */}
                        <View className="flex-row items-center">
                            <View className="bg-green-100 p-3 rounded-full mr-4">
                                <Text className="text-green-600 text-lg">🛒</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-slate-900 dark:text-white">Spesa</Text>
                                <Text className="text-slate-500 text-sm">€120.00 questo mese</Text>
                            </View>
                            <Text className="font-bold text-slate-900 dark:text-white">48%</Text>
                        </View>
                    </View>
                </View>

                {/* Spacer per non far coprire l'ultimo elemento dalla bottom bar o dal FAB */}
                <View className="h-24" />
            </ScrollView>

            <TouchableOpacity className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg">
                <Plus size={30} color="white" />
            </TouchableOpacity>
        </View>      
    );
}