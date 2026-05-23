import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
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
  // Dati mockati per le notifiche (li collegheremo a Django via WebSocket o Polling)
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Nuova Spesa', message: 'Marco ha aggiunto 50€ per "Spesa Esselunga"', time: '10 min fa', unread: true },
    { id: '2', title: 'Affitto in scadenza', message: 'Ricordati di pagare la tua quota (300€) entro domani.', time: '2 ore fa', unread: true },
    { id: '3', title: 'Debito saldato', message: 'Giulia ti ha rimborsato 15€.', time: '1 giorno fa', unread: false },
  ]);

  if (isLoading) {
    return null; 
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }


  const unreadCount = notifications.filter(n => n.unread).length;

  const NAV_ITEMS: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard' as Href, icon: LayoutGrid },
    { name: 'Spese', path: '/spese' as Href, icon: ReceiptText },
    { name: 'Dispensa', path: '/dispensa' as Href, icon: ShoppingCart },
    { name: 'Gruppi', path: '/gruppi' as Href, icon: Users },
  ];

  // Identifica se l'utente si trova su una delle 4 schermate principali della TabBar
  const isRootTab = NAV_ITEMS.some(item => item.path === pathname);

  // Titolo dinamico in base alla rotta attuale
  const getHeaderTitle = () => {
    if (pathname.startsWith('/gruppi/') || pathname.startsWith('/gruppo/')) return 'Info Gruppo';
    if (pathname.startsWith('/spesa/') || pathname.startsWith('/spese/')) return 'Info Spesa';
    if (pathname === '/nuova-spesa') return params.editId ? 'Modifica' : 'Nuovo';
    if (pathname === '/profilo') return 'Profilo';

    const currentItem = NAV_ITEMS.find(item => item.path === pathname);
    return currentItem ? currentItem.name : 'RoomSplit';
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
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
          {/* NOTIFICHE */}
          <TouchableOpacity 
            className="p-2 relative"
            onPress={() => setIsNotificationsOpen(true)}
          >
            <Bell size={24} color="#64748b" />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
            )}
          </TouchableOpacity>

          {/* PROFILO */}
          <TouchableOpacity 
            className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full"
            onPress={() => router.push('/profilo' as Href)} 
          >
            <User size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL NOTIFICHE */}
      <Modal
        visible={isNotificationsOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNotificationsOpen(false)}
      >
        <Pressable 
          className="flex-1 bg-black/5 dark:bg-black/20"
          onPress={() => setIsNotificationsOpen(false)}
        >
          <View className="absolute top-16 right-4 w-[90%] max-w-[340px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[80%]">
            
            {/* HEADER DEL POPOVER */}
            <View className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <Text className="font-bold text-base text-slate-900 dark:text-white">
                Notifiche {unreadCount > 0 && `(${unreadCount})`}
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} className="p-1 rounded-md hover:bg-slate-200">
                  <Check size={18} color="#2563eb" />
                </TouchableOpacity>
              )}
            </View>

            {/* LISTA NOTIFICHE */}
            <ScrollView className="px-2" showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <Text className="text-center text-slate-500 py-6">Nessuna notifica recente.</Text>
              ) : (
                notifications.map((notif) => (
                  <TouchableOpacity 
                    key={notif.id} 
                    className={`p-3 my-1 rounded-xl flex-col ${notif.unread ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-transparent'}`}
                  >
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className={`font-semibold text-sm ${notif.unread ? 'text-blue-900 dark:text-blue-100' : 'text-slate-800 dark:text-slate-200'}`}>
                        {notif.title}
                      </Text>
                      <Text className="text-[10px] text-slate-400">{notif.time}</Text>
                    </View>
                    <Text className={`text-xs ${notif.unread ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {notif.message}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
              <View className="h-2" /> 
            </ScrollView>

          </View>
        </Pressable>
      </Modal>

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