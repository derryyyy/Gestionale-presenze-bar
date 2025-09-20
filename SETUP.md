# 🚀 Guida Setup Gestionale Turni Bar

Questa guida ti accompagnerà passo dopo passo nella configurazione del sistema di gestione turni per la tua associazione culturale.

## 📋 Prerequisiti

- Node.js 18+ installato
- Account Google (per Google Calendar)
- Account Discord (per le notifiche)
- Account Notion (per il database)
- Account email (Gmail consigliato)

## 🔧 Installazione

### 1. Clona e Installa Dipendenze

```bash
# Clona il repository
git clone https://github.com/derryyyy/Gestionale-presenze-bar.git
cd Gestionale-presenze-bar

# Installa le dipendenze
npm install
```

### 2. Configurazione Variabili d'Ambiente

Copia il file di esempio e configura le variabili:

```bash
cp env.example .env
```

Modifica il file `.env` con i tuoi valori:

```env
# Configurazione Server
PORT=3000
NODE_ENV=development

# Notion API
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Discord API
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_discord_channel_id

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 📊 Setup Database Notion

### 1. Crea un'Integrazione Notion

1. Vai su [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Clicca "New integration"
3. Dai un nome (es. "Gestionale Turni Bar")
4. Seleziona il workspace
5. Clicca "Submit"
6. Copia il "Internal Integration Token" → `NOTION_TOKEN`

### 2. Crea il Database Turni

1. Crea una nuova pagina in Notion
2. Aggiungi un database con le seguenti proprietà:

| Nome Proprietà | Tipo | Descrizione |
|----------------|------|-------------|
| Titolo | Title | Nome del turno |
| Descrizione | Text | Descrizione dettagliata |
| Data | Date | Data del turno |
| Ora Inizio | Text | Ora inizio (formato HH:mm) |
| Ora Fine | Text | Ora fine (formato HH:mm) |
| Luogo | Text | Luogo del turno |
| Stato | Select | Opzioni: Disponibile, Prenotato, Completato |
| Utente | Text | Nome utente che ha prenotato |
| Email | Email | Email utente |
| Discord ID | Text | ID Discord utente |
| Data Prenotazione | Date | Data della prenotazione |
| Note | Text | Note aggiuntive |

3. Condividi il database con l'integrazione:
   - Vai alle impostazioni del database
   - Clicca "Add connections"
   - Seleziona la tua integrazione

4. Copia l'ID del database dall'URL → `NOTION_DATABASE_ID`
   - URL formato: `https://notion.so/[WORKSPACE]/[DATABASE_ID]?v=[VIEW_ID]`

### 3. Aggiungi Turni di Esempio

Aggiungi alcuni turni di test nel database Notion per verificare il funzionamento.

## 📅 Setup Google Calendar API

### 1. Crea un Progetto Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita l'API Google Calendar:
   - Vai su "APIs & Services" > "Library"
   - Cerca "Google Calendar API"
   - Clicca "Enable"

### 2. Configura OAuth 2.0

1. Vai su "APIs & Services" > "Credentials"
2. Clicca "Create Credentials" > "OAuth 2.0 Client IDs"
3. Seleziona "Web application"
4. Aggiungi URI di reindirizzamento:
   - `http://localhost:3000/auth/google/callback` (sviluppo)
   - `https://your-domain.com/auth/google/callback` (produzione)
5. Copia Client ID e Client Secret → `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`

### 3. Configura Email per Notifiche

1. Abilita la verifica in 2 passaggi su Gmail
2. Genera una "Password per app":
   - Vai su Account Google > Sicurezza
   - Attiva "Verifica in 2 passaggi"
   - Genera "Password per app"
   - Usa questa password → `EMAIL_PASS`

## 🤖 Setup Discord Bot

### 1. Crea un Bot Discord

1. Vai su [Discord Developer Portal](https://discord.com/developers/applications)
2. Clicca "New Application"
3. Dai un nome (es. "Gestionale Turni Bar")
4. Vai su "Bot" nel menu laterale
5. Clicca "Add Bot"
6. Copia il token → `DISCORD_BOT_TOKEN`

### 2. Configura Permessi Bot

1. Vai su "OAuth2" > "URL Generator"
2. Seleziona scope: `bot`
3. Seleziona permessi:
   - Send Messages
   - Embed Links
   - Read Message History
   - Use Slash Commands
4. Copia l'URL generato e usalo per invitare il bot al tuo server

### 3. Ottieni ID Canale

1. Abilita la "Modalità sviluppatore" in Discord
2. Fai clic destro sul canale dove vuoi le notifiche
3. Clicca "Copia ID" → `DISCORD_CHANNEL_ID`

## 🚀 Avvio Applicazione

### Sviluppo

```bash
# Avvia in modalità sviluppo
npm run dev

# Oppure
npm start
```

L'applicazione sarà disponibile su: `http://localhost:3000`

### Produzione

Per il deploy su Vercel:

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🧪 Test del Sistema

### 1. Verifica Connessione Notion

```bash
curl http://localhost:3000/api/shifts
```

Dovrebbe restituire i turni dal database Notion.

### 2. Test Prenotazione

1. Apri `http://localhost:3000`
2. Inserisci i tuoi dati
3. Prova a prenotare un turno
4. Verifica le notifiche

### 3. Test Notifiche Discord

Controlla che il bot sia online nel tuo server Discord e che le notifiche arrivino nel canale configurato.

## 📱 Utilizzo del Sistema

### Per gli Utenti

1. **Accesso**: Gli utenti accedono tramite link univoci generati
2. **Prenotazione**: Cliccano su un turno disponibile e confermano
3. **Notifiche**: Ricevono conferme via email/Discord e eventi sul calendario

### Per gli Amministratori

1. **Gestione Turni**: Aggiungi/modifica turni direttamente in Notion
2. **Monitoraggio**: Controlla prenotazioni e statistiche dal dashboard
3. **Notifiche**: Ricevi notifiche su Discord per nuove prenotazioni

## 🔧 Risoluzione Problemi

### Errore "Notion Service non inizializzato"

- Verifica che `NOTION_TOKEN` sia corretto
- Controlla che `NOTION_DATABASE_ID` sia valido
- Assicurati che l'integrazione abbia accesso al database

### Errore "Discord Service non inizializzato"

- Verifica che `DISCORD_BOT_TOKEN` sia corretto
- Controlla che il bot sia invitato nel server
- Verifica che `DISCORD_CHANNEL_ID` sia corretto

### Errore "Google Calendar Service non inizializzato"

- Verifica che `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` siano corretti
- Controlla che l'API Google Calendar sia abilitata
- Verifica gli URI di reindirizzamento

### Email non funzionano

- Verifica che `EMAIL_USER` e `EMAIL_PASS` siano corretti
- Usa una "Password per app" di Gmail
- Controlla che la verifica in 2 passaggi sia attiva

## 📚 Struttura del Progetto

```
gestionale-presenze-bar/
├── backend/
│   ├── routes/          # API endpoints
│   ├── services/        # Servizi integrazioni
│   └── server.js        # Server principale
├── frontend/
│   ├── index.html       # Interfaccia utente
│   ├── style.css        # Stili CSS
│   └── script.js        # Logica frontend
├── package.json         # Dipendenze Node.js
├── .env.example         # Esempio configurazione
└── README.md           # Documentazione
```

## 🔒 Sicurezza

- Non condividere mai i token API
- Usa HTTPS in produzione
- Limita i permessi delle integrazioni al minimo necessario
- Aggiorna regolarmente le dipendenze

## 📞 Supporto

Per problemi o domande:

1. Controlla i log del server per errori dettagliati
2. Verifica la configurazione delle variabili d'ambiente
3. Testa le singole integrazioni separatamente
4. Consulta la documentazione delle API utilizzate

## 🎯 Prossimi Passi

Dopo il setup base, puoi:

1. Personalizzare l'interfaccia utente
2. Aggiungere funzionalità avanzate (statistiche, report)
3. Configurare backup automatici
4. Implementare notifiche push
5. Aggiungere autenticazione avanzata

---

**Buon lavoro con il tuo gestionale turni! 🎉**
