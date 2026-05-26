import { AuthProvider } from '@/context/AuthContext';
import { GruppiProvider } from '@/context/GruppiContext';
import { ListaSpesaProvider } from '@/context/ListaSpesaContext';
import { SpeseProvider } from '@/context/SpeseContext';
import { StatisticheProvider } from '@/context/StatisticheContext';
import '@/global.css';
import { Stack } from 'expo-router';


export default function RootLayout() {
  return (
    <AuthProvider>
      <StatisticheProvider>
        <ListaSpesaProvider>
          <GruppiProvider>
            <SpeseProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </SpeseProvider>
          </GruppiProvider>
        </ListaSpesaProvider>
      </StatisticheProvider>
    </AuthProvider>
  );
}
