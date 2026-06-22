export type TipologiaRimborso = 'contanti' | 'paypal' | 'stripe';
export type StatusOCR = 'in_attesa' | 'elaborazione' | 'completato' | 'fallito';

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  avatar?: string;
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
  mio_ruolo?: string;
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
  user: User;
  gruppo?: Gruppo;
  pagatore?: User;
  categoria?: Categoria;
  importo: number;
  descrizione: string;
  is_personale: boolean;
  is_ricorrente:boolean;
  prossimo_pagamento?: Date;
  frequenza_numero: string;
  frequenza_tipo: string;
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
  nota?: string;
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

export interface SaldoMembro {
  membro_id: string;
  utente_id: string;
  nome: string;
  pagato_totale: number;
  quota_dovuta: number;
  rimborsi_inviati: number;
  rimborsi_ricevuti: number;
  bilancio: number; 
}

export interface SaldiResponse {
  gruppo_id: string;
  saldi: SaldoMembro[];
}

// Interfacce per statistiche
export interface CategoriaStatistica {
  nome_categoria: string;
  colore_categoria: string;
  totale_speso: number;
}

export interface StatisticheMensiliResponse {
  periodo: string;
  totale_speso: number;
  spese_per_categoria: CategoriaStatistica[];
  spesa_maggiore: {
    descrizione: string;
    importo: number;
    pagatore: string;
  } | null;
}

export interface StatisticheAnnualiResponse {
  anno: number;
  totale_anno: number;
  andamento_mensile: {
    mese: number;
    totale: number;
  }[];
}

export interface StatistichePersonaliResponse {
  mese: number;
  anno: number;
  spese_private_pure: number;
  tua_parte_spese_gruppo: number;
  rimborsi_effettuati: number;
  rimborsi_ricevuti: number;
  totale_uscita_mensile: number;
  totale_anno: number; 
  andamento_mensile: {
    mese: number;
    totale: number;
  }[];
}