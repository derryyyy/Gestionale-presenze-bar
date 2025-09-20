/**
 * Servizio per l'integrazione con Notion API
 * Gestisce la lettura e scrittura dei turni nel database Notion
 */

const { Client } = require('@notionhq/client');
const moment = require('moment');

class NotionService {
  constructor() {
    this.notion = null;
    this.databaseId = null;
    this.initialized = false;
  }

  /**
   * Inizializza il client Notion
   */
  async initialize() {
    try {
      if (!process.env.NOTION_TOKEN) {
        throw new Error('NOTION_TOKEN non configurato');
      }

      if (!process.env.NOTION_DATABASE_ID) {
        throw new Error('NOTION_DATABASE_ID non configurato');
      }

      this.notion = new Client({ auth: process.env.NOTION_TOKEN });
      this.databaseId = process.env.NOTION_DATABASE_ID;
      this.initialized = true;

      // Verifica che il database esista e sia accessibile
      await this.verifyDatabase();
      
      console.log('📊 Notion Service inizializzato correttamente');
    } catch (error) {
      console.error('❌ Errore inizializzazione Notion Service:', error);
      throw error;
    }
  }

  /**
   * Verifica che il database sia accessibile
   */
  async verifyDatabase() {
    try {
      const response = await this.notion.databases.retrieve({
        database_id: this.databaseId
      });
      
      console.log(`✅ Database Notion accessibile: ${response.title[0]?.plain_text || 'Senza titolo'}`);
      return true;
    } catch (error) {
      console.error('❌ Database Notion non accessibile:', error.message);
      throw error;
    }
  }

  /**
   * Ottiene tutti i turni disponibili
   * @returns {Array} Lista dei turni
   */
  async getShifts() {
    try {
      if (!this.initialized) {
        throw new Error('Servizio Notion non inizializzato');
      }

      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Stato',
          select: {
            equals: 'Disponibile'
          }
        },
        sorts: [
          {
            property: 'Data',
            direction: 'ascending'
          },
          {
            property: 'Ora Inizio',
            direction: 'ascending'
          }
        ]
      });

      const shifts = response.results.map(page => this.formatShift(page));
      console.log(`📅 Recuperati ${shifts.length} turni disponibili`);
      
      return shifts;
    } catch (error) {
      console.error('❌ Errore nel recupero turni:', error);
      throw error;
    }
  }

  /**
   * Ottiene un turno specifico per ID
   * @param {string} shiftId - ID del turno
   * @returns {Object} Dettagli del turno
   */
  async getShiftById(shiftId) {
    try {
      const response = await this.notion.pages.retrieve({
        page_id: shiftId
      });

      return this.formatShift(response);
    } catch (error) {
      console.error('❌ Errore nel recupero turno:', error);
      throw error;
    }
  }

  /**
   * Prenota un turno per un utente
   * @param {string} shiftId - ID del turno
   * @param {Object} userInfo - Informazioni utente
   * @returns {Object} Risultato della prenotazione
   */
  async bookShift(shiftId, userInfo) {
    try {
      if (!this.initialized) {
        throw new Error('Servizio Notion non inizializzato');
      }

      // Verifica che il turno sia ancora disponibile
      const shift = await this.getShiftById(shiftId);
      if (shift.status !== 'Disponibile') {
        throw new Error('Turno non più disponibile');
      }

      // Controlla conflitti per l'utente
      await this.checkUserConflicts(userInfo.userId, shift.date, shift.startTime, shift.endTime);

      // Aggiorna il turno con le informazioni utente
      const response = await this.notion.pages.update({
        page_id: shiftId,
        properties: {
          'Stato': {
            select: {
              name: 'Prenotato'
            }
          },
          'Utente': {
            rich_text: [
              {
                text: {
                  content: userInfo.name || 'Utente Anonimo'
                }
              }
            ]
          },
          'Email': {
            email: userInfo.email || ''
          },
          'Discord ID': {
            rich_text: [
              {
                text: {
                  content: userInfo.discordId || ''
                }
              }
            ]
          },
          'Data Prenotazione': {
            date: {
              start: moment().format('YYYY-MM-DD')
            }
          },
          'Note': {
            rich_text: [
              {
                text: {
                  content: userInfo.notes || ''
                }
              }
            ]
          }
        }
      });

      console.log(`✅ Turno ${shiftId} prenotato per ${userInfo.name}`);
      
      return {
        success: true,
        shift: this.formatShift(response),
        message: 'Turno prenotato con successo'
      };
    } catch (error) {
      console.error('❌ Errore nella prenotazione turno:', error);
      throw error;
    }
  }

  /**
   * Controlla conflitti per un utente
   * @param {string} userId - ID utente
   * @param {string} date - Data del turno
   * @param {string} startTime - Ora inizio
   * @param {string} endTime - Ora fine
   */
  async checkUserConflicts(userId, date, startTime, endTime) {
    try {
      // Cerca turni già prenotati dall'utente nella stessa data
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          and: [
            {
              property: 'Stato',
              select: {
                equals: 'Prenotato'
              }
            },
            {
              property: 'Data',
              date: {
                equals: date
              }
            },
            {
              property: 'Utente ID',
              rich_text: {
                contains: userId
              }
            }
          ]
        }
      });

      if (response.results.length > 0) {
        throw new Error('Hai già un turno prenotato per questa data');
      }

      // Controlla sovrapposizioni temporali
      for (const existingShift of response.results) {
        const existing = this.formatShift(existingShift);
        if (this.hasTimeConflict(startTime, endTime, existing.startTime, existing.endTime)) {
          throw new Error('Conflitto orario con turno già prenotato');
        }
      }
    } catch (error) {
      if (error.message.includes('Hai già') || error.message.includes('Conflitto')) {
        throw error;
      }
      console.error('❌ Errore nel controllo conflitti:', error);
      throw error;
    }
  }

  /**
   * Verifica se c'è conflitto tra due intervalli di tempo
   */
  hasTimeConflict(start1, end1, start2, end2) {
    const time1Start = moment(start1, 'HH:mm');
    const time1End = moment(end1, 'HH:mm');
    const time2Start = moment(start2, 'HH:mm');
    const time2End = moment(end2, 'HH:mm');

    return time1Start.isBefore(time2End) && time2Start.isBefore(time1End);
  }

  /**
   * Formatta i dati del turno da Notion
   * @param {Object} page - Pagina Notion
   * @returns {Object} Turno formattato
   */
  formatShift(page) {
    const properties = page.properties;
    
    return {
      id: page.id,
      title: this.getPropertyValue(properties, 'Titolo', 'title'),
      description: this.getPropertyValue(properties, 'Descrizione', 'rich_text'),
      date: this.getPropertyValue(properties, 'Data', 'date'),
      startTime: this.getPropertyValue(properties, 'Ora Inizio', 'rich_text'),
      endTime: this.getPropertyValue(properties, 'Ora Fine', 'rich_text'),
      location: this.getPropertyValue(properties, 'Luogo', 'rich_text'),
      status: this.getPropertyValue(properties, 'Stato', 'select'),
      user: this.getPropertyValue(properties, 'Utente', 'rich_text'),
      email: this.getPropertyValue(properties, 'Email', 'email'),
      discordId: this.getPropertyValue(properties, 'Discord ID', 'rich_text'),
      notes: this.getPropertyValue(properties, 'Note', 'rich_text'),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time
    };
  }

  /**
   * Estrae il valore da una proprietà Notion
   * @param {Object} properties - Proprietà della pagina
   * @param {string} name - Nome della proprietà
   * @param {string} type - Tipo della proprietà
   * @returns {any} Valore della proprietà
   */
  getPropertyValue(properties, name, type) {
    const property = properties[name];
    if (!property) return null;

    switch (type) {
      case 'title':
        return property.title?.[0]?.plain_text || '';
      case 'rich_text':
        return property.rich_text?.[0]?.plain_text || '';
      case 'select':
        return property.select?.name || '';
      case 'date':
        return property.date?.start || '';
      case 'email':
        return property.email || '';
      default:
        return null;
    }
  }

  /**
   * Ottiene statistiche sui turni
   * @returns {Object} Statistiche
   */
  async getStats() {
    try {
      const allShifts = await this.notion.databases.query({
        database_id: this.databaseId
      });

      const stats = {
        total: allShifts.results.length,
        available: 0,
        booked: 0,
        completed: 0
      };

      allShifts.results.forEach(shift => {
        const status = this.getPropertyValue(shift.properties, 'Stato', 'select');
        switch (status) {
          case 'Disponibile':
            stats.available++;
            break;
          case 'Prenotato':
            stats.booked++;
            break;
          case 'Completato':
            stats.completed++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Errore nel recupero statistiche:', error);
      throw error;
    }
  }
}

module.exports = new NotionService();
