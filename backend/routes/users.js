/**
 * Route per la gestione degli utenti
 * Endpoints API per gestire identificazione utenti e preferenze
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Simulazione di storage utenti (in produzione usare database)
let users = new Map();

/**
 * POST /api/users/generate-link
 * Genera un link univoco per un utente
 */
router.post('/generate-link', async (req, res) => {
  try {
    const { name, email, discordId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome obbligatorio',
        message: 'Il nome è richiesto per generare il link'
      });
    }

    const userId = uuidv4();
    const userData = {
      userId,
      name: name.trim(),
      email: email ? email.trim() : null,
      discordId: discordId ? discordId.trim() : null,
      createdAt: new Date().toISOString(),
      preferences: {
        enableEmail: !!email,
        enableDiscord: !!discordId,
        enableCalendar: false
      },
      bookings: []
    };

    // Salva i dati utente (in produzione usare database persistente)
    users.set(userId, userData);

    const userLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/user/${userId}`;

    res.json({
      success: true,
      data: {
        userId,
        userLink,
        userData: {
          name: userData.name,
          email: userData.email,
          discordId: userData.discordId
        }
      },
      message: 'Link utente generato con successo'
    });

  } catch (error) {
    console.error('Errore nella generazione link utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella generazione del link',
      message: error.message
    });
  }
});

/**
 * GET /api/users/:userId
 * Ottiene i dati di un utente specifico
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userData = users.get(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato',
        message: 'ID utente non valido o utente non esistente'
      });
    }

    // Non restituire dati sensibili
    const publicUserData = {
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      discordId: userData.discordId,
      preferences: userData.preferences,
      createdAt: userData.createdAt
    };

    res.json({
      success: true,
      data: publicUserData
    });

  } catch (error) {
    console.error('Errore nel recupero dati utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei dati utente',
      message: error.message
    });
  }
});

/**
 * PUT /api/users/:userId/preferences
 * Aggiorna le preferenze di un utente
 */
router.put('/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    const userData = users.get(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Aggiorna le preferenze
    userData.preferences = {
      ...userData.preferences,
      ...preferences
    };

    users.set(userId, userData);

    res.json({
      success: true,
      data: {
        preferences: userData.preferences
      },
      message: 'Preferenze aggiornate con successo'
    });

  } catch (error) {
    console.error('Errore nell\'aggiornamento preferenze:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento delle preferenze',
      message: error.message
    });
  }
});

/**
 * GET /api/users/:userId/bookings
 * Ottiene le prenotazioni di un utente
 */
router.get('/:userId/bookings', async (req, res) => {
  try {
    const { userId } = req.params;

    const userData = users.get(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      data: {
        bookings: userData.bookings || []
      }
    });

  } catch (error) {
    console.error('Errore nel recupero prenotazioni utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle prenotazioni',
      message: error.message
    });
  }
});

/**
 * POST /api/users/:userId/bookings
 * Aggiunge una prenotazione all'utente
 */
router.post('/:userId/bookings', async (req, res) => {
  try {
    const { userId } = req.params;
    const { bookingData } = req.body;

    const userData = users.get(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Aggiungi la prenotazione
    const booking = {
      ...bookingData,
      bookingId: uuidv4(),
      bookedAt: new Date().toISOString()
    };

    userData.bookings.push(booking);
    users.set(userId, userData);

    res.json({
      success: true,
      data: {
        booking
      },
      message: 'Prenotazione aggiunta con successo'
    });

  } catch (error) {
    console.error('Errore nell\'aggiunta prenotazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiunta della prenotazione',
      message: error.message
    });
  }
});

/**
 * DELETE /api/users/:userId/bookings/:bookingId
 * Rimuove una prenotazione dall'utente
 */
router.delete('/:userId/bookings/:bookingId', async (req, res) => {
  try {
    const { userId, bookingId } = req.params;

    const userData = users.get(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Rimuovi la prenotazione
    const initialLength = userData.bookings.length;
    userData.bookings = userData.bookings.filter(booking => booking.bookingId !== bookingId);

    if (userData.bookings.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Prenotazione non trovata'
      });
    }

    users.set(userId, userData);

    res.json({
      success: true,
      message: 'Prenotazione rimossa con successo'
    });

  } catch (error) {
    console.error('Errore nella rimozione prenotazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella rimozione della prenotazione',
      message: error.message
    });
  }
});

/**
 * GET /api/users/stats
 * Ottiene statistiche sugli utenti (per admin)
 */
router.get('/stats', async (req, res) => {
  try {
    const userList = Array.from(users.values());
    
    const stats = {
      totalUsers: userList.length,
      usersWithEmail: userList.filter(user => user.email).length,
      usersWithDiscord: userList.filter(user => user.discordId).length,
      totalBookings: userList.reduce((sum, user) => sum + (user.bookings?.length || 0), 0),
      recentlyCreated: userList.filter(user => {
        const createdAt = new Date(user.createdAt);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdAt > oneWeekAgo;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Errore nel recupero statistiche utenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche utenti',
      message: error.message
    });
  }
});

module.exports = router;
