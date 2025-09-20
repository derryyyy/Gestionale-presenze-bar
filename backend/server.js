/**
 * Server principale per il sistema di gestione turni
 * Gestisce API REST per frontend, integrazioni con Notion, Google Calendar e Discord
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importa i servizi
const notionService = require('./services/notionService');
const calendarService = require('./services/calendarService');
const discordService = require('./services/discordService');
const emailService = require('./services/emailService');

// Importa le route
const shiftsRoutes = require('./routes/shifts');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware di sicurezza
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting per prevenire abusi
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // massimo 100 richieste per IP ogni 15 minuti
  message: 'Troppe richieste da questo IP, riprova più tardi.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware per parsing JSON e CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servi file statici dalla cartella frontend
app.use(express.static('frontend'));

// Route API
app.use('/api/shifts', shiftsRoutes);
app.use('/api/users', usersRoutes);

// Route principale - serve l'interfaccia frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../frontend/index.html');
});

// Route per link utente univoci
app.get('/user/:userId', (req, res) => {
  res.sendFile(__dirname + '/../frontend/index.html');
});

// Route di health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware per gestione errori
app.use((err, req, res, next) => {
  console.error('Errore server:', err);
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Qualcosa è andato storto'
  });
});

// Middleware per route non trovate
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trovata' });
});

// Inizializzazione servizi
async function initializeServices() {
  try {
    console.log('🚀 Inizializzazione servizi...');
    
    // Verifica configurazione Notion
    if (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) {
      await notionService.initialize();
      console.log('✅ Servizio Notion inizializzato');
    } else {
      console.warn('⚠️  Servizio Notion non configurato - modalità DEMO attiva');
    }

    // Verifica configurazione Discord
    if (process.env.DISCORD_BOT_TOKEN) {
      await discordService.initialize();
      console.log('✅ Servizio Discord inizializzato');
    } else {
      console.warn('⚠️  Servizio Discord non configurato - notifiche simulate');
    }

    // Verifica configurazione Google Calendar
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      console.log('✅ Configurazione Google Calendar pronta');
    } else {
      console.warn('⚠️  Google Calendar non configurato - eventi simulati');
    }

    console.log('🎉 Tutti i servizi inizializzati correttamente');
    console.log('📝 Modalità DEMO: usa dati mock per testare l\'interfaccia');
  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione dei servizi:', error);
  }
}

// Avvio server
app.listen(PORT, async () => {
  console.log(`🌟 Server in esecuzione su http://localhost:${PORT}`);
  console.log(`📱 Frontend disponibile su http://localhost:${PORT}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  await initializeServices();
});

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Ricevuto SIGTERM, spegnimento graceful...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Ricevuto SIGINT, spegnimento graceful...');
  process.exit(0);
});

module.exports = app;
