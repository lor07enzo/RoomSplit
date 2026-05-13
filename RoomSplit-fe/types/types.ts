export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}