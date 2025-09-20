/**
 * Servizio per l'integrazione con Google Calendar API
 * Gestisce l'aggiunta automatica di eventi al calendario utente
 */

const { google } = require('googleapis');
const moment = require('moment');

class CalendarService {
  constructor() {
    this.oauth2Client = null;
    this.calendar = null;
    this.initialized = false;
  }

  /**
   * Inizializza il client Google Calendar
   */
  async initialize() {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('⚠️  Google Calendar non configurato - salta inizializzazione');
        return;
      }

      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
      );

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      this.initialized = true;

      console.log('📅 Google Calendar Service inizializzato');
    } catch (error) {
      console.error('❌ Errore inizializzazione Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Genera URL di autorizzazione per Google Calendar
   * @param {string} userId - ID utente per il callback
   * @returns {string} URL di autorizzazione
   */
  generateAuthUrl(userId) {
    if (!this.initialized) {
      throw new Error('Google Calendar Service non inizializzato');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent'
    });
  }

  /**
   * Scambia il codice di autorizzazione con i token
   * @param {string} code - Codice di autorizzazione
   * @returns {Object} Token di accesso
   */
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('❌ Errore nel recupero token:', error);
      throw error;
    }
  }

  /**
   * Imposta i token per un utente specifico
   * @param {Object} tokens - Token di accesso
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Crea un evento nel calendario Google
   * @param {Object} shift - Dettagli del turno
   * @param {Object} userInfo - Informazioni utente
   * @returns {Object} Evento creato
   */
  async createEvent(shift, userInfo) {
    try {
      if (!this.initialized) {
        throw new Error('Google Calendar Service non inizializzato');
      }

      // Verifica che i token siano validi
      if (!this.oauth2Client.credentials.access_token) {
        throw new Error('Token di accesso non disponibile');
      }

      const event = {
        summary: `Turno Bar - ${shift.title}`,
        description: this.formatEventDescription(shift, userInfo),
        start: {
          dateTime: this.formatDateTime(shift.date, shift.startTime),
          timeZone: 'Europe/Rome'
        },
        end: {
          dateTime: this.formatDateTime(shift.date, shift.endTime),
          timeZone: 'Europe/Rome'
        },
        location: shift.location || 'Associazione Culturale',
        attendees: [
          {
            email: userInfo.email,
            displayName: userInfo.name,
            responseStatus: 'accepted'
          }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 30 }
          ]
        },
        source: {
          title: 'Gestionale Turni Bar',
          url: process.env.FRONTEND_URL || 'http://localhost:3000'
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all'
      });

      console.log(`✅ Evento calendario creato: ${response.data.id}`);
      
      return {
        success: true,
        eventId: response.data.id,
        eventUrl: response.data.htmlLink,
        message: 'Evento aggiunto al calendario'
      };
    } catch (error) {
      console.error('❌ Errore nella creazione evento calendario:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un evento esistente
   * @param {string} eventId - ID dell'evento
   * @param {Object} shift - Nuovi dettagli del turno
   * @returns {Object} Evento aggiornato
   */
  async updateEvent(eventId, shift) {
    try {
      const event = {
        summary: `Turno Bar - ${shift.title}`,
        description: this.formatEventDescription(shift),
        start: {
          dateTime: this.formatDateTime(shift.date, shift.startTime),
          timeZone: 'Europe/Rome'
        },
        end: {
          dateTime: this.formatDateTime(shift.date, shift.endTime),
          timeZone: 'Europe/Rome'
        },
        location: shift.location || 'Associazione Culturale'
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      console.log(`✅ Evento calendario aggiornato: ${eventId}`);
      
      return {
        success: true,
        eventId: response.data.id,
        eventUrl: response.data.htmlLink,
        message: 'Evento aggiornato nel calendario'
      };
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento evento calendario:', error);
      throw error;
    }
  }

  /**
   * Elimina un evento dal calendario
   * @param {string} eventId - ID dell'evento
   * @returns {Object} Risultato dell'eliminazione
   */
  async deleteEvent(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      console.log(`✅ Evento calendario eliminato: ${eventId}`);
      
      return {
        success: true,
        message: 'Evento rimosso dal calendario'
      };
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione evento calendario:', error);
      throw error;
    }
  }

  /**
   * Formatta la data e ora per Google Calendar
   * @param {string} date - Data in formato YYYY-MM-DD
   * @param {string} time - Ora in formato HH:mm
   * @returns {string} Data/ora formattata per ISO 8601
   */
  formatDateTime(date, time) {
    const dateTime = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
    return dateTime.format('YYYY-MM-DDTHH:mm:ss');
  }

  /**
   * Formatta la descrizione dell'evento
   * @param {Object} shift - Dettagli del turno
   * @param {Object} userInfo - Informazioni utente
   * @returns {string} Descrizione formattata
   */
  formatEventDescription(shift, userInfo = null) {
    let description = `Turno presso l'Associazione Culturale\n\n`;
    
    if (shift.description) {
      description += `Descrizione: ${shift.description}\n\n`;
    }
    
    if (userInfo) {
      description += `Prenotato da: ${userInfo.name}\n`;
      if (userInfo.notes) {
        description += `Note: ${userInfo.notes}\n\n`;
      }
    }
    
    description += `Creato automaticamente dal Gestionale Turni Bar\n`;
    description += `Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`;
    
    return description;
  }

  /**
   * Verifica se i token sono validi
   * @returns {boolean} True se i token sono validi
   */
  async validateTokens() {
    try {
      if (!this.oauth2Client.credentials.access_token) {
        return false;
      }

      // Prova a fare una richiesta semplice per verificare i token
      await this.calendar.calendarList.list({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error('❌ Token non validi:', error.message);
      return false;
    }
  }

  /**
   * Rinnova i token se necessario
   * @returns {Object} Nuovi token
   */
  async refreshTokens() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials;
    } catch (error) {
      console.error('❌ Errore nel rinnovo token:', error);
      throw error;
    }
  }
}

module.exports = new CalendarService();
