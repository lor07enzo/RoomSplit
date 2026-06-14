import { useStatistiche } from '@/context/StatisticheContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';

const NOMI_MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const NOMI_MESI_COMPLETI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

interface StatisticheWidgetProps {
  gruppoId: string | null;
  mese?: number;
  anno?: number;
}

export const StatisticheWidget: React.FC<StatisticheWidgetProps> = ({ gruppoId, mese, anno }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const pieWidth = isTablet ? (width / 2) - 60 : width - 60;

  // Colori SVG Dinamici prt contrasto
  const svgTextColor = isDark ? "#f8fafc" : "#0f172a";
  const svgGridColor = isDark ? "#334155" : "#e2e8f0"; 

  // Colori per gli Chevron (Attivo vs Disabilitato)
  const chevronActiveColor = isDark ? "#f8fafc" : "#1e293b";
  const chevronDisabledColor = isDark ? "#475569" : "#cbd5e1";

  const { 
    statisticheMensili, 
    statisticheAnnuali, 
    fetchMensili, 
    fetchAnnuali 
  } = useStatistiche();

  // Funzione per scorrere i mesi
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Evita di andare nei mesi futuri
  const handleNextMonth = () => {
    const now = new Date();
    if (currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()) return;

    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Divisione useEffect per maggiori prestazione
  useEffect(() => {
    fetchMensili(gruppoId, currentMonth, currentYear);
  }, [gruppoId, currentMonth, currentYear]);

  useEffect(() => {
    fetchAnnuali(gruppoId, currentYear);
  }, [gruppoId, currentYear]);

  if (!statisticheMensili || !statisticheAnnuali) {
    return (
      <View className="py-12 items-center justify-center bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-slate-400 dark:text-slate-500 font-medium mt-4">Analisi dati in corso...</Text>
      </View>
    );
  }

  // Preparazione dati per le Barre Orizzontali
  const categoryData = statisticheMensili.spese_per_categoria.map(cat => ({
    x: cat.nome_categoria || "Generico", 
    y: Number(cat.totale_speso) || 0,
    colore: cat.colore_categoria || "#4F46E5"
  })).reverse();

  const barData = statisticheAnnuali.andamento_mensile.map(m => ({
    x: NOMI_MESI[m.mese - 1],
    y: m.totale
  }));

  const isCurrentMonth = currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear();

  return (
    <View className={`flex ${isTablet ? 'flex-row' : 'flex-col'} gap-6`}>
      
      {/* SPESE MENSILI E TORTA */}
      <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 w-full md:flex-1">
        <View className="flex-col w-full items-center mb-2">
          <Text className="text-sm pb-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mensili</Text>
          
          <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-700 rounded-full w-full px-2 py-1 border border-slate-200 dark:border-slate-600">
            <TouchableOpacity onPress={handlePrevMonth} className="p-2">
              <ChevronLeft size={20} color={chevronActiveColor} />
            </TouchableOpacity>
            
            <Text className="text-slate-700 dark:text-slate-200 font-bold text-sm mx-1 flex-1 text-center">
              {NOMI_MESI_COMPLETI[currentMonth - 1]} {currentYear.toString()}
            </Text>
            
            <TouchableOpacity onPress={handleNextMonth} disabled={isCurrentMonth} className="p-2">
              <ChevronRight size={20} color={isCurrentMonth ? chevronDisabledColor : chevronActiveColor} />
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
          € {statisticheMensili.totale_speso.toFixed(2)}
        </Text>

       {/* GRAFICO A BARRE ORIZZONTALI */}
        {categoryData.length > 0 ? (
          <View className="items-center justify-center py-2 -ml-2">
            <VictoryChart
              key={`chart-${currentMonth}-${currentYear}`}
              theme={VictoryTheme.material}
              width={pieWidth + 40} 
              height={Math.max(250, categoryData.length * 70)} 
              padding={{ top: 20, bottom: 20, left: 20, right: 30 }} 
              domainPadding={{ x: 20 }}
            >
              <VictoryAxis
                tickValues={[]}
                style={{
                  grid: { stroke: 'none' },
                  axis: { stroke: 'none' }, 
                }}
              />
              
              <VictoryBar
                horizontal
                data={categoryData}
                labels={({ datum }) => `${datum.x}   €${Number(datum.y).toFixed(2)}`}
                labelComponent={
                  <VictoryLabel 
                    x={20} 
                    dy={-18} 
                    textAnchor="start" 
                  />
                }
                style={{
                  data: {
                    fill: ({ datum }) => datum.colore || "#4F46E5",
                    width: 16, 
                  },
                  labels: {
                    fontSize: 16, 
                    fill: svgTextColor, 
                    fontWeight: "700",
                  }
                }}
                cornerRadius={4}
              />
            </VictoryChart>
          </View>
        ) : (
          <View className="h-[250px] items-center justify-center">
            <Text className="text-slate-400 dark:text-slate-500 font-medium">Nessuna spesa in questo mese</Text>
          </View>
        )}

        {/* TOP SPESA MESE */}
        {statisticheMensili.spesa_maggiore && (
          <View className="mt-4 p-5 bg-indigo-50/80 dark:bg-slate-700/50 rounded-2xl border border-indigo-100 dark:border-slate-600">
            <Text className="text-xs text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider mb-1.5">Top Spesa Mese</Text>
            <Text className="text-slate-800 dark:text-white text-lg font-bold mb-1.5 leading-tight">
              {statisticheMensili.spesa_maggiore.descrizione}
            </Text>
            <Text className="text-indigo-600 dark:text-indigo-400 font-black text-base">
              € {statisticheMensili.spesa_maggiore.importo}
              <Text className="text-slate-500 dark:text-slate-400 font-medium text-sm"> da {statisticheMensili.spesa_maggiore.pagatore.split(' ')[0]}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* ================================== */}
      {/* CARD 2: TREND ANNUALE E BARRE */}
      {/* ================================== */}
      <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1">
        <View className="mb-4 flex-row justify-between items-end">
          <View>
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trend {statisticheAnnuali.anno}</Text>
            <Text className="text-slate-800 dark:text-white text-xl font-bold mt-1">Totale: € {statisticheAnnuali.totale_anno.toFixed(2)}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          <View className="items-start -ml-4">
            <VictoryChart 
              key={`trend-${statisticheAnnuali.anno}`}
              theme={VictoryTheme.material} 
              domainPadding={{ x: 30 }} 
              height={320}
              width={500}
            >
              <VictoryAxis 
                style={{ 
                  tickLabels: { fontSize: 13, padding: 8, fill: svgTextColor, fontWeight: "600" },
                  grid: { stroke: 'none' },
                  axis: { stroke: svgGridColor, strokeWidth: 2 }
                }} 
              />
              <VictoryAxis 
                dependentAxis 
                tickFormat={(y) => `€${y}`} 
                style={{ 
                  tickLabels: { fontSize: 13, padding: 8, fill: svgTextColor, fontWeight: "600" },
                  grid: { stroke: svgGridColor, strokeDasharray: "4, 6" },
                  axis: { stroke: 'none' }
                }} 
              />
              <VictoryBar
                data={barData}
                style={{ data: { fill: "#4F46E5", width: 22 } }} 
                cornerRadius={{ top: 6 }}
                animate={{ duration: 500, onLoad: { duration: 500 } }}
              />
            </VictoryChart>
          </View>
        </ScrollView>
      </View>

    </View>
  );
};