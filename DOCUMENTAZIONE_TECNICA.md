# 📚 Documentazione Tecnica - Gestionale Turni Bar

## 🏗️ Architettura del Sistema

### Panoramica

Il sistema è progettato seguendo un'architettura client-server con integrazioni esterne per notifiche e gestione dati.

```
Frontend (HTML/CSS/JS) ↔ Backend (Node.js/Express) ↔ Servizi Esterni
                                        ├── Notion API (Database)
                                        ├── Google Calendar API
                                        ├── Discord API
                                        └── Email Service (SMTP)
```

### Componenti Principali

1. **Frontend**: Interfaccia utente responsive e intuitiva
2. **Backend**: API REST per gestione dati e logica business
3. **Servizi**: Integrazioni con piattaforme esterne
4. **Database**: Notion come database centralizzato

## 🔧 Backend - Architettura Dettagliata

### Server Express (`backend/server.js`)

Il server principale gestisce:

- **Middleware di Sicurezza**: Helmet, CORS, Rate Limiting
- **Route Statiche**: Servizio file frontend
- **API Routes**: Endpoints REST per funzionalità
- **Gestione Errori**: Middleware centralizzato
- **Inizializzazione Servizi**: Setup automatico delle integrazioni

```javascript
// Esempio struttura server
app.use(helmet());                    // Sicurezza
app.use(rateLimit());                 // Rate limiting
app.use(cors());                      // CORS
app.use(express.json());              // Parsing JSON
app.use('/api/shifts', shiftsRoutes); // Route API
app.use(express.static('frontend'));  // File statici
```

### Route API

#### `/api/shifts` - Gestione Turni

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/shifts` | Ottiene tutti i turni disponibili |
| GET | `/api/shifts/:id` | Ottiene un turno specifico |
| POST | `/api/shifts/:id/book` | Prenota un turno |
| DELETE | `/api/shifts/:id/book` | Cancella prenotazione |
| GET | `/api/shifts/stats` | Statistiche turni |
| GET | `/api/shifts/available` | Turni con filtri |

#### `/api/users` - Gestione Utenti

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/users/generate-link` | Genera link utente univoco |
| GET | `/api/users/:userId` | Ottiene dati utente |
| PUT | `/api/users/:userId/preferences` | Aggiorna preferenze |
| GET | `/api/users/:userId/bookings` | Prenotazioni utente |

### Servizi di Integrazione

#### NotionService (`backend/services/notionService.js`)

**Responsabilità**:
- Gestione database Notion
- CRUD operazioni sui turni
- Controllo conflitti prenotazioni
- Formattazione dati

**Metodi Principali**:
```javascript
async getShifts()                    // Recupera turni disponibili
async getShiftById(id)              // Recupera turno specifico
async bookShift(id, userInfo)       // Prenota turno
async checkUserConflicts()          // Verifica conflitti
async getStats()                    // Statistiche database
```

**Gestione Conflitti**:
- Controllo sovrapposizioni temporali
- Verifica prenotazioni multiple per data
- Validazione disponibilità turno

#### CalendarService (`backend/services/calendarService.js`)

**Responsabilità**:
- Integrazione Google Calendar API
- Creazione eventi automatici
- Gestione autenticazione OAuth2
- Formattazione eventi calendario

**Flusso Autenticazione**:
1. Genera URL autorizzazione Google
2. Utente autorizza l'applicazione
3. Scambia codice con token accesso
4. Crea evento nel calendario

**Metodi Principali**:
```javascript
generateAuthUrl(userId)             // URL autorizzazione
async getTokens(code)               // Scambia codice per token
async createEvent(shift, userInfo)  // Crea evento calendario
async updateEvent(eventId, shift)   // Aggiorna evento
async deleteEvent(eventId)          // Elimina evento
```

#### DiscordService (`backend/services/discordService.js`)

**Responsabilità**:
- Integrazione Discord Bot API
- Invio notifiche in tempo reale
- Gestione messaggi embed
- Notifiche personalizzate

**Tipi di Notifiche**:
- **Prenotazione**: Conferma nuova prenotazione
- **Cancellazione**: Notifica cancellazione
- **Promemoria**: Ricordi automatici
- **Disponibili**: Turni liberi

**Metodi Principali**:
```javascript
async sendBookingNotification()     // Notifica prenotazione
async sendCancellationNotification() // Notifica cancellazione
async sendReminderNotification()    // Promemoria turno
async sendAvailableShiftsNotification() // Turni disponibili
```

#### EmailService (`backend/services/emailService.js`)

**Responsabilità**:
- Invio email SMTP
- Template HTML personalizzati
- Conferme prenotazioni
- Promemoria email

**Template Email**:
- **Conferma Prenotazione**: Dettagli turno prenotato
- **Promemoria**: Ricordi automatici
- **Cancellazione**: Conferma cancellazione
- **Turni Disponibili**: Lista turni liberi

## 🎨 Frontend - Architettura Dettagliata

### Struttura HTML (`frontend/index.html`)

**Componenti Principali**:
- **Header**: Logo e informazioni utente
- **Welcome Screen**: Form registrazione utente
- **Dashboard**: Visualizzazione turni e statistiche
- **Modals**: Prenotazione e conferme
- **Toast**: Notifiche errori

### Stili CSS (`frontend/style.css`)

**Design System**:
- **Variabili CSS**: Colori, tipografia, spaziature
- **Componenti**: Bottoni, form, card, modals
- **Layout**: Grid responsive, flexbox
- **Temi**: Supporto dark mode (preparato)

**Responsive Design**:
- Mobile-first approach
- Breakpoints: 768px, 480px
- Grid adaptivo per turni
- Modal full-screen su mobile

### Logica JavaScript (`frontend/script.js`)

**Architettura**:
- **AppState**: Stato globale applicazione
- **Elements**: Cache elementi DOM
- **Event Handlers**: Gestione eventi utente
- **API Client**: Comunicazione backend

**Gestione Stato**:
```javascript
const AppState = {
  currentUser: null,        // Utente corrente
  shifts: [],              // Tutti i turni
  filteredShifts: [],      // Turni filtrati
  currentShift: null,      // Turno selezionato
  isLoading: false         // Stato caricamento
};
```

**Funzionalità Principali**:
- **Gestione Utenti**: Registrazione, login, logout
- **Visualizzazione Turni**: Caricamento, filtri, rendering
- **Prenotazioni**: Modal, validazione, conferma
- **Notifiche**: Toast errori, modal successo
- **Auto-refresh**: Aggiornamento automatico dati

## 🔄 Flusso di Prenotazione Dettagliato

### 1. Visualizzazione Turni

```
Utente apre app → Carica turni da Notion → Renderizza griglia → Applica filtri
```

### 2. Processo Prenotazione

```
Utente clicca "Prenota" → Apre modal → Compila form → Conferma prenotazione
    ↓
Backend riceve richiesta → Verifica disponibilità → Controlla conflitti
    ↓
Aggiorna Notion → Invia notifiche → Ritorna conferma
    ↓
Frontend aggiorna UI → Mostra risultati notifiche
```

### 3. Gestione Notifiche

**Parallelo** (non bloccanti):
- Discord: Notifica canale
- Email: Conferma utente
- Calendar: Link autorizzazione

**Gestione Errori**:
- Notifiche falliscono → Mostra warning
- Prenotazione fallisce → Rollback automatico
- Conflitti → Messaggio specifico

## 🔒 Sicurezza e Best Practices

### Sicurezza Backend

**Middleware di Sicurezza**:
```javascript
app.use(helmet());                    // Headers sicuri
app.use(rateLimit());                 // Prevenzione DDoS
app.use(cors({ origin: FRONTEND_URL })); // CORS limitato
```

**Validazione Input**:
- Sanitizzazione dati Notion
- Escape HTML frontend
- Validazione email/Discord ID
- Controllo autorizzazioni

**Gestione Errori**:
- Logging centralizzato
- Messaggi errori sicuri
- Rate limiting per API
- Timeout richieste

### Sicurezza Frontend

**XSS Prevention**:
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**Validazione Client-side**:
- Controllo form prima invio
- Validazione email/Discord
- Gestione errori API
- Sanitizzazione input utente

## 📊 Database Schema (Notion)

### Proprietà Database Turni

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| Titolo | Title | Nome turno | "Turno Serale Bar" |
| Descrizione | Text | Dettagli | "Gestione bar e cassa" |
| Data | Date | Data turno | 2024-01-15 |
| Ora Inizio | Text | Inizio (HH:mm) | "18:00" |
| Ora Fine | Text | Fine (HH:mm) | "22:00" |
| Luogo | Text | Posizione | "Sala Principale" |
| Stato | Select | Disponibile/Prenotato/Completato | "Disponibile" |
| Utente | Text | Nome prenotatore | "Mario Rossi" |
| Email | Email | Email prenotatore | "mario@email.com" |
| Discord ID | Text | ID Discord | "mario#1234" |
| Data Prenotazione | Date | Quando prenotato | 2024-01-10 |
| Note | Text | Note aggiuntive | "Prima volta" |

### Relazioni e Vincoli

**Integrità Dati**:
- Un turno può essere prenotato da un solo utente
- Stato turno: Disponibile → Prenotato → Completato
- Data prenotazione <= Data turno
- Ora inizio < Ora fine

**Indicizzazione**:
- Filtri per data (range queries)
- Filtri per stato
- Ricerca per utente
- Ordinamento cronologico

## 🚀 Deployment e Produzione

### Configurazione Vercel

**File `vercel.json`**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Variabili d'Ambiente Produzione

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.vercel.app

# Notion
NOTION_TOKEN=your_production_token
NOTION_DATABASE_ID=your_production_db_id

# Google Calendar
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/auth/google/callback

# Discord
DISCORD_BOT_TOKEN=your_production_bot_token
DISCORD_CHANNEL_ID=your_production_channel_id

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_production_email
EMAIL_PASS=your_production_app_password
```

### Monitoring e Logs

**Health Check Endpoint**:
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
```

**Logging Strutturato**:
```javascript
console.log(`✅ Turno ${shiftId} prenotato per ${userInfo.name}`);
console.error('❌ Errore nella prenotazione turno:', error);
```

## 🔧 Manutenzione e Sviluppo

### Aggiunta Nuove Funzionalità

1. **Backend**: Aggiungi route in `backend/routes/`
2. **Frontend**: Estendi `script.js` con nuove funzioni
3. **Styling**: Aggiungi classi CSS in `style.css`
4. **Integrazioni**: Estendi servizi esistenti

### Testing

**Test Manuali**:
- Prenotazione turno completo
- Test notifiche Discord/Email
- Test Google Calendar
- Test responsive design

**Test API**:
```bash
# Test endpoint health
curl https://your-domain.vercel.app/health

# Test turni
curl https://your-domain.vercel.app/api/shifts

# Test prenotazione
curl -X POST https://your-domain.vercel.app/api/shifts/SHIFT_ID/book \
  -H "Content-Type: application/json" \
  -d '{"userInfo":{"name":"Test","email":"test@test.com"}}'
```

### Backup e Recovery

**Backup Notion**:
- Esporta database periodicamente
- Backup automatico con integrazioni Notion
- Versioning delle modifiche

**Recovery Procedure**:
1. Ripristina database Notion da backup
2. Verifica configurazione servizi
3. Test completo funzionalità
4. Notifica utenti se necessario

---

Questa documentazione tecnica fornisce una panoramica completa dell'architettura e dell'implementazione del sistema. Per domande specifiche o estensioni, consulta il codice sorgente e la documentazione delle API utilizzate.
