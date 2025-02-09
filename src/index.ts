import cron from 'node-cron';
import { config } from './config/environment';
import { ApiService } from './services/api/ApiService';
import { CacheService } from './services/cache/CacheService';
import { NotificationManager } from './core/NotificationManager';
import { AppointmentManager } from './core/AppointmentManager';
import logger from './utils/logger';

function setupGracefulShutdown(
  cacheService: CacheService,
  notificationManager: NotificationManager
): void {
  const shutdown = () => {
    logger.info('Application shutting down...');
    cacheService.destroy();
    notificationManager.destroy();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

async function main() {
  try {
    const apiService = new ApiService();
    const cacheService = new CacheService();
    const notificationManager = new NotificationManager();
    const appointmentManager = new AppointmentManager(
      apiService,
      cacheService,
      notificationManager
    );

    setupGracefulShutdown(cacheService, notificationManager);

    logger.info('Visa appointment checker started', {
      checkInterval: config.app.checkInterval,
      targetCountry: config.app.targetCountry,
      missionCountries: config.app.missionCountries,
      targetCities: config.app.targetCities,
    });

    // Schedule appointment checks
    cron.schedule(config.app.checkInterval, () => {
      void appointmentManager.checkAppointments();
    });

    // Initial check
    void appointmentManager.checkAppointments();
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

void main();