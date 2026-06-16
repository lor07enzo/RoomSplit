import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Alert, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/lib/useAppTheme';
import { LogOut, Moon, Sun, ChevronRight, CreditCard, Bell, Shield, CircleHelp } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfiloScreen() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useAppTheme();
  const router = useRouter();

  const handleLogout = () => {
    const eseguiLogout = async () => {
      try {
        await logout();
      } catch (error) {
        Alert.alert("Errore", "Impossibile effettuare il logout.");
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Sei sicuro di voler uscire?")) eseguiLogout();
    } else {
      Alert.alert(
        "Esci",
        "Sei sicuro di voler uscire dall'account?",
        [
          { text: "Annulla", style: "cancel" },
          { text: "Esci", style: "destructive", onPress: eseguiLogout }
        ]
      );
    }
  };

  const hasAvatar = !!user?.avatar;
  const initial = user?.nome ? user.nome.charAt(0).toUpperCase() : '?';

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" showsVerticalScrollIndicator={false}>
      
      <View className="w-full max-w-3xl mx-auto p-4 pb-12">
        
        {/* HEADER PROFILO */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 items-center shadow-sm border border-slate-100 dark:border-slate-700 mb-6 mt-4">
          <View className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-slate-700 shadow-sm items-center justify-center mb-4 overflow-hidden">
            {hasAvatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                className="w-full h-full" 
                resizeMode="cover" 
              />
            ) : (
              <Text className="text-blue-600 dark:text-blue-300 font-bold text-3xl">
                {initial}
              </Text>
            )}
          </View>

          <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {user?.nome} {user?.cognome || ''}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm">
            {user?.email}
          </Text>
        </View>

        <View className="md:flex-row md:gap-6">
          
          <View className="flex-1 mb-6 md:mb-0">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-3 ml-2">
              Preferenze App
            </Text>
            
            <View className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* SWITCH TEMA CHIARO/SCURO */}
              <View className="flex-row items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center mr-3">
                    {isDark ? <Moon size={20} color="#818cf8" /> : <Sun size={20} color="#6366f1" />}
                  </View>
                  <View>
                    <Text className="text-slate-800 dark:text-slate-200 font-semibold text-base">Modalità Scura</Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-500">Cambia il tema dell'app</Text>
                  </View>
                </View>
                
                {/* Aggiornato per usare i metodi custom */}
                <Switch 
                  value={isDark} 
                  onValueChange={toggleTheme} 
                  trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
                />
              </View>
              {/* NOTIFICHE */}
              <TouchableOpacity 
                onPress={() => router.push('/notifiche' as any)}
                className="flex-row items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50 active:bg-slate-50 dark:active:bg-slate-700/50"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 items-center justify-center mr-3">
                    <Bell size={20} color="#10b981" />
                  </View>
                  <View>
                    <Text className="text-slate-800 dark:text-slate-200 font-semibold text-base">Notifiche</Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-500">Gestisci gli avvisi push</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>

              {/* METODI DI PAGAMENTO */}
              <TouchableOpacity className="flex-row items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-700/50">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                    <CreditCard size={20} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-slate-800 dark:text-slate-200 font-semibold text-base">Metodi di Pagamento</Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-500">IBAN, PayPal, Satispay</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-3 ml-2">
              Account & Supporto
            </Text>
            
            {/* FUNZIONI ACCOUNT EXTRA */}
            <View className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
              <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50 active:bg-slate-50 dark:active:bg-slate-700/50">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 items-center justify-center mr-3">
                    <Shield size={20} color="#64748b" />
                  </View>
                  <Text className="text-slate-800 dark:text-slate-200 font-semibold text-base">Privacy e Sicurezza</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-700/50">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 items-center justify-center mr-3">
                    <CircleHelp size={20} color="#64748b" />
                  </View>
                  <Text className="text-slate-800 dark:text-slate-200 font-semibold text-base">Centro Assistenza</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleLogout}
              className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-4 rounded-2xl flex-row items-center justify-center shadow-sm active:opacity-80"
            >
              <LogOut size={20} color="#ef4444" />
              <Text className="text-red-600 dark:text-red-400 font-bold text-base ml-2">
                Esci dall'Account
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-slate-400 dark:text-slate-500 text-xs mt-6">
              RoomSplit v1.0.0
            </Text>

          </View>
        </View>

      </View>
    </ScrollView>
  );
}