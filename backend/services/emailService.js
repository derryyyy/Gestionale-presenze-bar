/**
 * Servizio per l'invio di email
 * Gestisce notifiche via email per prenotazioni e promemoria
 */

const nodemailer = require('nodemailer');
const moment = require('moment');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Inizializza il servizio email
   */
  async initialize() {
    try {
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Configurazione email non completa - salta inizializzazione');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true per 465, false per altri porti
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verifica la connessione
      await this.transporter.verify();
      
      this.initialized = true;
      console.log('📧 Email Service inizializzato');
    } catch (error) {
      console.error('❌ Errore inizializzazione Email Service:', error);
      throw error;
    }
  }

  /**
   * Invia email di conferma prenotazione
   * @param {Object} shift - Dettagli del turno
   * @param {Object} userInfo - Informazioni utente
   * @returns {Object} Risultato dell'invio
   */
  async sendBookingConfirmation(shift, userInfo) {
    try {
      if (!this.initialized) {
        throw new Error('Email Service non inizializzato');
      }

      if (!userInfo.email) {
        throw new Error('Email utente non fornita');
      }

      const subject = `✅ Conferma Prenotazione Turno - ${shift.title}`;
      const html = this.generateBookingConfirmationHTML(shift, userInfo);

      const mailOptions = {
        from: `"Gestionale Turni Bar" <${process.env.EMAIL_USER}>`,
        to: userInfo.email,
        subject: subject,
        html: html,
        text: this.generateBookingConfirmationText(shift, userInfo)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email conferma prenotazione inviata a ${userInfo.email}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email di conferma inviata'
      };
    } catch (error) {
      console.error('❌ Errore nell\'invio email conferma:', error);
      throw error;
    }
  }

  /**
   * Invia email di promemoria turno
   * @param {Object} shift - Dettagli del turno
   * @param {Object} userInfo - Informazioni utente
   * @param {string} reminderType - Tipo di promemoria (1h, 1d, etc.)
   * @returns {Object} Risultato dell'invio
   */
  async sendReminder(shift, userInfo, reminderType = '1h') {
    try {
      if (!this.initialized) {
        throw new Error('Email Service non inizializzato');
      }

      if (!userInfo.email) {
        throw new Error('Email utente non fornita');
      }

      const timeText = reminderType === '1h' ? '1 ora' : '1 giorno';
      const subject = `⏰ Promemoria Turno - ${timeText} all'inizio`;
      const html = this.generateReminderHTML(shift, userInfo, reminderType);

      const mailOptions = {
        from: `"Gestionale Turni Bar" <${process.env.EMAIL_USER}>`,
        to: userInfo.email,
        subject: subject,
        html: html,
        text: this.generateReminderText(shift, userInfo, reminderType)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email promemoria inviata a ${userInfo.email}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email promemoria inviata'
      };
    } catch (error) {
      console.error('❌ Errore nell\'invio email promemoria:', error);
      throw error;
    }
  }

  /**
   * Invia email di cancellazione turno
   * @param {Object} shift - Dettagli del turno
   * @param {Object} userInfo - Informazioni utente
   * @returns {Object} Risultato dell'invio
   */
  async sendCancellationConfirmation(shift, userInfo) {
    try {
      if (!this.initialized) {
        throw new Error('Email Service non inizializzato');
      }

      if (!userInfo.email) {
        throw new Error('Email utente non fornita');
      }

      const subject = `❌ Cancellazione Turno - ${shift.title}`;
      const html = this.generateCancellationHTML(shift, userInfo);

      const mailOptions = {
        from: `"Gestionale Turni Bar" <${process.env.EMAIL_USER}>`,
        to: userInfo.email,
        subject: subject,
        html: html,
        text: this.generateCancellationText(shift, userInfo)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email cancellazione inviata a ${userInfo.email}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email di cancellazione inviata'
      };
    } catch (error) {
      console.error('❌ Errore nell\'invio email cancellazione:', error);
      throw error;
    }
  }

  /**
   * Invia email di notifica turni disponibili
   * @param {Array} shifts - Lista turni disponibili
   * @param {Array} recipients - Lista email destinatari
   * @returns {Object} Risultato dell'invio
   */
  async sendAvailableShiftsNotification(shifts, recipients) {
    try {
      if (!this.initialized) {
        throw new Error('Email Service non inizializzato');
      }

      if (shifts.length === 0) {
        return {
          success: true,
          message: 'Nessun turno disponibile da notificare'
        };
      }

      const subject = `📋 ${shifts.length} Turni Disponibili`;
      const html = this.generateAvailableShiftsHTML(shifts);

      const mailOptions = {
        from: `"Gestionale Turni Bar" <${process.env.EMAIL_USER}>`,
        to: recipients.join(', '),
        subject: subject,
        html: html,
        text: this.generateAvailableShiftsText(shifts)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email turni disponibili inviata a ${recipients.length} destinatari: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        message: `Email inviata a ${recipients.length} destinatari`
      };
    } catch (error) {
      console.error('❌ Errore nell\'invio email turni disponibili:', error);
      throw error;
    }
  }

  /**
   * Genera HTML per email di conferma prenotazione
   */
  generateBookingConfirmationHTML(shift, userInfo) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Conferma Prenotazione Turno</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .shift-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Turno Prenotato con Successo!</h1>
            </div>
            <div class="content">
                <p>Ciao <strong>${userInfo.name}</strong>,</p>
                <p>La tua prenotazione è stata confermata. Ecco i dettagli del tuo turno:</p>
                
                <div class="shift-details">
                    <h3>${shift.title}</h3>
                    <p><strong>📅 Data:</strong> ${this.formatDate(shift.date)}</p>
                    <p><strong>⏰ Orario:</strong> ${shift.startTime} - ${shift.endTime}</p>
                    <p><strong>📍 Luogo:</strong> ${shift.location || 'Associazione Culturale'}</p>
                    ${shift.description ? `<p><strong>📝 Descrizione:</strong> ${shift.description}</p>` : ''}
                    ${userInfo.notes ? `<p><strong>📝 Tue note:</strong> ${userInfo.notes}</p>` : ''}
                </div>
                
                <p>Ti ricordiamo di arrivare in orario e di contattarci in caso di imprevisti.</p>
                <p>Buon lavoro!</p>
            </div>
            <div class="footer">
                <p>Gestionale Turni Bar - Associazione Culturale</p>
                <p>Questa email è stata generata automaticamente.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Genera testo per email di conferma prenotazione
   */
  generateBookingConfirmationText(shift, userInfo) {
    return `
CONFERMA PRENOTAZIONE TURNO

Ciao ${userInfo.name},

La tua prenotazione è stata confermata. Ecco i dettagli del tuo turno:

${shift.title}
📅 Data: ${this.formatDate(shift.date)}
⏰ Orario: ${shift.startTime} - ${shift.endTime}
📍 Luogo: ${shift.location || 'Associazione Culturale'}
${shift.description ? `📝 Descrizione: ${shift.description}` : ''}
${userInfo.notes ? `📝 Tue note: ${userInfo.notes}` : ''}

Ti ricordiamo di arrivare in orario e di contattarci in caso di imprevisti.

Buon lavoro!

---
Gestionale Turni Bar - Associazione Culturale
Questa email è stata generata automaticamente.
    `;
  }

  /**
   * Genera HTML per email promemoria
   */
  generateReminderHTML(shift, userInfo, reminderType) {
    const timeText = reminderType === '1h' ? '1 ora' : '1 giorno';
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Promemoria Turno</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .shift-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Promemoria Turno</h1>
                <p>Il tuo turno inizia tra ${timeText}!</p>
            </div>
            <div class="content">
                <p>Ciao <strong>${userInfo.name}</strong>,</p>
                <p>Questo è un promemoria per il tuo turno imminente:</p>
                
                <div class="shift-details">
                    <h3>${shift.title}</h3>
                    <p><strong>📅 Data:</strong> ${this.formatDate(shift.date)}</p>
                    <p><strong>⏰ Orario:</strong> ${shift.startTime} - ${shift.endTime}</p>
                    <p><strong>📍 Luogo:</strong> ${shift.location || 'Associazione Culturale'}</p>
                </div>
                
                <p>Ricorda di arrivare in orario!</p>
            </div>
            <div class="footer">
                <p>Gestionale Turni Bar - Associazione Culturale</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Genera testo per email promemoria
   */
  generateReminderText(shift, userInfo, reminderType) {
    const timeText = reminderType === '1h' ? '1 ora' : '1 giorno';
    return `
PROMEMORIA TURNO

Ciao ${userInfo.name},

Il tuo turno inizia tra ${timeText}!

${shift.title}
📅 Data: ${this.formatDate(shift.date)}
⏰ Orario: ${shift.startTime} - ${shift.endTime}
📍 Luogo: ${shift.location || 'Associazione Culturale'}

Ricorda di arrivare in orario!

---
Gestionale Turni Bar - Associazione Culturale
    `;
  }

  /**
   * Genera HTML per email cancellazione
   */
  generateCancellationHTML(shift, userInfo) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Cancellazione Turno</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .shift-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❌ Turno Cancellato</h1>
            </div>
            <div class="content">
                <p>Ciao <strong>${userInfo.name}</strong>,</p>
                <p>Il tuo turno è stato cancellato:</p>
                
                <div class="shift-details">
                    <h3>${shift.title}</h3>
                    <p><strong>📅 Data:</strong> ${this.formatDate(shift.date)}</p>
                    <p><strong>⏰ Orario:</strong> ${shift.startTime} - ${shift.endTime}</p>
                    <p><strong>📍 Luogo:</strong> ${shift.location || 'Associazione Culturale'}</p>
                </div>
                
                <p>Grazie per averci informato.</p>
            </div>
            <div class="footer">
                <p>Gestionale Turni Bar - Associazione Culturale</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Genera testo per email cancellazione
   */
  generateCancellationText(shift, userInfo) {
    return `
CANCELLAZIONE TURNO

Ciao ${userInfo.name},

Il tuo turno è stato cancellato:

${shift.title}
📅 Data: ${this.formatDate(shift.date)}
⏰ Orario: ${shift.startTime} - ${shift.endTime}
📍 Luogo: ${shift.location || 'Associazione Culturale'}

Grazie per averci informato.

---
Gestionale Turni Bar - Associazione Culturale
    `;
  }

  /**
   * Genera HTML per email turni disponibili
   */
  generateAvailableShiftsHTML(shifts) {
    const shiftsList = shifts.slice(0, 10).map(shift => `
      <div style="background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2196F3;">
        <h3>${shift.title}</h3>
        <p><strong>📅 Data:</strong> ${this.formatDate(shift.date)}</p>
        <p><strong>⏰ Orario:</strong> ${shift.startTime} - ${shift.endTime}</p>
        <p><strong>📍 Luogo:</strong> ${shift.location || 'Associazione Culturale'}</p>
        ${shift.description ? `<p><strong>📝 Descrizione:</strong> ${shift.description}</p>` : ''}
      </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Turni Disponibili</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Turni Disponibili</h1>
                <p>Ci sono ${shifts.length} turni disponibili!</p>
            </div>
            <div class="content">
                <p>Ecco i turni attualmente disponibili:</p>
                ${shiftsList}
                ${shifts.length > 10 ? `<p><em>E altri ${shifts.length - 10} turni disponibili. Vedi il gestionale per tutti i dettagli.</em></p>` : ''}
                <p>Accedi al gestionale per prenotare un turno!</p>
            </div>
            <div class="footer">
                <p>Gestionale Turni Bar - Associazione Culturale</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Genera testo per email turni disponibili
   */
  generateAvailableShiftsText(shifts) {
    const shiftsList = shifts.slice(0, 10).map(shift => `
${shift.title}
📅 Data: ${this.formatDate(shift.date)}
⏰ Orario: ${shift.startTime} - ${shift.endTime}
📍 Luogo: ${shift.location || 'Associazione Culturale'}
${shift.description ? `📝 Descrizione: ${shift.description}` : ''}
---
    `).join('');

    return `
TURNI DISPONIBILI

Ci sono ${shifts.length} turni disponibili!

${shiftsList}
${shifts.length > 10 ? `E altri ${shifts.length - 10} turni disponibili. Vedi il gestionale per tutti i dettagli.` : ''}

Accedi al gestionale per prenotare un turno!

---
Gestionale Turni Bar - Associazione Culturale
    `;
  }

  /**
   * Formatta una data per la visualizzazione
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Verifica se il servizio è inizializzato
   */
  isReady() {
    return this.initialized;
  }
}

module.exports = new EmailService();
