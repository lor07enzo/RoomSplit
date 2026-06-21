# 🏠 RoomSplit — Gestione Spese e Budget per Studenti Fuorisede

> Un'applicazione moderna per gestire spese condivise, suddividere debiti e monitorare il budget tra coinquilini.

## 📋 Indice

1. [Descrizione del Progetto](#descrizione-del-progetto)
2. [Funzionalità Core (MVP)](#funzionalità-core-mvp)
3. [Stack Tecnologico e Infrastruttura](#stack-tecnologico-e-infrastruttura)
4. [Architettura di Sistema](#architettura-di-sistema)
5. [Documentazione API Swagger](#documentazione-api-swagger)
6. [API Endpoints Dettagliati](#api-endpoints-dettagliati)
7. [Setup e Avvio Locale (Quickstart)](#setup-e-avvio-locale-quickstart)
8. [Setup Ngrok per Webhook Telegram](#-setup-ngrok-per-webhook-telegram)
9. [Testing e Quality Assurance](#-testing-e-quality-assurance)
10. [Qualità del Codice con SonarQube](#-qualità-del-codice-con-sonarqube)
11. [Diagrammi e Documentazione](#-diagrammi-e-documentazione)
12. [Sviluppi Futuri e Roadmap](#-sviluppi-futuri-e-roadmap-fase-2)

---

## 📝 Descrizione del Progetto

**RoomSplit** è una piattaforma gestionale pensata per studenti fuorisede che condividono un appartamento. Sviluppata con una solida architettura backend e un approccio **Web-First**, permette di gestire le spese comuni, calcolare i saldi netti tra coinquilini e storicizzare i documenti.

Il progetto si concentra sulla robustezza delle API, sull'elaborazione documentale in cloud (estrazione costi da PDF/Immagini) e sulla qualità dell'infrastruttura con logica **DevSecOps**, offrendo un client web reattivo.

### Obiettivi architetturali e di prodotto
- ✅ Separazione netta delle responsabilità tra Client e API RESTful.
- ✅ Elaborazione sicura dei documenti tramite pipeline OCR/Parsing in memoria.
- ✅ **Modelli con UUID4**: Tutti i modelli Django utilizzano `UUIDField` come chiave primaria (ad eccezione delle notifiche Telegram) per prevenzione vulnerabilità IDOR e predisposizione alla sincronizzazione offline.
- ✅ Gestione automatizzata e centralizzata dei debiti/crediti (Net Balance).
- ✅ **Sicurezza DevSecOps**: Scansione continua del codice con SonarQube, gestione delle dipendenze e conformità.
- ✅ **Nota sul Database**: La progettazione logica è documentata nei file UML e nei diagrammi ER dedicati.

---

## Funzionalità Core (MVP)

### 👤 Gestione Utenti e Gruppi (Appartamenti)
- Sistema di autenticazione sicuro basato su token JWT.
- Creazione di gruppi ("appartamenti") con gestione dei ruoli (Admin/Membro).
- Meccanismo di invito tramite codice univoco.

### 📄 Pipeline Documentale (Upload e OCR)
- Integrazione di storage cloud per persistenza sicura di bollette e scontrini.
- Estrazione automatizzata degli importi tramite `pdfplumber` o `pytesseract`.
- Flusso di validazione "Human-in-the-loop": conferma/correzione prima del commit.

### 💸 Motore Finanziario e Net Balance
- Classificazione delle spese per categoria (Utenze, Spesa, Affitto, ecc.).
- Supporto per spese ricorrenti e divisioni personalizzate.
- Algoritmo di calcolo automatico dei saldi: "chi deve cosa a chi".
- Gestione e storicizzazione dei rimborsi fisici.

### 📊 Aggregazione Dati e Notifiche
- Dashboard di statistiche mensili e annuali calcolate dinamicamente.
- Notifiche asincrone tramite Webhook Telegram per avvisi istantanei.
- Previsioni di spesa basate su trend storici.

---

## 🛠️ Stack Tecnologico e Infrastruttura

### Backend & DevOps
| Tecnologia | Utilizzo |
|---|---|
| **Python 3.10+ & Django 6.0.4** | Core logic, ORM, sicurezza |
| **Django REST Framework 3.17.1** | Esposizione API e serializzazione dati |
| **PostgreSQL** | RDBMS principale (container Docker) |
| **Docker Desktop** | 4 container: Backend, SonarQube, PostgreSQL, Ngrok |
| **Docker Hub** | Repository pubblico del progetto |
| **SonarQube** | 🔒 Analisi statica, debito tecnico (container porta 9000) |
| **Ngrok** | 🔗 Tunnel sicuro per webhook Telegram da localhost (container porta 4040) |
| **drf-spectacular** | Documentazione OpenAPI 3.0 / Swagger |
| **Cloudinary** | Cloud storage per asset e documenti |
| **pdfplumber / pytesseract** | Engine per elaborazione documenti |
| **python-telegram-bot** | Webhook per notifiche realtime |
| **django-background-tasks** | Task scheduling asincroni |
| **djangorestframework_simplejwt** | JWT Token Authentication |

### Frontend (Beta)
| Tecnologia | Utilizzo |
|---|---|
| **React Native & Expo Router** | Universal Client (Web & Mobile routing) |
| **TypeScript** | Type safety |
| **TailwindCSS + NativeWind** | Utility-first styling |
| **Context API** | State management |
| **Axios & React Hook Form** | Data fetching e validazione |

---

## 🏗️ Architettura di Sistema

```text
┌─────────────────────────────────────────┐
│     CLIENT UNIVERSALE (Expo Router)     │
│      Web (Stabile) / Mobile (Beta)      |
└──────────────┬──────────────────────────┘
               │ HTTP/REST (JSON)
               ▼
┌─────────────────────────────────────────┐
│         BACKEND CONTAINERIZZATO         │
│             (Django + DRF)              │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │ Auth API    │   │ Spese/Rimborsi  │  │
│  └─────────────┘   └─────────────────┘  │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │ Documenti   │   │ Statistiche API │  │
│  └─────────────┘   └─────────────────┘  │
│ ┌─────────────────────────────────────┐ │
│ │   Parser PDF/OCR + Webhook Telegram │ │
│ └─────────────────────────────────────┘ │
└──────────────┬───────────────┬──────────┘
               │               │
       ┌───────┴───────┐       ▼
       ▼               │ ┌──────────────┐
┌────────────┐         │ │  Cloudinary  │
│PostgreSQL  │         │ │(File Storage)│
└────────────┘         | |______________|
       │               |________|
       ▼
┌──────────────────┐
│   SonarQube      │  🔒 Scansione continua
│  (DevSecOps)     │     codice & vulnerabilità
└──────────────────┘
```

---

## 📚 Documentazione API Swagger

L'API è completamente documentata con **OpenAPI 3.0** tramite **drf-spectacular**.

### Accesso alla Documentazione Interattiva

Avvia il backend e accedi a:

| Strumento | URL |
|-----------|-----|
| **Swagger UI** | [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) |
| **ReDoc** | [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/) |
| **Schema OpenAPI (JSON)** | [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/) |

---

## 📡 API Endpoints Dettagliati

### 🔐 Autenticazione (`/api/v1/auth/`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register/` | Registrazione nuovo utente |
| `POST` | `/api/v1/auth/login/` | Login e ottenimento token JWT |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh token JWT scaduto |
| `GET` | `/api/v1/auth/user/` | Profilo utente autenticato |

### 👥 Gruppi (`/api/v1/gruppi/`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/v1/gruppi/` | Lista gruppi dell'utente |
| `POST` | `/api/v1/gruppi/` | Creazione nuovo gruppo |
| `GET` | `/api/v1/gruppi/{id}/` | Dettagli di un gruppo |
| `PUT` | `/api/v1/gruppi/{id}/` | Modifica gruppo |
| `DELETE` | `/api/v1/gruppi/{id}/` | Eliminazione gruppo |

### 💰 Spese (`/api/v1/spese/`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/v1/spese/` | Lista spese (filtrate per gruppo) |
| `POST` | `/api/v1/spese/` | Registrazione nuova spesa |
| `GET` | `/api/v1/spese/{id}/` | Dettagli spesa |
| `PUT` | `/api/v1/spese/{id}/` | Modifica spesa |
| `DELETE` | `/api/v1/spese/{id}/` | Eliminazione spesa |
| `GET` | `/api/v1/categorie/` | Lista categorie spese |
| `GET` | `/api/v1/rimborsi/` | Lista rimborsi |
| `POST` | `/api/v1/rimborsi/` | Creazione rimborso |
| `GET` | `/api/v1/liste/` | Lista liste della spesa |
| `POST` | `/api/v1/liste/` | Creazione nuova lista |
| `GET` | `/api/v1/articoli/` | Articoli della lista |
| `GET` | `/api/v1/spese/saldi/` | Calcolo saldi tra coinquilini |

### 📊 Statistiche (`/api/v1/statistiche/`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/v1/statistiche/gruppo/mensili/` | Statistiche mensili per gruppo |
| `GET` | `/api/v1/statistiche/gruppo/annuali/` | Statistiche annuali per gruppo |
| `GET` | `/api/v1/statistiche/personali/` | Statistiche personali utente |
| `GET` | `/api/v1/statistiche/gruppo/{group_id}/forecast/` | Previsione spese (AI) |

### 📄 Documenti (`/api/v1/documenti/`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/v1/documenti/` | Lista documenti |
| `POST` | `/api/v1/documenti/` | Upload nuovo documento |
| `GET` | `/api/v1/documenti/{id}/` | Dettagli documento |
| `DELETE` | `/api/v1/documenti/{id}/` | Eliminazione documento |

### 🔔 Notifiche Telegram (`/api/v1/notifiche/`)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `POST` | `/api/v1/notifiche/telegram/generate-token/` | Genera token Telegram |
| `POST` | `/api/v1/notifiche/telegram/webhook/` | Webhook Telegram (riceve messaggi) |
| `GET` | `/api/v1/notifiche/telegram/status/` | Status connessione Telegram |

### 🔐 Autenticazione

Tutti gli endpoint (eccetto `/register/` e `/login/`) richiedono il token JWT.

**Header richiesto:**
```
Authorization: Bearer <your_jwt_token>
```

## 🚀 Setup e Avvio Locale (Quickstart)

### Prerequisiti
```bash
Python 3.13+
Node.js 18+
Docker & Docker Compose
Git
```

### 1. Clonare il Repository

```bash
git clone https://github.com/lor07enzo/RoomSplit.git
cd RoomSplit
```

### 2. Setup Backend (Django)

```bash
# Entra nella cartella backend
cd RoomSplit-be

# Crea ambiente virtuale
python -m venv .venv

# Attiva ambiente virtuale
# Su Windows:
.venv\Scripts\activate
# Su macOS/Linux:
source .venv/bin/activate

# Installa dipendenze
pip install -r requirements.txt

# Crea file .env dalla base
cp .env.example .env

# Configura variabili in .env:
# - SECRET_KEY
# - DEBUG=True (sviluppo)
# - DATABASE_URL
# - CLOUDINARY_URL
# - TELEGRAM_BOT_TOKEN (opzionale)

# Esegui migrazioni
python manage.py migrate

# (Opzionale) Crea superuser per admin
python manage.py createsuperuser
```

### 3. Setup Frontend (React Native Expo)

Il frontend **non usa Docker** e si avvia direttamente con Expo:

```bash
cd ../RoomSplit-fe

# Installa dipendenze
npm install

# Crea .env se necessario
# REACT_APP_API_URL=http://localhost:8000

# Avvia dev server Expo
npx expo start

# Premi 'w' per avviare su web browser (consigliato)
# Oppure scannerizza QR code con Expo Go su mobile
```

### 4. Avvia l'Applicazione

#### Opzione A: Con Docker Compose (Consigliato)

```bash
# Dalla root del progetto - Avvia i 4 container
docker-compose up -d

# Questo avvierà:
# - Backend Django (porta 8000)
# - PostgreSQL (porta 5432)
# - SonarQube (porta 9000)
# - Ngrok (per tunnel Telegram)

# Visualizza log del backend
docker-compose logs -f backend

# Visualizza log di SonarQube
docker-compose logs -f sonarqube

# Ferma tutti i servizi
docker-compose down
```

#### Opzione B: Esecuzione Locale (Senza Docker)

```bash
# Terminal 1 - Backend (richiede venv)
cd RoomSplit-be
source .venv/bin/activate  # o .venv\Scripts\activate su Windows
python manage.py runserver

# Terminal 2 - Frontend (non richiede Docker)
cd RoomSplit-fe
npx expo start
```

---

## 🔗 Setup Ngrok per Webhook Telegram

Ngrok crea un tunnel sicuro da **localhost → Internet** permettendo a Telegram di inviare i messaggi al tuo backend locale.

### Avvio di Ngrok (Nel Container Docker)

```bash
# Se usi Docker Compose, Ngrok si avvia automaticamente come container
docker-compose up -d ngrok

# Il tunnel sarà disponibile e registrato in background
```

### Configurazione Telegram Webhook

```bash
# 1. Ottieni il token del tuo Bot Telegram
TELEGRAM_BOT_TOKEN="<tuo_bot_token>"

# 2. Recupera l'URL pubblico di Ngrok (da Docker logs o dashboard)
# Esempio: https://abc123.ngrok.io

# 3. Registra il webhook con Telegram (curl dal tuo PC)
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok.io/api/v1/notifiche/telegram/webhook/"}'

# 4. Verifica il webhook
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo
```

### Flusso di Notifiche Telegram

```
Utente su Telegram
     ↓
Telegram API (invia POST a webhook)
     ↓
Ngrok Tunnel (https://abc123.ngrok.io)
     ↓
Backend Django (riceve su /api/v1/notifiche/telegram/webhook/)
     ↓
Elaborazione messaggio e registrazione notifica
     ↓
Response 200 OK a Telegram
```

**Variabili di ambiente necessarie (.env):**
```bash
TELEGRAM_BOT_TOKEN=<tuo_token>
NGROK_AUTHTOKEN=<tuo_authtoken_ngrok>  # Opzionale per collegamento account
WEBHOOK_BASE_URL=<url_pubblico_ngrok>   # Es: https://abc123.ngrok.io
```

---

## 🧪 Testing e Quality Assurance

### Esecuzione dei Test

```bash
cd RoomSplit-be

# Eseguire tutti i test
pytest

# Test con coverage
pytest --cov=. --cov-report=html

# Test di un'app specifica
pytest documenti
pytest spese
pytest gruppi
pytest users
pytest notifiche
pytest statistiche

# Test verboso
pytest -v

# Test di un file specifico
pytest users/tests/test_models.py -v
```

### Report di Coverage

```bash
# Genera report HTML
pytest --cov=. --cov-report=html

# Visualizza report
# Windows:
start htmlcov\index.html
# macOS:
open htmlcov/index.html
# Linux:
xdg-open htmlcov/index.html
```

### Standard di Codice

- ✅ Scrivi test per tutte le nuove funzionalità
- ✅ Segui **PEP 8** per Python, **ESLint** per TypeScript
- ✅ Aggiorna documentazione se modifichi il comportamento pubblico
- ✅ Assicura che tutti i test passino prima di fare una PR
- ✅ Controllo statico con **SonarQube** passa senza criticità

---

## 🔒 Qualità del Codice con SonarQube

Il progetto adotta una strategia **DevSecOps** con scansione continua del codice tramite **SonarQube** (locale) e **SonarCloud** (integrato con GitHub CI/CD).

### Setup SonarQube Locale

SonarQube gira su un container Docker dedicato sulla porta 9000 (già configurato in `docker-compose.yml`):

```bash
# Avvia SonarQube tramite Docker Compose (insieme ai altri servizi)
docker-compose up -d sonarqube

# Oppure avvia tutto insieme
docker-compose up -d

# Accedi a http://localhost:9000
# Default: admin/admin

# Visualizza i log di SonarQube
docker-compose logs -f sonarqube
```

### Scansione Automatica (GitHub Actions)

Ogni **push su GitHub** attiva automaticamente la pipeline CI/CD che esegue:

1. ✅ Build e test con pytest
2. 📊 Scansione SonarQube
3. 📈 Caricamento dei risultati su **SonarCloud**

**Accedi alle statistiche di qualità:**
- 🌐 **SonarCloud Dashboard**: [https://sonarcloud.io/organizations/lor07enzo/projects](https://sonarcloud.io/)
- 📊 **Branch Coverage**: Visualizza coverage per ogni branch
- 🐛 **Pull Request Analysis**: Feedback automatico su ogni PR

### Scansione Manuale Locale

```bash
# Installa SonarScanner
# https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/

# Esegui scansione dal progetto
sonar-scanner \
  -Dsonar.projectKey=roomsplit \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=<TOKEN>
```

### Metriche Monitorate

| Metrica | Target | Descrizione |
|---------|--------|-------------|
| **Code Coverage** | > 80% | Percentuale di codice coperto da test |
| **Code Smells** | 0 Critic | Problemi di qualità e maintainability |
| **Security Hotspots** | 0 | Potenziali vulnerabilità di sicurezza |
| **Duplicazione** | < 5% | Percentuale di codice duplicato |
| **Technical Debt** | < 1h | Tempo stimato per risolvere i problemi |
| **Complessità Ciclomatica** | < 20 | Complessità media delle funzioni |

---

## 📊 Diagrammi e Documentazione

### Diagramma Entity-Relationship

Vedi [diagramma-ER.md](./diagramma-ER.md)

### Diagramma UML

Vedi [diagramma-UML.md](./diagramma-UML.md)

---


## 🚀 Sviluppi Futuri e Roadmap (Fase 2+)

Il progetto è in continua evoluzione. Di seguito la roadmap pianificata per le prossime iterazioni:

### Fase 2: Mobile Nativo e Payments (Q3 2025)

| Feature | Descrizione | Priorità | Status |
|---------|-----------|----------|--------|
| **Mobile Native Release** | Build per iOS (TestFlight) e Android (Google Play) tramite EAS | 🔴 Alta | Planned |
| **Stripe Integration** | Payment gateway per liquidare rimborsi in-app con commissioni ottimizzate | 🔴 Alta | Planning |
| **PayPal Integration** | Support per alternative di pagamento globale | 🟡 Media | Backlog |
| **Push Notifications** | Notifiche realtime per nuove spese, rimborsi e saldamenti (Firebase Cloud Messaging) | 🔴 Alta | Backlog |
| **Offline Sync** | Sincronizzazione automatica quando ritorna la connessione | 🟡 Media | Backlog |

### Fase 3: AI & Analytics (Q4 2025)

| Feature | Descrizione | Priorità | Status |
|---------|-----------|----------|--------|
| **AI Predictive Modeling** | LLM-powered forecasting su endpoint `/api/v1/statistiche/gruppo/{group_id}/forecast/` | 🟡 Media | PoC in progress |
| **Smart Expense Categorization** | Classificazione automatica tramite NLP dalle descrizioni | 🟡 Media | Planned |
| **Budget Alerts** | Avvisi intelligenti quando spese si avvicinano al budget limite | 🟡 Media | Planned |
| **Advanced Analytics** | Dashboard con grafici avanzati (Heatmap, Correlation, Seasonality) | 🟡 Media | Planned |

### Fase 4: Enterprise & Data Export (2026)

| Feature | Descrizione | Priorità | Status |
|---------|-----------|----------|--------|
| **Data Exporting** | Export bilanci in `.pdf` (con grafica), `.xlsx` (raw data), `.csv` | 🟡 Media | Planned |
| **Audit Logs & Compliance** | Full tracking di tutte le modifiche per conformità fiscale | 🟡 Media | Planned |
| **Multi-currency Support** | Gestione spese in diverse valute con conversione automatica | 🟢 Bassa | Planned |
| **Integration with Tax Tools** | Export diretto per software contabili (es. Danea Easyfatt) | 🟢 Bassa | Planned |
| **API Webhooks Custom** | Permettere integrazioni third-party via webhook | 🟢 Bassa | Planned |

### Miglioramenti Continui (Ongoing)

- 🔒 **Security Hardening**: Regular penetration testing e aggiornamenti dei token JWT
- 📊 **Performance Optimization**: Caching strategico, pagination, query optimization
- 🧪 **Testing Coverage**: Aumento target coverage a 90%+
- 📱 **UX/UI Polish**: Refinement continuo basato su user feedback
- 🌍 **Internazionalizzazione (i18n)**: Support multi-lingua (IT, EN, ES, FR)
- ♿ **Accessibility (a11y)**: Compliance WCAG 2.1 AA

### Legenda Priorità
- 🔴 **Alta** - Critical per MVP, rilascio imminente
- 🟡 **Media** - Importante per competitività, timeline flessibile
- 🟢 **Bassa** - Nice-to-have, aggiunto se tempo/risorse

---


***Documentazione progetto RoomSplit sviluppato da Lorenzo Pelone***
