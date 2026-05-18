import { AuthProvider } from '@/context/AuthContext';
import { SpeseProvider } from '@/context/SpeseContext';
import '@/global.css';
import { Stack } from 'expo-router';


export default function RootLayout() {
  return (
    <AuthProvider>
      <SpeseProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SpeseProvider>
    </AuthProvider>
  );
}
