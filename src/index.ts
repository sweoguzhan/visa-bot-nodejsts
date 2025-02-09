import cron from 'node-cron';
import { config } from './config/environment';
import { ApiService } from './services/api/ApiService';
import { CacheService } from './services/cache/CacheService';
import { NotificationManager } from './core/NotificationManager';
import { AppointmentManager } from './core/AppointmentManager';
import logger from './utils/logger';

function setupGracefulShutdown(
  cacheService: CacheService,
  notificationManager: NotificationManager,
  cronJob: cron.ScheduledTask
): void {
  const shutdown = () => {
    logger.info('Application shutting down...');
    
    // Cron job'ı durdur
    cronJob.stop();
    
    // Servisleri temizle
    cacheService.destroy();
    notificationManager.destroy();
    
    logger.info('Cleanup completed, exiting...');
    process.exit(0);
  };

  // Kapatma sinyallerini yakala
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // Beklenmeyen hataları yakala
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    shutdown();
  });
  
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
    shutdown();
  });
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

    // Cron job'ı oluştur
    const cronJob = cron.schedule(config.app.checkInterval, () => {
      void appointmentManager.checkAppointments();
    });

    // Graceful shutdown'a cron job'ı da ekle
    setupGracefulShutdown(cacheService, notificationManager, cronJob);

    logger.info('Visa appointment checker started', {
      checkInterval: config.app.checkInterval,
      targetCountry: config.app.targetCountry,
      missionCountries: config.app.missionCountries,
      targetCities: config.app.targetCities,
    });

    // İlk kontrolü yap
    void appointmentManager.checkAppointments();
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

void main();