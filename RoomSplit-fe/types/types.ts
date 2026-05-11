export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
}

export interface AuthResponse {
  key: string;
  user: User;
}