import { VisaAppointment } from '../../types';
import { config } from '../../config/environment';
import logger from '../../utils/logger';

export class CacheService {
  private cache: Map<string, boolean>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), config.cache.cleanupInterval);
  }

  createKey(appointment: VisaAppointment): string {
    return `${appointment.source_country}-${appointment.mission_country}-${appointment.center_name}-${appointment.appointment_date}`;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string): void {
    this.cache.set(key, true);
    if (this.cache.size > config.cache.maxSize) {
      this.cleanup();
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  private cleanup(): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let deletedCount = 0;
    for (const [key] of this.cache) {
      const appointmentDate = new Date(key.split('-')[3]);
      if (appointmentDate < yesterday) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug(`Cleaned up ${deletedCount} expired cache entries`);
    }

    // If still over max size, remove oldest entries
    if (this.cache.size > config.cache.maxSize) {
      const entriesToDelete = this.cache.size - config.cache.maxSize;
      const entries = Array.from(this.cache.keys());
      entries
        .sort((a, b) => new Date(a.split('-')[3]).getTime() - new Date(b.split('-')[3]).getTime())
        .slice(0, entriesToDelete)
        .forEach((key) => this.cache.delete(key));
      ``;
      logger.debug(`Removed ${entriesToDelete} oldest cache entries due to size limit`);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}
