/**
 * Servizio per l'integrazione con Discord API
 * Gestisce l'invio di notifiche automatiche sui turni
 */

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

class DiscordService {
  constructor() {
    this.client = null;
    this.channelId = null;
    this.initialized = false;
    this.ready = false;
  }

  /**
   * Inizializza il bot Discord
   */
  async initialize() {
    try {
      if (!process.env.DISCORD_BOT_TOKEN) {
        console.warn('⚠️  Discord Bot Token non configurato - salta inizializzazione');
        return;
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers
        ]
      });

      this.channelId = process.env.DISCORD_CHANNEL_ID;

      // Eventi del bot
      this.client.once('ready', () => {
        console.log(`🤖 Bot Discord connesso come ${this.client.user.tag}`);
        this.ready = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Errore Discord Bot:', error);
      });

      // Connessione al bot
      await this.client.login(process.env.DISCORD_BOT_TOKEN);
      
      // Attendi che il bot sia pronto
      await this.waitForReady();
      
      this.initialized = true;
      console.log('✅ Discord Service inizializzato');
    } catch (error) {
      console.error('❌ Errore inizializzazione Discord Service:', error);
      throw error;
    }
  }

  /**
   * Attende che il bot Discord sia pronto
   */
  waitForReady() {
    return new Promise((resolve) => {
      if (this.ready) {
        resolve();
      } else {
        this.client.once('ready', resolve);
      }
    });
  }

  /**
   * Invia notifica di prenotazione turno
   * @param {Object} shift - Dettagli del turno
   * @param {Object} userInfo - Informazioni utente
   * @returns {Object} Risultato dell'invio
   */
  async sendBookingNotification(shift, userInfo) {
    try {
      if (!this.initialized || !this.ready) {
        throw new Error('Discord Service non inizializzato o non pronto');
      }

      const embed = new EmbedBuilder()
        .setTitle('🎯 Nuovo Turno Prenotato!')
        .setDescription(`**${userInfo.name}** ha prenotato un turno`)
        .setColor('#00ff00')
        .addFields(
          {
            name: '📅 Data',
            value: this.formatDate(shift.date),
            inline: true
          },
          {
            name: '⏰ Orario',
            value: `${shift.startTime} - ${shift.endTime}`,
            inline: true
          },
          {
            name: '📍 Luogo',
            value: shift.location || 'Associazione Culturale',
            inline: true
          },
          {
            name: '👤 Utente',
            value: userInfo.name,
            inline: true
          },
          {
            name: '📧 Email',
            value: userInfo.email || 'Non fornita',
            inline: true
          },
          {
            name: '🆔 Discord',
            value: userInfo.discordId || 'Non fornito',
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: 'Gestionale Turni Bar',
          iconURL: 'https://cdn.discordapp.com/emojis/1234567890123456789.png'
        });

      if (userInfo.notes) {
        embed.addFields({
          name: '📝 Note',
          value: userInfo.notes,
          inline: false
        });
      }

      const message = await this.sendMessage('', { embeds: [embed] });
      
      console.log(`✅ Notifica prenotazione inviata: ${message.id}`);
      
      return {
        success: true,
        messageId: message.id,
        message: 'Notifica inviata su Discord'
      };
    } catch (error) {
      console.error('❌ Errore nell\'invio notifica prenotazione:', error);
      throw error;
    }
  }

  /**
   * Invia notifica di cancellazione turno
   * @param {Object} shift - Dettagli del turno
   * @param {Object} userInfo - Informazioni utente
   * @returns {Object} Risultato dell'invio
   */
  async sendCancellationNotification(shift, userInfo) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('❌ Turno Cancellato')
        .setDescription(`**${userInfo.name}** ha cancellato un turno`)
        .setColor('#ff0000')
        .addFields(
          {
            name: '📅 Data',
            value: this.formatDate(shift.date),
            inline: true
          },
          {
            name: '⏰ Orario',
            value: `${shift.startTime} - ${shift.endTime}`,
            inline: true
          },
          {
            name: '👤 Utente',
            value: userInfo.name,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: 'Gestionale Turni Bar'
        });

      const message = await this.sendMessage('', { embeds: [embed] });
      
      console.log(`✅ Notifica cancellazione inviata: ${message.id}`);
      
      return {
        success: true,
        messageId: message.id,
        message: 'Notifica cancellazione inviata su Discord'
      };
    } catch (error) {
      console.error('❌ Errore nell\'invio notifica cancellazione:', error);
      throw error;
    }
  }

  /**
   * Invia notifica di promemoria turno
   * @param {Object} shift - Dettagli del turno
   * @param {Object} userInfo - Informazioni utente
   * @param {string} reminderType - Tipo di promemoria (1h, 1d, etc.)
   * @returns {Object} Risultato dell'invio
   */
  async sendReminderNotification(shift, userInfo, reminderType = '1h') {
    try {
      const timeEmoji = reminderType === '1h' ? '⏰' : '📅';
      const timeText = reminderType === '1h' ? '1 ora' : '1 giorno';
      
      const embed = new EmbedBuilder()
        .setTitle(`${timeEmoji} Promemoria Turno`)
        .setDescription(`Il tuo turno inizia tra ${timeText}!`)
        .setColor('#ffaa00')
        .addFields(
          {
            name: '📅 Data',
            value: this.formatDate(shift.date),
            inline: true
          },
          {
            name: '⏰ Orario',
            value: `${shift.startTime} - ${shift.endTime}`,
            inline: true
          },
          {
            name: '📍 Luogo',
            value: shift.location || 'Associazione Culturale',
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: 'Gestionale Turni Bar'
        });

      // Prova a inviare messaggio privato all'utente se ha Discord ID
      if (userInfo.discordId) {
        try {
          const user = await this.client.users.fetch(userInfo.discordId);
          await user.send({ embeds: [embed] });
          
          console.log(`✅ Promemoria inviato in privato a ${user.username}`);
          
          return {
            success: true,
            message: `Promemoria inviato in privato a ${user.username}`
          };
        } catch (dmError) {
          console.warn('⚠️  Impossibile inviare DM, invio nel canale pubblico');
        }
      }

      // Fallback: invio nel canale pubblico
      embed.setDescription(`@${userInfo.name} - Il tuo turno inizia tra ${timeText}!`);
      const message = await this.sendMessage('', { embeds: [embed] });
      
      console.log(`✅ Promemoria inviato nel canale: ${message.id}`);
      
      return {
        success: true,
        messageId: message.id,
        message: 'Promemoria inviato su Discord'
      };
    } catch (error) {
      console.error('❌ Errore nell\'invio promemoria:', error);
      throw error;
    }
  }

  /**
   * Invia notifica di turni disponibili
   * @param {Array} shifts - Lista dei turni disponibili
   * @returns {Object} Risultato dell'invio
   */
  async sendAvailableShiftsNotification(shifts) {
    try {
      if (shifts.length === 0) {
        return {
          success: true,
          message: 'Nessun turno disponibile da notificare'
        };
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Turni Disponibili')
        .setDescription(`Ci sono ${shifts.length} turni disponibili!`)
        .setColor('#0099ff')
        .setTimestamp()
        .setFooter({
          text: 'Gestionale Turni Bar'
        });

      // Aggiungi i primi 10 turni (limite Discord)
      shifts.slice(0, 10).forEach((shift, index) => {
        embed.addFields({
          name: `${index + 1}. ${shift.title}`,
          value: `${this.formatDate(shift.date)} - ${shift.startTime}/${shift.endTime}\n📍 ${shift.location || 'Associazione'}`,
          inline: false
        });
      });

      if (shifts.length > 10) {
        embed.addFields({
          name: 'ℹ️ Info',
          value: `E altri ${shifts.length - 10} turni disponibili. Vedi il gestionale per tutti i dettagli.`,
          inline: false
        });
      }

      const message = await this.sendMessage('', { embeds: [embed] });
      
      console.log(`✅ Notifica turni disponibili inviata: ${message.id}`);
      
      return {
        success: true,
        messageId: message.id,
        message: 'Notifica turni disponibili inviata'
      };
    } catch (error) {
      console.error('❌ Errore nell\'invio notifica turni disponibili:', error);
      throw error;
    }
  }

  /**
   * Invia messaggio nel canale configurato
   * @param {string} content - Contenuto del messaggio
   * @param {Object} options - Opzioni del messaggio
   * @returns {Object} Messaggio inviato
   */
  async sendMessage(content, options = {}) {
    try {
      if (!this.channelId) {
        throw new Error('ID canale Discord non configurato');
      }

      const channel = await this.client.channels.fetch(this.channelId);
      
      if (!channel) {
        throw new Error('Canale Discord non trovato');
      }

      return await channel.send({
        content: content,
        ...options
      });
    } catch (error) {
      console.error('❌ Errore nell\'invio messaggio Discord:', error);
      throw error;
    }
  }

  /**
   * Formatta una data per la visualizzazione
   * @param {string} dateString - Data in formato YYYY-MM-DD
   * @returns {string} Data formattata
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
   * Ottiene informazioni su un utente Discord
   * @param {string} userId - ID utente Discord
   * @returns {Object} Informazioni utente
   */
  async getUserInfo(userId) {
    try {
      const user = await this.client.users.fetch(userId);
      return {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatarURL(),
        bot: user.bot
      };
    } catch (error) {
      console.error('❌ Errore nel recupero informazioni utente Discord:', error);
      throw error;
    }
  }

  /**
   * Verifica se il bot è connesso e pronto
   * @returns {boolean} True se il bot è pronto
   */
  isReady() {
    return this.initialized && this.ready;
  }

  /**
   * Disconnette il bot Discord
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
        console.log('🔌 Bot Discord disconnesso');
      }
    } catch (error) {
      console.error('❌ Errore nella disconnessione Discord:', error);
    }
  }
}

module.exports = new DiscordService();
