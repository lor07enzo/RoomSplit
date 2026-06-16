import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';


const ACCESS_TOKEN_KEY = 'roomsplit_access_token';
const REFRESH_TOKEN_KEY = 'roomsplit_refresh_token';
const THEME_KEY = 'roomsplit_theme';

export const tokenStorage = {
  // Salva ENTRAMBI i token 
  async saveTokens(accessToken: string, refreshToken: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  // Aggiorna SOLO l'access token 
  async saveAccessToken(accessToken: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    }
  },

  // Recupera l'Access Token per le chiamate API normali
  async getAccessToken() {
    if (Platform.OS === 'web') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  // Recupera il Refresh Token per rinnovare la sessione
  async getRefreshToken() {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  // Rimuove tutto (usato per Logout o refresh token scaduto)
  async clearAllTokens() {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  }
};

// Storage per la preferenza del tema (light/dark)
export const themeStorage = {
  async saveTheme(theme: 'light' | 'dark') {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(THEME_KEY, theme);
      } else {
        await SecureStore.setItemAsync(THEME_KEY, theme);
      }
    } catch (error) {
      console.error("Errore salvataggio tema:", error);
    }
  },

  async getTheme(): Promise<'light' | 'dark' | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
      }
      return (await SecureStore.getItemAsync(THEME_KEY)) as 'light' | 'dark' | null;
    } catch (error) {
      console.error("Errore recupero tema:", error);
      return null;
    }
  }
};