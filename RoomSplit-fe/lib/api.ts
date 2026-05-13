import axios from 'axios';
import { tokenStorage } from './storage';


const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Si Attiva prima di ogni richiesta per aggiungere il token di autenticazione se presente.
api.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercetta le risposte  inviate dal server.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Salviamo la configurazione della richiesta originale che è fallita
    const originalRequest = error.config;

    // Se l'errore è 401 e NON abbiamo ancora provato a fare il refresh 
    // (la variabile _retry serve per evitare loop infiniti se il backend è rotto)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Segnamo che stiamo riprovando

      try {
        // 1. Prendi il refresh token dallo storage (Dovrai implementare questo metodo)
        const refreshToken = await tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
            throw new Error("Refresh token mancante");
        }

        // 2. Chiedi un nuovo access token a Django (Sostituisci l'URL con la tua rotta reale)
        // Usiamo axios standard qui, NON l'istanza 'api', per non far scattare di nuovo gli interceptor
        const refreshResponse = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResponse.data.access;

        // 3. Salva il nuovo access token nello storage
        await tokenStorage.saveAccessToken(newAccessToken);

        // 4. Aggiorna l'header della richiesta originale fallita con il nuovo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 5. Ripeti la richiesta originale
        return api(originalRequest);

      } catch (refreshError) {
        // Se arriviamo qui, il refresh token è invalido o scaduto.
        // ORA è il momento giusto per buttar fuori l'utente!
        console.warn("Refresh fallito. Sessione definitivamente scaduta.");
        
        // Dovresti avere un metodo che cancella ENTRAMBI i token
        await tokenStorage.clearAllTokens(); 
        
        return Promise.reject(refreshError);
      }
    }
    
    // Per tutti gli altri errori (es. 404, 500) o se il retry fallisce, passa l'errore avanti
    return Promise.reject(error);
  }
);