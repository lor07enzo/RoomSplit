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
    const token = await tokenStorage.getToken();
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
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
    if (error.response && error.response.status === 401) {
      console.warn("Sessione scaduta o token non valido. Pulizia in corso...");
      await tokenStorage.removeToken();
    }
    return Promise.reject(error);
  }
);