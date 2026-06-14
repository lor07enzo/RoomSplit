# 🏠 RoomSplit — App Mobile e Webapp per Studenti Fuorisede

## Indice
1. [Descrizione del Progetto](#descrizione-del-progetto)
2. [Funzionalità](#funzionalità)
3. [Stack Tecnologico](#stack-tecnologico)
4. [Architettura](#architettura)
5. [Struttura del Database](#struttura-del-database)
6. [API Endpoints](#api-endpoints)
7. [Roadmap di Sviluppo](#roadmap-di-sviluppo)

---

## Descrizione del Progetto

**RoomSplit** è un'app mobile e webapp pensata per studenti fuorisede che condividono un appartamento. Sviluppata con un approccio **Web-First** per garantire la massima accessibilità da browser, permette di gestire sia le **spese comuni** dell'appartamento (bollette, affitto, uscite, spesa, ecc.) da dividere con i coinquilini, sia le **spese personali** dell'utente in modo semplice e trasparente. Integra inoltre la possibilità di caricare documenti come bollette PDF sul cloud per l'estrazione automatica dei costi tramite AI.

### Obiettivi principali
- Semplificare la gestione economica tra coinquilini
- Automatizzare la lettura delle bollette tramite OCR/parsing PDF con storage in Cloud
- Offrire statistiche mensili, annuali e budget personali
- Fornire un sistema chiaro di debiti e crediti (Net Balance) tra utenti

---

## Funzionalità

### 👤 Gestione Utenti e Gruppi
- Registrazione e login con email/password
- Creazione di un **"appartamento"** (gruppo) con nome personalizzato
- Invito dei coinquilini tramite **link** o **codice univoco**
- Ruolo **amministratore** (capogruppo) e ruolo **membro**
- Possibilità di lasciare o sciogliere un gruppo

### 📄 Caricamento e Lettura Documenti
- Upload di bollette in formato **PDF o immagine** (luce, gas, acqua, internet)
- Estrazione automatica del **costo totale** tramite parsing del PDF (`pdfplumber`) o OCR (`pytesseract`) per immagini scansionate
- **Conferma manuale** da parte dell'utente prima di salvare il dato estratto
- Possibilità di correggere il valore estratto se errato

### 💸 Gestione Spese Condivise e Personali
Categorie di spesa supportate:
| Categoria | Esempi |
|---|---|
| 🔌 Utenze | Luce, gas, acqua, internet |
| 🚌 Trasporti | Abbonamento/Biglietto mezzi, benzina, parcheggio |
| 🛒 Spesa alimentare | Supermercato, prodotti per la casa |
| 🍕 Uscite | Ristoranti, cinema, serate |
| 🏠 Affitto | Canone mensile |
| 📦 Altro | Spese varie |

Per ogni spesa è possibile:
- Scegliere se è una **spesa condivisa** (legata all'appartamento) o una **spesa personale** (visibile solo all'utente)
- Inserire importo, data, categoria e descrizione libera
- (Se condivisa) Specificare **chi ha pagato** e scegliere tra divisione **equa** (per tutti) o **personalizzata** (solo per alcuni membri)
- (Se condivisa) Segnare la spesa come **saldata**

### ⚖️ Sistema Debiti e Crediti
- Calcolo automatico di **chi deve cosa a chi** nel gruppo
- Vista riepilogativa dei saldi per ogni membro
- Possibilità di registrare un **rimborso** tra coinquilini
- Storico delle transazioni e rimborsi

### 📊 Statistiche
**Mensili:**
- Totale speso per categoria
- Quota pro-capite del mese
- Confronto con il mese precedente
- Spesa maggiore del mese

**Annuali:**
- Andamento delle spese mese per mese (grafico a linee)
- Totale per categoria nell'anno (grafico a torta)
- Media mensile delle spese
- Mese più costoso e meno costoso

### 🛒 Lista della Spesa Condivisa
- Lista condivisa e aggiornata in tempo reale tra tutti i coinquilini
- Aggiunta, modifica e cancellazione di elementi
- Spunta degli articoli già acquistati
- Reset automatico dopo la conferma della spesa

### 📤 Export Dati
- Export del riepilogo spese mensile/annuale in **PDF**
- Export in **Excel (.xlsx)** per analisi personali

### 🔔 Notifiche e Bot
- Notifica quando un coinquilino aggiunge una nuova spesa (Push, Telegram o WhatsApp)
- Promemoria per spese ricorrenti (es. affitto mensile)
- Avviso quando un debito supera una soglia personalizzabile
- **Bot Telegram/WhatsApp**: Inserimento rapido di una spesa inviando un messaggio testuale o vocale al bot.

### 🔮 Predizione Spese
- Analisi dello storico delle bollette e dei trend di spesa per stimare i costi dei mesi successivi.
- Previsione del budget necessario per affrontare il mese corrente senza andare in rosso.

### 💳 Rimborsi In-App (Playground)
- Integrazione (in modalità Sandbox/Test) con le API di **Stripe** e **PayPal**.
- Simulazione del saldo dei debiti tra coinquilini con transazioni fittizie direttamente all'interno dell'app.

---

## Stack Tecnologico

### Backend
| Tecnologia | Versione consigliata | Utilizzo |
|---|---|---|
| **Python** | 3.13+ | Linguaggio principale |
| **Django** | 6.x | Framework web, ORM, autenticazione |
| **Django REST Framework** | 4.x | Creazione delle API REST |
| **PostgreSQL** | 17 | Database relazionale principale |
| **Cloudinary** | latest | Cloud storage per i file caricati (PDF, immagini) |
| **django-cloudinary-storage** | latest | Integrazione storage Django-Cloudinary |
| **django-background-task** | latest | Task asincrono per caricamento file in background |
| **pdfplumber** | latest | Estrazione testo da PDF (Lettura in RAM) |
| **pytesseract** | latest | OCR per immagini scansionate |
| **Pillow** | latest | Manipolazione immagini pre-OCR |
| **django-allauth** | latest | Login sociale (Google OAuth2) |
| **python-telegram-bot** | latest | Integrazione bot Telegram (Pianificata) |
| **stripe** / **paypal-checkout**| latest | SDK per pagamenti (Playground) |

### Frontend (App Mobile & Web)
| Tecnologia | Versione consigliata | Utilizzo |
|---|---|---|
| **React Native** | latest | Framework UI principale |
| **Expo Router** | latest | File-system routing ottimizzato per il Web e Mobile |
| **react-native-reusables**| latest | Libreria di componenti UI ispirata a shadcn/ui |
| **NativeWind** | latest | Styling basato su Tailwind CSS |
| **Axios** | latest | Chiamate HTTP asincrone alle API |
| **React Hook Form** | latest | Gestione validazione form |
| **React-native-victory** | latest | Visualizzazione grafici per statistiche |

### Infrastruttura e Deploy
| Tecnologia | Utilizzo |
|---|---|
| **Docker** | Tecnologia di conteinerizzazione |
| **Render** | Hosting backend e DB |
| **EAS (Expo Application Services)** | Build e deploy negli store (App Store / Google Play) |
| **Cloudinary** | Storage per i file caricati (PDF, immagini) |
| **GitHub** | Version control e CI/CD |

---

## Architettura

```
┌─────────────────────────────────────────┐
│        CLIENT UNIVERSALE (Expo Router)  │
│             Web / iOS / Android         │
└──────────────┬──────────────────────────┘
               │ HTTP/REST (JSON)
               ▼
┌─────────────────────────────────────────┐
│         BACKEND (Django + DRF)          │
│         Railway / Render                │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │  Auth API   │   │   Spese API     │  │
│  └─────────────┘   └─────────────────┘  │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │  File API   │   │ Statistiche API │  │
│  └─────────────┘   └─────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │     Parser PDF / OCR Engine      │   │
│  │   (Elaborazione File in RAM)     │   │
│  └──────────────────────────────────┘   │
└──────────────┬───────────────┬──────────┘
               │               │
       ┌───────┴───────┐       ▼
       ▼               │ ┌───────────────┐
┌────────────┐         │ │  File Storage │
│ PostgreSQL │         │ │ (Cloudinary)  │
│  (Railway) │         │ └───────────────┘
└────────────┘         └─────────────────┘
```

---

## Struttura del Database

> **Nota Architetturale:** Per garantire elevati standard di sicurezza, prevenire attacchi di enumerazione (IDOR) e facilitare future sincronizzazioni offline del client mobile, **tutte le chiavi primarie (`id`) del database utilizzano il formato UUIDv4** anziché interi auto-incrementanti. Di conseguenza, anche tutte le Foreign Key referenziano stringhe UUID.

### Tabella `user`
```
[id, email, nome, cognome, avatar, created_at]
```

### Tabella `gruppo`
```
[id, nome, codice_invito, created_at]
```

### Tabella `membro`
```
[id, user_id, gruppo_id, ruolo, created_at]
```

### Tabella `categoria`
```
[id, nome, icona, colore]
```

### Tabella `gruppo_spesa`
```
[id, user_id, gruppo_id, pagatore_id, categoria_id,
importo, descrizione, is_personale, saldata, is_ricorrente,
created_at, prossimo_pagamento]
```

### Tabella `documento`
```
[id, gruppo_spesa_id, caricato_da, file, nome_file, tipo_file, 
status_ocr, importo_estratto, uploaded_at]
```

### Tabella `spesa`
```
[id, gruppo_spesa_id, debitore_id, importo_dovuto]
```

### Tabella `rimborso`
```
[id, from_membro_id, to_membro_id, tipologia, importo, nota, created_at]
```

### Tabella `lista_spesa`
```
[id, user_id, gruppo_id, gruppo_spesa_id, titolo, created_at, updated_at]
```
### Tabella `articolo`
```
[id, lista_spesa_id, inserito_da, preso_da, nome, quantita, created_at]
```

---

## API Endpoints

### Autenticazione
```
POST   /api/v1/auth/register/         → Registrazione
POST   /api/v1/auth/login/            → Login
GET    /api/v1/auth/google/           → OAuth Google
```

### Gruppi
```
POST   /api/v1/gruppi/                → Crea gruppo
GET    /api/v1/gruppi/{id}/           → Dettaglio gruppo
POST   /api/v1/gruppi/join/           → Entra con codice invito
DELETE /api/v1/gruppi/{id}/           → Elimina gruppo
```

### Spese
```
GET    /api/v1/spese/                 → Lista spese del gruppo
POST   /api/v1/spese/                 → Aggiungi spesa
PUT    /api/v1/spese/{id}/            → Modifica spesa
DELETE /api/v1/spese/{id}/            → Elimina spesa
POST   /api/v1/spese/upload-pdf/      → Upload bolletta + estrazione
```

### Statistiche e Predizioni
```
GET    /api/v1/statistiche/gruppo/mensili/   → Statistiche mese corrente
GET    /api/v1/statistiche/gruppo/annuali/   → Statistiche anno corrente
GET    /api/v1/statistiche/gruppo/saldi/     → Saldi debiti/crediti
GET    /api/v1/statistiche/personali/        → Statistiche personali
GET    /api/v1/statistiche/predizioni/→ Stima prossime spese/bollette
```

### Pagamenti (Playground)
```
POST   /api/v1/pagamenti/stripe/intent/ → Crea un payment intent Stripe
POST   /api/v1/pagamenti/paypal/order/  → Crea un ordine PayPal
```

### Webhook Bot Chat
```
POST   /api/v1/webhooks/telegram/     → Ricezione messaggi Telegram
```

### Export
```
GET    /api/v1/export/pdf/            → Export PDF riepilogo
GET    /api/v1/export/excel/          → Export Excel
```

---

## Roadmap di Sviluppo

### Fase 1 — Setup e Autenticazione
- [x] Setup progetto Django + PostgreSQL
- [x] Setup progetto React Native con Expo Router
- [x] Sistema di registrazione e login (Backend)
- [ ] Login con Google (OAuth2)
- [x] Creazione e gestione gruppi/appartamenti

### Fase 2 — Gestione Spese Core
- [x] CRUD spese con categorie personalizzate
- [x] Divisione spese tra coinquilini transazionale
- [x] Sistema calcolo debiti e crediti (Net Balance)
- [x] Registrazione rimborsi

### Fase 3 — Upload e Parsing Documenti
- [x] Integrazione Cloudinary per file storage sicuro
- [x] Download file in RAM ed elaborazione sicura
- [x] Integrazione pdfplumber per PDF nativi
- [x] Integrazione pytesseract (OCR) con pattern matching intelligente
- [x] Sviluppo UI Frontend per conferma importo estratto

### Fase 4 — Statistiche e Dashboard
- [x] Sviluppo API Backend: Statistiche mensili e annuali
- [x] Sviluppo API Backend: Calcolo Saldi e Budget Personale
- [x] Sviluppo UI: Grafici mensili e andamento annuale
- [x] Sviluppo UI: Dashboard riepilogativa (Web & Mobile)

### Fase 5 — Funzionalità Extra
- [x] Lista della spesa condivisa
- [ ] Export PDF ed Excel
- [x] Notifiche Telegram
- [x] Dark mode (Supporto nativo tramite NativeWind)

### Fase 6 — Integrazioni Avanzate (AI, Pagamenti e Bot)
- [x] Configurazione Webhook e Bot Telegram
- [ ] Sviluppo logica di predizione spese storiche (stima prossime bollette)
- [ ] Integrazione Stripe e PayPal (ambiente Sandbox)

---

*Documentazione progetto RoomSplit sviluppato da Lorenzo Pelone*
