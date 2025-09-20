# 🏗️ Architettura Sistema Gestione Turni

## Diagramma Architetturale

```
┌─────────────────┐    HTTP/API    ┌─────────────────┐
│                 │◄──────────────►│                 │
│   Frontend      │                │   Backend       │
│   (HTML/CSS/JS) │                │   (Node.js)     │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
                                           │
                                           │ API Calls
                                           ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Notion Database│    │ Google Calendar │    │   Discord API   │
│                 │    │      API        │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Flusso dei Dati

1. **Visualizzazione Turni**: Frontend → Backend → Notion API → Database
2. **Prenotazione Turno**: Frontend → Backend → Notion API (aggiornamento)
3. **Notifica Calendario**: Backend → Google Calendar API → Email utente
4. **Notifica Discord**: Backend → Discord API → Canale/Utente

## Componenti Principali

### Frontend
- **index.html**: Interfaccia principale per visualizzare e prenotare turni
- **style.css**: Design minimalista e responsive
- **script.js**: Logica client-side per interazioni

### Backend
- **server.js**: Server Express principale
- **routes/**: Endpoints API
- **services/**: Servizi per integrazioni (Notion, Google Calendar, Discord)
- **utils/**: Funzioni di utilità

### Integrazioni
- **Notion API**: Database centralizzato per turni e utenti
- **Google Calendar API**: Aggiunta automatica eventi al calendario
- **Discord API**: Notifiche in tempo reale

## Identificazione Utenti

Gli utenti vengono identificati tramite:
- **Link univoco** generato per ogni persona
- **Identificatore semplice** basato su nome/email
- **Nessuna registrazione** richiesta
