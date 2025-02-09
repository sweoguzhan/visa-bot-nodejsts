export const AVAILABLE_CITIES = ['Ankara', 'Istanbul', 'Izmir', 'Gaziantep', 'Antalya', 'Bursa'] as const;

export const AVAILABLE_COUNTRIES = [
  'Netherlands',
  'France',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Czechia',
  'Estonia',
  'Finland',
  'Ireland',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Norway',
  'Slovenia',
  'Sweden',
  'Ukraine'
] as const;

export const VISA_CATEGORIES = ['Tourism', 'Business', 'Student', 'Work', 'Family'] as const;

export const DEFAULT_CONFIG = {
  telegram: {
    rateLimit: 15,
    retryAfter: 5000,
  },
  app: {
    checkInterval: '*/5 * * * *',
    targetCountry: 'Turkiye',
  },
  api: {
    baseUrl: 'https://api.schengenvisaappointments.com/api/visa-list',
    maxRetries: 3,
    retryDelayBase: 1000,
  },
  cache: {
    maxSize: 1000,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const; 