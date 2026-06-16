import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SaldoMembro } from '@/types/types';
import { Wallet, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react-native';

interface BilanciGruppoProps {
  saldi: SaldoMembro[];
  loading: boolean;
  currentUserId?: string;
  onSaldaPress: (creditore: SaldoMembro) => void;
}

export default function BilanciGruppoScreen({ saldi, loading, currentUserId, onSaldaPress }: BilanciGruppoProps) {
  
  // Trova il saldo dell'utente attualmente loggato
  const mioSaldo = useMemo(() => {
    if (!saldi || !currentUserId) return undefined;
    return saldi.find(s => s.utente_id === currentUserId);
  }, [saldi, currentUserId]);

  // Filtra gli altri membri
  const altriSaldi = useMemo(() => {
    if (!saldi) return [];
    return saldi.filter(s => s.utente_id !== currentUserId);
  }, [saldi, currentUserId]);

  // Calcola il totale speso da tutto il gruppo
  const totaleGruppo = useMemo(() => {
    return saldi.reduce((acc, curr) => acc + (parseFloat(curr.pagato_totale as any) || 0), 0);
  }, [saldi]);

  if (loading) {
    return (
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm items-center justify-center mb-6">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-slate-400 mt-2 text-sm">Calcolo bilanci in corso...</Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-end mb-3 px-1">
        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
          Riepilogo Finanziario
        </Text>
        <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
          Totale gruppo: €{totaleGruppo.toFixed(2)}
        </Text>
      </View>

      <View className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* HERO SECTION: Il bilancio dell'utente loggato */}
        {mioSaldo && (
          <View className={`p-5 border-b ${mioSaldo.bilancio < 0 ? 'bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30' : mioSaldo.bilancio > 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
            <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Il tuo bilancio</Text>
            <View className="flex-row items-center">
              {mioSaldo.bilancio < 0 ? (
                <TrendingDown size={24} color="#ea580c" className="mr-2" />
              ) : mioSaldo.bilancio > 0 ? (
                <TrendingUp size={24} color="#10b981" className="mr-2" />
              ) : (
                <CheckCircle2 size={24} color="#64748b" className="mr-2" />
              )}
              
              <Text className={`text-3xl font-black ${mioSaldo.bilancio < 0 ? 'text-orange-600 dark:text-orange-500' : mioSaldo.bilancio > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {mioSaldo.bilancio === 0 ? 'In pari' : `€${Math.abs(mioSaldo.bilancio).toFixed(2)}`}
              </Text>
            </View>
            <Text className="text-xs text-slate-500 mt-1">
              {mioSaldo.bilancio < 0 ? 'Sei in debito con il gruppo.' : mioSaldo.bilancio > 0 ? 'Il gruppo ti deve dei soldi.' : 'Non devi nulla a nessuno.'}
            </Text>
          </View>
        )}

        {/* LISTA MEMBRI */}
        <View className="p-2">
          {altriSaldi.map((membro, index) => {
            const bilancio = parseFloat(membro.bilancio as any) || 0;
            const isCredit = bilancio > 0;
            const isDebt = bilancio < 0;
            const isBordered = index !== altriSaldi.length - 1;

            return (
              <View 
                key={membro.utente_id} 
                className={`flex-row items-center justify-between p-3 ${isBordered ? 'border-b border-slate-50 dark:border-slate-700/50' : ''}`}
              >
                <View className="flex-row items-center flex-1">
                  <View className={`w-2.5 h-2.5 rounded-full mr-3 ${isCredit ? 'bg-emerald-500' : isDebt ? 'bg-orange-500' : 'bg-slate-300'}`} />
                  <View>
                    <Text className="text-slate-800 dark:text-slate-200 font-semibold text-base">{membro.nome}</Text>
                    <Text className={`text-xs font-medium ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : isDebt ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                      {isCredit ? `Riceve €${bilancio.toFixed(2)}` : isDebt ? `Deve €${Math.abs(bilancio).toFixed(2)}` : 'In pari'}
                    </Text>
                  </View>
                </View>

                {mioSaldo && mioSaldo.bilancio < 0 && isCredit && (
                  <TouchableOpacity 
                    onPress={() => onSaldaPress(membro)}
                    className="bg-slate-900 dark:bg-blue-600 px-4 py-2 rounded-lg flex-row items-center active:scale-95"
                  >
                    <Wallet size={14} color="white" className="mr-1.5" />
                    <Text className="text-white font-bold text-xs">Salda</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          
          {altriSaldi.length === 0 && (
            <Text className="text-center text-slate-400 text-sm py-4 italic">Nessun altro membro nel gruppo.</Text>
          )}
        </View>
      </View>
    </View>
  );
}