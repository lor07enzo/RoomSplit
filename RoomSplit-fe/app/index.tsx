import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function RootIndex() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  // SMISTAMENTO
  if (user) {
    return <Redirect href="/(app)/dashboard" />;
  } else {
    return <Redirect href="/(auth)" />;
  }
}