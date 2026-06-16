import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { themeStorage } from '@/lib/storage';

export function useAppTheme() {
    const { colorScheme, setColorScheme } = useColorScheme();

    // Carica il tema salvato al mount del componente
    useEffect(() => {
        const initializeTheme = async () => {
        const savedTheme = await themeStorage.getTheme();
            if (savedTheme && savedTheme !== colorScheme) {
                setColorScheme(savedTheme);
            }
        };
        
        initializeTheme();
    }, [setColorScheme]);

    // Cambia il tema su NativeWind e salva in memoria
    const toggleTheme = () => {
        const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(newTheme);
        themeStorage.saveTheme(newTheme);
    };

    return {
        isDark: colorScheme === 'dark',
        toggleTheme,
        colorScheme
    };
}