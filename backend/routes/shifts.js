/**
 * Route per la gestione dei turni
 * Endpoints API per visualizzare, prenotare e gestire i turni
 */

const express = require('express');
const router = express.Router();
const notionService = require('../services/notionService');
const calendarService = require('../services/calendarService');
const discordService = require('../services/discordService');
const emailService = require('../services/emailService');
const mockService = require('../services/mockService');
const { v4: uuidv4 } = require('uuid');

// Determina quale servizio usare
const getDataService = () => {
  return (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) ? notionService : mockService;
};

/**
 * GET /api/shifts
 * Ottiene tutti i turni disponibili
 */
router.get('/', async (req, res) => {
  try {
    const dataService = getDataService();
    const shifts = await dataService.getShifts();
    res.json({
      success: true,
      data: shifts,
      count: shifts.length,
      demo: !(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID)
    });
  } catch (error) {
    console.error('Errore nel recupero turni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei turni',
      message: error.message
    });
  }
});

/**
 * GET /api/shifts/:id
 * Ottiene un turno specifico per ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dataService = getDataService();
    const shift = await dataService.getShiftById(id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Turno non trovato'
      });
    }

    res.json({
      success: true,
      data: shift
    });
  } catch (error) {
    console.error('Errore nel recupero turno:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del turno',
      message: error.message
    });
  }
});

/**
 * POST /api/shifts/:id/book
 * Prenota un turno per un utente
 */
router.post('/:id/book', async (req, res) => {
  try {
    const { id } = req.params;
    const { userInfo, enableCalendar, enableDiscord, enableEmail } = req.body;

    // Validazione input
    if (!userInfo || !userInfo.name) {
      return res.status(400).json({
        success: false,
        error: 'Informazioni utente mancanti',
        message: 'Nome utente è obbligatorio'
      });
    }

    // Genera ID utente univoco per la prenotazione
    userInfo.userId = uuidv4();

    // Prenota il turno
    const dataService = getDataService();
    const bookingResult = await dataService.bookShift(id, userInfo);
    
    if (!bookingResult.success) {
      return res.status(400).json(bookingResult);
    }

    const notifications = [];

    // Invio notifica Discord se abilitato
    if (enableDiscord) {
      try {
        let discordResult;
        if (discordService.isReady()) {
          discordResult = await discordService.sendBookingNotification(
            bookingResult.shift, 
            userInfo
          );
        } else {
          // Usa mock service per demo
          discordResult = await mockService.sendDiscordNotification(
            bookingResult.shift, 
            userInfo
          );
        }
        notifications.push({
          type: 'discord',
          success: discordResult.success,
          message: discordResult.message
        });
      } catch (discordError) {
        console.error('Errore notifica Discord:', discordError);
        notifications.push({
          type: 'discord',
          success: false,
          message: 'Errore nell\'invio notifica Discord'
        });
      }
    }

    // Invio email se abilitato
    if (enableEmail && userInfo.email) {
      try {
        let emailResult;
        if (emailService.isReady()) {
          emailResult = await emailService.sendBookingConfirmation(
            bookingResult.shift, 
            userInfo
          );
        } else {
          // Usa mock service per demo
          emailResult = await mockService.sendEmailNotification(
            bookingResult.shift, 
            userInfo
          );
        }
        notifications.push({
          type: 'email',
          success: emailResult.success,
          message: emailResult.message
        });
      } catch (emailError) {
        console.error('Errore email:', emailError);
        notifications.push({
          type: 'email',
          success: false,
          message: 'Errore nell\'invio email'
        });
      }
    }

    // Gestione Google Calendar se abilitato
    if (enableCalendar && userInfo.email) {
      try {
        let calendarResult;
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
          // Genera URL di autorizzazione per Google Calendar
          const authUrl = calendarService.generateAuthUrl(userInfo.userId);
          calendarResult = {
            success: true,
            message: 'Autorizzazione Google Calendar richiesta',
            authUrl: authUrl
          };
        } else {
          // Usa mock service per demo
          calendarResult = await mockService.createCalendarEvent(
            bookingResult.shift, 
            userInfo
          );
        }
        notifications.push({
          type: 'calendar',
          success: calendarResult.success,
          message: calendarResult.message,
          ...(calendarResult.authUrl && { authUrl: calendarResult.authUrl }),
          ...(calendarResult.eventUrl && { eventUrl: calendarResult.eventUrl })
        });
      } catch (calendarError) {
        console.error('Errore Google Calendar:', calendarError);
        notifications.push({
          type: 'calendar',
          success: false,
          message: 'Errore nella configurazione Google Calendar'
        });
      }
    }

    res.json({
      success: true,
      data: {
        shift: bookingResult.shift,
        userInfo: {
          ...userInfo,
          userId: userInfo.userId
        },
        notifications: notifications
      },
      message: 'Turno prenotato con successo'
    });

  } catch (error) {
    console.error('Errore nella prenotazione turno:', error);
    
    // Gestione errori specifici
    if (error.message.includes('non più disponibile') || 
        error.message.includes('già un turno') || 
        error.message.includes('Conflitto')) {
      return res.status(409).json({
        success: false,
        error: 'Conflitto nella prenotazione',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Errore nella prenotazione del turno',
      message: error.message
    });
  }
});

/**
 * DELETE /api/shifts/:id/book
 * Cancella la prenotazione di un turno
 */
router.delete('/:id/book', async (req, res) => {
  try {
    const { id } = req.params;
    const { userInfo, enableDiscord, enableEmail } = req.body;

    // Verifica che l'utente abbia effettivamente prenotato questo turno
    const shift = await notionService.getShiftById(id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Turno non trovato'
      });
    }

    if (shift.status !== 'Prenotato' || shift.user !== userInfo.name) {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato',
        message: 'Non hai prenotato questo turno'
      });
    }

    // Aggiorna il turno su Notion per renderlo di nuovo disponibile
    // (Implementazione semplificata - in produzione usare updateShift)
    
    const notifications = [];

    // Invio notifica Discord se abilitato
    if (enableDiscord && discordService.isReady()) {
      try {
        const discordResult = await discordService.sendCancellationNotification(shift, userInfo);
        notifications.push({
          type: 'discord',
          success: discordResult.success,
          message: discordResult.message
        });
      } catch (discordError) {
        console.error('Errore notifica Discord cancellazione:', discordError);
      }
    }

    // Invio email se abilitato
    if (enableEmail && emailService.isReady() && userInfo.email) {
      try {
        const emailResult = await emailService.sendCancellationConfirmation(shift, userInfo);
        notifications.push({
          type: 'email',
          success: emailResult.success,
          message: emailResult.message
        });
      } catch (emailError) {
        console.error('Errore email cancellazione:', emailError);
      }
    }

    res.json({
      success: true,
      data: {
        shift: shift,
        notifications: notifications
      },
      message: 'Prenotazione cancellata con successo'
    });

  } catch (error) {
    console.error('Errore nella cancellazione turno:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella cancellazione della prenotazione',
      message: error.message
    });
  }
});

/**
 * GET /api/shifts/stats
 * Ottiene statistiche sui turni
 */
router.get('/stats', async (req, res) => {
  try {
    const dataService = getDataService();
    const stats = await dataService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Errore nel recupero statistiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche',
      message: error.message
    });
  }
});

/**
 * GET /api/shifts/available
 * Ottiene solo i turni disponibili con filtri
 */
router.get('/available', async (req, res) => {
  try {
    const { date, location, limit } = req.query;
    
    const dataService = getDataService();
    let shifts = await dataService.getShifts();
    
    // Filtro per data se specificato
    if (date) {
      shifts = shifts.filter(shift => shift.date === date);
    }
    
    // Filtro per luogo se specificato
    if (location) {
      shifts = shifts.filter(shift => 
        shift.location && shift.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    // Limita i risultati se specificato
    if (limit) {
      shifts = shifts.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: shifts,
      count: shifts.length,
      filters: { date, location, limit }
    });
  } catch (error) {
    console.error('Errore nel recupero turni disponibili:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei turni disponibili',
      message: error.message
    });
  }
});

module.exports = router;
