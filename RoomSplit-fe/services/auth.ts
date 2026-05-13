import { api } from "@/lib/api";
import { AuthResponse } from "@/types/types";
import { User } from "@/types/types";


export const authService = {
  register: async (dati: any): Promise<AuthResponse> => {
    // axios.post solleverà un'eccezione se il backend restituisce un errore (es. 400 o 500)
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