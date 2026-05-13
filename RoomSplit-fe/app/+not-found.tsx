import { Stack, router } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Pagina non trovata' }} />
      <View className="flex-1 justify-center items-center bg-gray-50 p-4 space-y-4">
        <Text className="text-6xl font-bold text-gray-900">404</Text>
        <Text className="text-gray-500 text-center mb-4">
          Page Not Found: La pagina che stai cercando non esiste o è stata spostata.
        </Text>

        <Button onPress={() => router.replace('/')}>
          <Text className="text-white font-semibold">Torna alla Home</Text>
        </Button>
      </View>
    </>
  );
}
