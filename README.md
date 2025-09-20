# 🍺 Gestionale Turni Bar - Associazione Culturale

Un sistema completo e intuitivo per la gestione dei turni del bar di un'associazione culturale. Permette ai membri di prenotare turni autonomamente senza creare account, con notifiche automatiche via Discord, email e Google Calendar.

## ✨ Caratteristiche Principali

- **🎯 Prenotazione Semplice**: Un click per prenotare un turno
- **🔗 Link Univoci**: Identificazione utenti senza registrazione
- **📱 Design Responsive**: Funziona perfettamente su mobile e desktop
- **🔔 Notifiche Automatiche**: Discord, email e Google Calendar
- **📊 Dashboard Completa**: Statistiche e monitoraggio turni
- **⚡ Tempo Reale**: Aggiornamenti automatici ogni 5 minuti

## 🏗️ Architettura

```
Frontend (HTML/CSS/JS) ↔ Backend (Node.js/Express) ↔ Servizi Esterni
                                        ├── Notion API (Database)
                                        ├── Google Calendar API
                                        ├── Discord API
                                        └── Email Service (SMTP)
```

## 🚀 Quick Start

### 1. Installazione

```bash
# Clona il repository
git clone https://github.com/derryyyy/Gestionale-presenze-bar.git
cd Gestionale-presenze-bar

# Installa dipendenze
npm install
```

### 2. Configurazione

```bash
# Copia il file di configurazione
cp env.example .env

# Modifica .env con i tuoi token API
# Vedi SETUP.md per la guida completa
```

### 3. Avvio

```bash
# Sviluppo
npm run dev

# Produzione
npm start
```

## 📚 Documentazione

- **[SETUP.md](SETUP.md)** - Guida completa per la configurazione
- **[DOCUMENTAZIONE_TECNICA.md](DOCUMENTAZIONE_TECNICA.md)** - Architettura e implementazione dettagliata
- **[ARCHITETTURA.md](ARCHITETTURA.md)** - Diagrammi e flussi del sistema

## 🛠️ Stack Tecnologico

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Notion API** - Database centralizzato
- **Google Calendar API** - Eventi calendario
- **Discord.js** - Bot notifiche
- **Nodemailer** - Invio email

### Frontend
- **HTML5** - Struttura semantica
- **CSS3** - Design moderno e responsive
- **JavaScript ES6+** - Logica client-side
- **Font Awesome** - Icone
- **Google Fonts** - Tipografia

### Deployment
- **Vercel** - Hosting serverless
- **Environment Variables** - Configurazione sicura

## 🎯 Funzionalità

### Per gli Utenti
- ✅ Visualizzazione turni disponibili
- ✅ Prenotazione con un click
- ✅ Notifiche automatiche (Discord, email, calendario)
- ✅ Gestione prenotazioni personali
- ✅ Filtri avanzati (data, luogo)
- ✅ Link personale per accesso rapido

### Per gli Amministratori
- ✅ Gestione turni tramite Notion
- ✅ Monitoraggio prenotazioni in tempo reale
- ✅ Statistiche complete
- ✅ Notifiche automatiche su Discord
- ✅ Backup automatico database

## 🔧 Configurazione Servizi

### Notion Database
- Database centralizzato per turni
- Proprietà personalizzate per ogni campo
- Integrazione API per operazioni CRUD

### Google Calendar
- Creazione automatica eventi
- OAuth2 per autorizzazione sicura
- Sincronizzazione calendario utente

### Discord Bot
- Notifiche in tempo reale
- Messaggi embed personalizzati
- Gestione canali e permessi

### Email SMTP
- Template HTML professionali
- Conferme prenotazioni
- Promemoria automatici

## 📱 Screenshots

### Dashboard Principale
- Visualizzazione turni disponibili
- Statistiche in tempo reale
- Filtri per data e luogo

### Prenotazione Turno
- Modal intuitivo per prenotazione
- Opzioni notifiche personalizzabili
- Conferma immediata

### Notifiche
- Discord: Messaggi embed colorati
- Email: Template HTML responsive
- Calendar: Eventi automatici

## 🔒 Sicurezza

- **Rate Limiting** - Prevenzione abusi
- **CORS** - Controllo accessi
- **Helmet** - Headers sicuri
- **Input Sanitization** - Prevenzione XSS
- **Token Management** - Gestione sicura API

## 📈 Performance

- **Serverless** - Scalabilità automatica Vercel
- **Caching** - Ottimizzazione richieste
- **Lazy Loading** - Caricamento ottimizzato
- **Responsive Design** - Performance mobile

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

## 🙏 Ringraziamenti

- **Notion** per la piattaforma database
- **Discord** per l'API bot
- **Google** per Calendar API
- **Vercel** per l'hosting serverless
- **Font Awesome** per le icone

## 📞 Supporto

Per problemi o domande:

1. Controlla la [documentazione](SETUP.md)
2. Apri una [issue](https://github.com/derryyyy/Gestionale-presenze-bar/issues)
3. Contatta l'associazione

---

**Sviluppato con ❤️ per l'Associazione Culturale**
