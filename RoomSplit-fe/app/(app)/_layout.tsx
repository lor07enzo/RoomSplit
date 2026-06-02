import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, Image } from 'react-native';
import { Slot, useRouter, usePathname, useGlobalSearchParams, Href, Redirect } from 'expo-router';
import { LayoutGrid, ReceiptText, ShoppingCart, Users, User, Bell, Check, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

type NavItem = {
  name: string;
  path: Href; 
  icon: any; 
};

export default function MobileNavigationLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const { user, isLoading } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (isLoading) {
    return null; 
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  const NAV_ITEMS: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard' as Href, icon: LayoutGrid },
    { name: 'Spese', path: '/spese' as Href, icon: ReceiptText },
    { name: 'Liste Spesa', path: '/liste-spesa' as Href, icon: ShoppingCart },
    { name: 'Gruppi', path: '/gruppi' as Href, icon: Users },
  ];

  // Identifica se l'utente si trova su una delle 4 schermate principali della TabBar
  const isRootTab = NAV_ITEMS.some(item => item.path === pathname);

  // Titolo dinamico in base alla rotta attuale
  const getHeaderTitle = () => {
    if (pathname.startsWith('/gruppi/') || pathname.startsWith('/gruppo/')) return 'Info Gruppo';
    if (pathname.startsWith('/spesa/') || pathname.startsWith('/spese/')) return 'Info Spesa';
    if (pathname.startsWith('/lista-spesa/') || pathname.startsWith('/liste-spesa/')) return 'Articoli';
    if (pathname === '/nuova-spesa') return params.editId ? 'Modifica' : 'Nuovo';
    if (pathname === '/profilo') return 'Profilo';

    const currentItem = NAV_ITEMS.find(item => item.path === pathname);
    return currentItem ? currentItem.name : 'RoomSplit';
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      
      {/* HEADER SUPERIORE */}
      <View className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-row items-center justify-between px-4">
        
        {/* BACK BUTTON e TITOLO PAGINA */}
        <View className="flex-row items-center flex-1 pr-4">
          {!isRootTab && (
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mr-3 active:opacity-70"
            >
              <ChevronLeft size={22} color="#2563EB" />
            </TouchableOpacity>
          )}
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            {getHeaderTitle()}
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          {/* PROFILO */}
          <TouchableOpacity 
            className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-transparent active:opacity-70 justify-center items-center"
            onPress={() => router.push('/profilo' as Href)} 
          >
            {user?.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : user?.nome ? (
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {user.nome.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <User size={20} color="#64748b" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* AREA CONTENUTO PRINCIPALE */}
      <View className="flex-1 overflow-hidden">
        <Slot />
      </View>

      {/* BOTTOM TAB BAR */}
      <View className="flex-row justify-around bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe pt-2 px-2 shadow-lg">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => router.push(item.path)}
              className="items-center p-2 flex-1"
            >
              <View className={`p-1.5 rounded-full ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                <item.icon size={22} color={isActive ? '#2563eb' : '#94a3b8'} />
              </View>
              <Text className={`text-[10px] mt-1 font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}