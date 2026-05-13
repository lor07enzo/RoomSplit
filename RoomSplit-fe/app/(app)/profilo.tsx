import { Button } from "@/components/ui/button";
import { Text } from '@/components/ui/text';
import { useAuth } from "@/context/AuthContext";
import { View } from "react-native";


export default function ProfiloScreen() {
    const { logout } = useAuth();

    return (
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Button variant="destructive" size="sm" onPress={logout}>
                <Text className="text-white font-semibold">Esci (Logout)</Text>
            </Button>
        </View>
    )
}