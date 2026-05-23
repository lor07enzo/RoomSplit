import axios from 'axios';
import { tokenStorage } from './storage';


const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor di richiesta
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

// Interceptor di risposta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error("Refresh token non trovato nello storage.");
        }

        const refreshResponse = await axios.post(`${BASE_URL}/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResponse.data.access;
        await tokenStorage.saveAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch (refreshError) {
        console.error("Refresh fallito. Sessione definitivamente scaduta.");
        await tokenStorage.clearAllTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);