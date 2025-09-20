/**
 * Servizio Mock per dati di demo
 * Fornisce dati simulati quando i servizi esterni non sono configurati
 */

const moment = require('moment');

class MockService {
  constructor() {
    this.shifts = this.generateMockShifts();
    this.users = new Map();
  }

  /**
   * Genera turni di esempio per la demo
   */
  generateMockShifts() {
    const today = moment();
    const shifts = [];

    // Genera turni per i prossimi 14 giorni
    for (let i = 0; i < 14; i++) {
      const date = today.clone().add(i, 'days');
      
      // Skip weekend se vuoi
      if (date.day() === 0 || date.day() === 6) continue;

      // Turni serali
      shifts.push({
        id: `mock-shift-${i}-1`,
        title: `Turno Serale Bar`,
        description: 'Gestione bar e cassa durante gli eventi serali',
        date: date.format('YYYY-MM-DD'),
        startTime: '18:00',
        endTime: '22:00',
        location: 'Sala Principale',
        status: Math.random() > 0.7 ? 'Prenotato' : 'Disponibile',
        user: Math.random() > 0.7 ? 'Mario Rossi' : null,
        email: Math.random() > 0.7 ? 'mario.rossi@email.com' : null,
        discordId: Math.random() > 0.7 ? 'mario#1234' : null,
        notes: Math.random() > 0.8 ? 'Prima volta al bar' : '',
        createdTime: date.subtract(7, 'days').toISOString(),
        lastEditedTime: date.subtract(1, 'days').toISOString()
      });

      // Turni pomeridiani
      if (i % 3 === 0) {
        shifts.push({
          id: `mock-shift-${i}-2`,
          title: `Turno Pomeridiano`,
          description: 'Gestione bar durante eventi pomeridiani',
          date: date.format('YYYY-MM-DD'),
          startTime: '14:00',
          endTime: '18:00',
          location: 'Sala Piccola',
          status: Math.random() > 0.6 ? 'Prenotato' : 'Disponibile',
          user: Math.random() > 0.6 ? 'Giulia Bianchi' : null,
          email: Math.random() > 0.6 ? 'giulia.bianchi@email.com' : null,
          discordId: Math.random() > 0.6 ? 'giulia#5678' : null,
          notes: '',
          createdTime: date.subtract(5, 'days').toISOString(),
          lastEditedTime: date.subtract(2, 'days').toISOString()
        });
      }

      // Turni speciali weekend
      if (date.day() === 5) { // Venerdì
        shifts.push({
          id: `mock-shift-${i}-3`,
          title: `Turno Weekend Speciale`,
          description: 'Gestione bar durante eventi weekend con maggiore affluenza',
          date: date.format('YYYY-MM-DD'),
          startTime: '19:00',
          endTime: '23:00',
          location: 'Sala Principale',
          status: Math.random() > 0.5 ? 'Prenotato' : 'Disponibile',
          user: Math.random() > 0.5 ? 'Luca Verdi' : null,
          email: Math.random() > 0.5 ? 'luca.verdi@email.com' : null,
          discordId: Math.random() > 0.5 ? 'luca#9999' : null,
          notes: 'Turno con maggiore responsabilità',
          createdTime: date.subtract(3, 'days').toISOString(),
          lastEditedTime: date.subtract(1, 'days').toISOString()
        });
      }
    }

    return shifts.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Ottiene tutti i turni disponibili
   */
  getShifts() {
    return this.shifts.filter(shift => shift.status === 'Disponibile');
  }

  /**
   * Ottiene un turno specifico per ID
   */
  getShiftById(shiftId) {
    return this.shifts.find(shift => shift.id === shiftId);
  }

  /**
   * Prenota un turno per un utente
   */
  bookShift(shiftId, userInfo) {
    const shift = this.getShiftById(shiftId);
    
    if (!shift) {
      throw new Error('Turno non trovato');
    }

    if (shift.status !== 'Disponibile') {
      throw new Error('Turno non più disponibile');
    }

    // Controlla conflitti
    this.checkUserConflicts(userInfo.userId, shift.date, shift.startTime, shift.endTime);

    // Aggiorna il turno
    shift.status = 'Prenotato';
    shift.user = userInfo.name;
    shift.email = userInfo.email;
    shift.discordId = userInfo.discordId;
    shift.notes = userInfo.notes;
    shift.lastEditedTime = new Date().toISOString();

    return {
      success: true,
      shift: shift,
      message: 'Turno prenotato con successo (modalità DEMO)'
    };
  }

  /**
   * Controlla conflitti per un utente
   */
  checkUserConflicts(userId, date, startTime, endTime) {
    const userShifts = this.shifts.filter(shift => 
      shift.status === 'Prenotato' && 
      shift.user && 
      shift.date === date
    );

    if (userShifts.length > 0) {
      throw new Error('Hai già un turno prenotato per questa data');
    }

    // Controlla sovrapposizioni temporali
    for (const existingShift of userShifts) {
      if (this.hasTimeConflict(startTime, endTime, existingShift.startTime, existingShift.endTime)) {
        throw new Error('Conflitto orario con turno già prenotato');
      }
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
   * Ottiene statistiche sui turni
   */
  getStats() {
    const total = this.shifts.length;
    const available = this.shifts.filter(s => s.status === 'Disponibile').length;
    const booked = this.shifts.filter(s => s.status === 'Prenotato').length;
    const completed = this.shifts.filter(s => s.status === 'Completato').length;

    return {
      total,
      available,
      booked,
      completed
    };
  }

  /**
   * Simula invio notifica Discord
   */
  async sendDiscordNotification(shift, userInfo) {
    console.log(`🤖 [DEMO] Notifica Discord inviata per turno ${shift.title}`);
    console.log(`👤 Utente: ${userInfo.name}`);
    console.log(`📅 Data: ${shift.date} ${shift.startTime}-${shift.endTime}`);
    
    return {
      success: true,
      messageId: `demo-${Date.now()}`,
      message: 'Notifica Discord simulata (modalità DEMO)'
    };
  }

  /**
   * Simula invio email
   */
  async sendEmailNotification(shift, userInfo) {
    console.log(`📧 [DEMO] Email inviata a ${userInfo.email}`);
    console.log(`📄 Oggetto: Conferma prenotazione - ${shift.title}`);
    
    return {
      success: true,
      messageId: `demo-email-${Date.now()}`,
      message: 'Email simulata (modalità DEMO)'
    };
  }

  /**
   * Simula creazione evento calendario
   */
  async createCalendarEvent(shift, userInfo) {
    console.log(`📅 [DEMO] Evento calendario creato per ${userInfo.email}`);
    console.log(`📝 Titolo: ${shift.title} - ${shift.date}`);
    
    return {
      success: true,
      eventId: `demo-event-${Date.now()}`,
      eventUrl: `https://calendar.google.com/event?eid=demo-${Date.now()}`,
      message: 'Evento calendario simulato (modalità DEMO)'
    };
  }
}

module.exports = new MockService();
