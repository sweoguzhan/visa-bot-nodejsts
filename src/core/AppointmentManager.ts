import { VisaAppointment } from '../types';
import { ApiService } from '../services/api/ApiService';
import { CacheService } from '../services/cache/CacheService';
import { NotificationManager } from './NotificationManager';
import logger from '../utils/logger';
import { config } from '../config/environment';

export class AppointmentManager {
  constructor(
    private readonly apiService: ApiService,
    private readonly cacheService: CacheService,
    private readonly notificationManager: NotificationManager
  ) {}

  private extractCity(centerName: string): string {
    const match = centerName.match(/(?:^|\s)-\s*([^-]+)$/);
    return match ? match[1].trim() : centerName;
  }

  private isValidAppointment(appointment: VisaAppointment): boolean {
    if (!appointment.appointment_date) {
      if (config.app.debug) {
        logger.debug('Appointment rejected: No date available', {
          center: appointment.center_name
        });
      }
      return false;
    }

    if (appointment.source_country !== config.app.targetCountry) {
      if (config.app.debug) {
        logger.debug('Appointment rejected: Wrong source country', {
          expected: config.app.targetCountry,
          got: appointment.source_country
        });
      }
      return false;
    }

    const isMissionCountryValid = config.app.missionCountries.some(
      (country) => country.toLowerCase() === appointment.mission_country.toLowerCase()
    );
    if (!isMissionCountryValid) {
      if (config.app.debug) {
        logger.debug('Appointment rejected: Invalid mission country', {
          country: appointment.mission_country
        });
      }
      return false;
    }

    if (config.app.targetCities.length > 0) {
      const appointmentCity = this.extractCity(appointment.center_name);
      const cityMatch = config.app.targetCities.some((city) =>
        appointmentCity.toLowerCase().includes(city.toLowerCase())
      );
      if (!cityMatch) {
        if (config.app.debug) {
          logger.debug('Appointment rejected: City not in target list', {
            city: appointmentCity
          });
        }
        return false;
      }
    }

    if (config.app.targetSubCategories.length > 0) {
      const subCategoryMatch = config.app.targetSubCategories.some((subCategory) =>
        appointment.visa_subcategory.toLowerCase().includes(subCategory.toLowerCase())
      );
      if (!subCategoryMatch) {
        if (config.app.debug) {
          logger.debug('Appointment rejected: Subcategory not in target list', {
            subcategory: appointment.visa_subcategory
          });
        }
        return false;
      }
    }

    return true;
  }

  async checkAppointments(): Promise<void> {
    try {
      const appointments = await this.apiService.fetchAppointments();
      
      if (appointments.length === 0) {
        logger.info('No appointments found or API error occurred');
        return;
      }

      if (config.app.debug) {
        logger.debug('All appointments:', appointments);
      }

      const validAppointments = appointments.filter(appointment => {
        const isValid = this.isValidAppointment(appointment);
        
        if (config.app.debug) {
          logger.debug('Appointment validation:', {
            appointment: {
              center: appointment.center_name,
              date: appointment.appointment_date,
              category: appointment.visa_subcategory
            },
            isValid
          });
        }
        
        return isValid;
      });

      logger.info(`Found ${validAppointments.length} valid appointments out of ${appointments.length} total`);

      for (const appointment of validAppointments) {
        const cacheKey = this.cacheService.createKey(appointment);
        
        if (!this.cacheService.has(cacheKey)) {
          await this.processNewAppointment(appointment, cacheKey);
        }
      }
    } catch (error) {
      logger.error('Error checking appointments:', error);
    }
  }

  private async processNewAppointment(
    appointment: VisaAppointment,
    cacheKey: string
  ): Promise<void> {
    this.cacheService.set(cacheKey);

    const success = await this.notificationManager.sendNotification(appointment);
    if (success) {
      logger.info(`Notification sent successfully: ${cacheKey}`);
    } else {
      this.cacheService.delete(cacheKey);
      logger.error(`Failed to send notification: ${cacheKey}`);
    }
  }
}
