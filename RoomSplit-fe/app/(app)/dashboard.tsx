import { ScrollView, TouchableOpacity, View, Text, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useSpese } from '@/context/SpeseContext';
import { useGruppi } from '@/context/GruppiContext';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatisticheWidget } from '@/components/statistiche/StatisticheWidget';
import { StatistichePersonaliWidget } from '@/components/statistiche/StatistichePersonaliWidget';
import { SpeseRicorrentiWidget } from '@/components/dashboard/SpeseRicorrentiWidget';
import { SaldiDebitiWidget } from '@/components/dashboard/SaldiDebitiWidget';
import { StoricoRimborsiWidget } from '@/components/dashboard/StoricoRimborsiWidget';


export default function DashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { gruppi, fetchGruppi, isLoading: isLoadingGruppi } = useGruppi();
    const { fetchSaldi } = useSpese();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [viewMode, setViewMode] = useState<'gruppo' | 'personali'>('gruppo');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [loadingSaldi, setLoadingSaldi] = useState(true);

    useEffect(() => {
        if (user) {
            fetchGruppi();
        }
    }, [user]);

    useEffect(() => {
        const caricaTuttiISaldi = async () => {
            if (gruppi.length === 0) {
                setLoadingSaldi(false);
                return;
            }
            setLoadingSaldi(true);
            try {
                const cachePromises = gruppi.map(g => fetchSaldi(g.id));
                await Promise.all(cachePromises);
            } catch (err) {
                console.error("Errore durante il recupero dei saldi complessivi:", err);
            } finally {
                setLoadingSaldi(false);
            }
        };

        if (!isLoadingGruppi) {
            caricaTuttiISaldi();
        }
    }, [gruppi, isLoadingGruppi, fetchSaldi]);

    const staCaricandoDati = isLoadingGruppi || loadingSaldi;

    const handleTabChange = (mode: 'gruppo' | 'personali') => {
        if (mode === viewMode) return;
        
        setIsTransitioning(true);
        setViewMode(mode); 
        
        setTimeout(() => {
            setIsTransitioning(false);
        }, 50); 
    };

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>

                {/* --- HEADER E TOGGLE --- */}
                <View className="flex-row items-center mb-6">
                    <View className="flex-row items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1 flex-1">
                        <TouchableOpacity 
                          onPress={() => handleTabChange('gruppo')}
                          className={`flex-1 py-2 rounded-md items-center ${viewMode === 'gruppo' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                        >
                            <Text className={`font-semibold ${viewMode === 'gruppo' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Di Gruppo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => handleTabChange('personali')}
                          className={`flex-1 py-2 rounded-md items-center ${viewMode === 'personali' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                        >
                            <Text className={`font-semibold ${viewMode === 'personali' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Personali</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className={`flex ${isTablet ? 'flex-row gap-6' : 'flex-col gap-0'}`}>
                    
                    {/* COLONNA SINISTRA */}
                    <View className={isTablet ? 'flex-1' : 'w-full'}>
                        
                        {/* SALDI E DEI DEBITI GLOBALI (in modalità gruppo) */}
                        {viewMode === 'gruppo' && (
                            <SaldiDebitiWidget staCaricandoDati={staCaricandoDati} />
                        )}

                        {/* SPESE RICORRENTI */}
                        <SpeseRicorrentiWidget viewMode={viewMode} />

                        {/* STORICO RIMBORSI */}
                        {viewMode === 'personali' && (
                            <View className="mb-4">
                                <StoricoRimborsiWidget />
                            </View>
                        )}

                    </View>

                    {/* COLONNA DESTRA */}
                    <View className={isTablet ? 'flex-[1.5]' : 'w-full'}>
                        <View className="mb-6">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                                {viewMode === 'gruppo' ? "Analisi Finanziaria (Tutti i Gruppi)" : "Le Tue Spese Private"}
                            </Text>
                            
                            {isTransitioning ? (
                                <View className="h-64 items-center justify-center">
                                    <ActivityIndicator size="small" color="#4F46E5" />
                                </View>
                            ) : viewMode === 'gruppo' ? (
                                <StatisticheWidget gruppoId={ "all"} />
                            ) : (
                                <StatistichePersonaliWidget userId={user?.id || ""} />
                            )}
                        </View>
                    </View>
                </View>
                <View className="h-24" />
            </ScrollView>

            {/* FLOATING ACTION BUTTON */}
            <TouchableOpacity 
              onPress={() => router.push('/nuova-spesa')}
              className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
            >  
                <Plus size={30} color="white" />
            </TouchableOpacity>
        </View>      
    );
}