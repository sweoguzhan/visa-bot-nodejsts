import { Telegraf } from 'telegraf';
import { VisaAppointment } from '../types';
import { config } from '../config/environment';
import logger from '../utils/logger';

export class NotificationManager {
  private bot: Telegraf;
  private messageCount: number;
  private lastReset: number;
  private resetInterval: NodeJS.Timeout;

  constructor() {
    this.bot = new Telegraf(config.telegram.botToken);
    this.messageCount = 0;
    this.lastReset = Date.now();
    this.resetInterval = setInterval(() => this.resetRateLimit(), 60000);
    this.setupErrorHandler();
  }

  private setupErrorHandler(): void {
    this.bot.catch((err, ctx) => {
      logger.error('Telegram bot error:', {
        error: err,
        updateType: ctx.updateType,
        chatId: ctx.chat?.id,
      });
    });
  }

  private resetRateLimit(): void {
    if (this.messageCount > 0) {
      logger.debug(`Rate limit counter reset. Previous count: ${this.messageCount}`);
    }
    this.messageCount = 0;
    this.lastReset = Date.now();
  }

  private async handleRateLimit(): Promise<void> {
    if (this.messageCount >= config.telegram.rateLimit) {
      const timeToWait = 60000 - (Date.now() - this.lastReset);
      if (timeToWait > 0) {
        logger.debug(`Rate limit exceeded. Waiting ${Math.ceil(timeToWait / 1000)} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, timeToWait));
        this.resetRateLimit();
      }
    }
  }

  private formatMessage(appointment: VisaAppointment): string {
    const appointmentDate = appointment.appointment_date
      ? new Date(appointment.appointment_date)
      : null;
    const lastChecked = new Date(appointment.last_checked);

    const formatDate = (date: Date) => {
      return date.toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    };

    const escapeMarkdown = (text: string): string => {
      return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
    };

    const getAppointmentStatus = () => {
      if (!appointment.appointment_date) {
        return [
          '❌ Randevu tarihi müsait değil',
          `👥 Bekleyen kişi sayısı: ${appointment.people_looking}`,
          '🔄 Sistem yeni tarihleri açtığında bildirim alacaksınız'
        ].join('\n');
      }
      
      return escapeMarkdown(new Date(appointment.appointment_date).toLocaleDateString('tr-TR'));
    };

    return [
      '*🎯 NEW VISA APPOINTMENT FOUND\\!*\n',
      `🏛️ *Consulate:* ${escapeMarkdown(appointment.center_name)}`,
      `📆 *Appointment Date:* ${getAppointmentStatus()}`,
      `🛂 *Visa Category:* ${escapeMarkdown(appointment.visa_category)}${appointment.visa_subcategory ? `\n└ 📋 *Subcategory:* ${escapeMarkdown(appointment.visa_subcategory)}` : ''}`,
      `👥 *People Waiting:* ${appointment.people_looking}`,
      `\n🔗 *Book Appointment:*\n[Go to Appointment System](${escapeMarkdown(appointment.book_now_link)})\n`,
      `⏰ *Last Updated:* ${escapeMarkdown(formatDate(lastChecked))}`,
    ].join('\n');
  }

  async sendNotification(appointment: VisaAppointment): Promise<boolean> {
    try {
      await this.handleRateLimit();

      if (config.app.debug) {
        logger.debug('Sending notification with config:', {
          botToken: config.telegram.botToken.slice(0, 5) + '...',
          channelId: config.telegram.channelId,
          message: this.formatMessage(appointment).slice(0, 50) + '...'
        });
      }

      await this.bot.telegram.sendMessage(
        config.telegram.channelId,
        this.formatMessage(appointment),
        {
          parse_mode: 'MarkdownV2',
          link_preview_options: {
            is_disabled: true,
          },
        }
      );

      this.messageCount++;
      return true;
    } catch (error) {
      logger.error('Failed to send Telegram message:', {
        error,
        config: {
          channelId: config.telegram.channelId,
          botTokenLength: config.telegram.botToken.length,
        }
      });
      return false;
    }
  }

  destroy(): void {
    clearInterval(this.resetInterval);
    this.bot.stop();
  }
}
