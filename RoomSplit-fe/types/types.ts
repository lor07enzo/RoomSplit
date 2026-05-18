export type TipologiaRimborso = 'contanti' | 'bonifico' | 'paypal' | 'satispay' | 'stripe' | 'altro';
export type StatusOCR = 'in_attesa' | 'elaborazione' | 'completato' | 'fallito';

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

export interface Categoria {
  id: string;
  nome: string;
  icona: string;
  colore: string;
}

export interface Gruppo {
  id: string;
  nome: string;
  codice_invito: string;
  created_at: string;
}

export interface Membro {
  id: string;
  user: User;
  gruppo: Gruppo;
  ruolo: 'admin' | 'membro';
  created_at: string;
}

export interface GruppoSpesa {
  id: string;
  nome: string;
  User: User;
  gruppo?: GruppoSpesa;
  pagatore?: User;
  categoria?: Categoria;
  importo: number;
  descrizione: string;
  is_personale: boolean;
  saldata: boolean;
  is_ricorrente:boolean;
  prossimo_pagamento?: Date;
  created_at: Date;
}

export interface Spesa {
  id: string;
  gruppo_spesa: GruppoSpesa;
  debitore: User;
  importo_dovuto: number;
}

export interface ListaSpesa {
  id: string;
  titolo: string;
  user: User;
  gruppo?: Gruppo;
  gruppo_spesa?: GruppoSpesa;
  created_at: Date;
  updated_at: Date;
}

export interface Articolo {
  id: string;
  nome: string;
  quantita: number;
  lista_spesa: ListaSpesa;
  inserito_da: User;
  preso_da?: User;
  created_at: Date;
}

export interface Rimborso {
  id: string;
  from_membro: Membro;
  to_membro: Membro;
  tipologia: TipologiaRimborso;
  importo: number;
  nota: string;
  created_at: Date;
}

export interface Documento {
  id: string;
  gruppo_spesa?: GruppoSpesa;
  caricato_da: User;
  nome_file: string;
  file: string;
  tipo_file: string;
  status_ocr: StatusOCR;
  importo_estratto?: number;
  uploaded_at: string;
}