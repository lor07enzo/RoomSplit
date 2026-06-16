import { api } from "@/lib/api";
import { AuthResponse, User } from "@/types/types";


export const authService = {
  register: async (dati: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/auth/register/', dati);
    return response.data;
  },

  login: async (credenziali: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/v1/auth/login/', credenziali);
    return response.data;
  },

  getUserProfile: async(): Promise<User> => {
    const response = await api.get<User>('/v1/auth/user/');
    return response.data;
  }
};