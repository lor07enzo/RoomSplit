import "./global.css";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-900">
      <Text className="text-2xl font-bold text-teal-400">
        Tailwind funziona su React Native!
      </Text>
    </View>
  );
}