import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryLabel, VictoryTheme } from 'victory-native';
import { useStatistiche } from '@/context/StatisticheContext';
import { useColorScheme } from 'nativewind';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const NOMI_MESI_COMPLETI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const NOMI_MESI_CORTI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

interface StatistichePersonaliWidgetProps {
  userId: string;
}

export const StatistichePersonaliWidget: React.FC<StatistichePersonaliWidgetProps> = ({ userId }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const pieWidth = isTablet ? (width / 2) - 60 : width - 60;

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const svgTextColor = isDark ? "#f8fafc" : "#0f172a";
  const svgGridColor = isDark ? "#334155" : "#e2e8f0";
  const chevronActiveColor = isDark ? "#f8fafc" : "#1e293b";
  const chevronDisabledColor = isDark ? "#475569" : "#cbd5e1";

  const { statistichePersonali, fetchPersonali } = useStatistiche();

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

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

  useEffect(() => {
    fetchPersonali(userId, currentMonth, currentYear);
  }, [userId, currentMonth, currentYear]);

  if (!statistichePersonali) {
    return (
      <View className="py-12 items-center justify-center bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-slate-400 dark:text-slate-500 font-medium mt-4">Analisi spese in corso...</Text>
      </View>
    );
  }
  const dataMensile = [
    { x: "Privato", y: Number(statistichePersonali.spese_private_pure) || 0, color: "#EC4899" },
    { x: "Gruppo", y: Number(statistichePersonali.tua_parte_spese_gruppo) || 0, color: "#8B5CF6" }
  ].reverse();

  // Dati Annuali 
  const barData = Array.from({ length: 12 }, (_, i) => ({ x: i + 1, y: 0 }));
  if (statistichePersonali.andamento_mensile) {
    statistichePersonali.andamento_mensile.forEach(m => {
      const index = m.mese - 1; 
      if (index >= 0 && index < 12) {
        barData[index].y = Number(m.totale) || 0;
      }
    });
  }

  const annoOdierno = new Date().getFullYear();
  const meseOdierno = new Date().getMonth() + 1;
  const primoMeseConSpesa = statistichePersonali.andamento_mensile?.find(m => Number(m.totale) > 0)?.mese;
  
  let mediaMensile = 0;
  if (primoMeseConSpesa) {
    const meseFinale = currentYear === annoOdierno ? Math.max(meseOdierno, primoMeseConSpesa) : 12;
    const divisoreMesi = (meseFinale - primoMeseConSpesa) + 1;
    mediaMensile = (Number(statistichePersonali.totale_anno) || 0) / divisoreMesi;
  }

  const isCurrentMonth = currentMonth === meseOdierno && currentYear === annoOdierno;

  return (
    <View className={`flex ${isTablet ? 'flex-row' : 'flex-col'} gap-6`}>
      
      {/* CARD MENSILE */}
      <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1">
        <View className="flex-col w-full items-center mb-2">
          <Text className="text-sm pb-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uscite Mese</Text>
          
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

        <Text className="text-4xl font-black text-slate-900 dark:text-white mt-2">
          € {Number(statistichePersonali.totale_uscita_mensile).toFixed(2)}
        </Text>

        {statistichePersonali.totale_uscita_mensile > 0 ? (
          <View className="items-center justify-center py-4 -ml-2">
            <VictoryChart
              key={`personal-month-${currentMonth}-${currentYear}`}
              theme={VictoryTheme.material}
              horizontal
              width={pieWidth}
              height={220} 
              padding={{ top: 30, bottom: 20, left: 20, right: 40 }}
              domainPadding={{ x: 20 }}
            >
              <VictoryAxis tickValues={[]} style={{ grid: { stroke: 'none' }, axis: { stroke: 'none' } }} />
              <VictoryBar
                data={dataMensile}
                labels={({ datum }) => `${datum.x}   €${datum.y.toFixed(2)}`}
                labelComponent={<VictoryLabel x={20} dy={-22} textAnchor="start" />} 
                style={{
                  data: { fill: ({ datum }) => datum.color, width: 22 },
                  labels: { fontSize: 16, fill: svgTextColor, fontWeight: "700" } 
                }}
                cornerRadius={4}
              />
            </VictoryChart>
          </View>
        ) : (
          <View className="h-[220px] items-center justify-center">
            <Text className="text-slate-400 dark:text-slate-500 font-medium">Nessuna uscita in questo mese</Text>
          </View>
        )}
      </View>

      {/* CARD ANNUALE CON TREND E MEDIA */}
      <View className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1">
        
        <View className="mb-4 flex-row flex-wrap justify-between items-end gap-y-3">
          <View className="pr-2">
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trend {currentYear}</Text>
            <Text className="text-slate-800 dark:text-white text-xl font-bold mt-1">
              Totale: € {Number(statistichePersonali.totale_anno || 0).toFixed(2)}
            </Text>
          </View>
          
          <View className="items-end bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-600 shrink-0">
            <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Media Mensile</Text>
            <Text className="text-indigo-600 dark:text-indigo-400 text-base font-black">
              € {mediaMensile.toFixed(2)}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
          <View className="items-start -ml-4 w-[500px]">
            <VictoryChart 
              key={`personal-trend-${currentYear}`}
              theme={VictoryTheme.material} 
              domainPadding={{ x: 30 }} 
              height={320}
              width={500}
              padding={{ top: 20, bottom: 45, left: 60, right: 30 }} 
            >
              <VictoryAxis 
                tickValues={barData.map(d => d.x)} 
                tickFormat={(t) => NOMI_MESI_CORTI[t - 1]}
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