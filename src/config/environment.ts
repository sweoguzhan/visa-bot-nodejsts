import { z } from 'zod';
import dotenv from 'dotenv';
import {
  AVAILABLE_CITIES,
  AVAILABLE_COUNTRIES,
  DEFAULT_CONFIG,
  VISA_CATEGORIES,
} from './constants';

dotenv.config();

const envSchema = z.object({
  telegram: z.object({
    botToken: z.string().min(1),
    channelId: z.string().regex(/^-?\d+$/),
    rateLimit: z.number().int().positive(),
    retryAfter: z.number().int().positive(),
  }),
  app: z.object({
    checkInterval: z.string().regex(/^[\d*/\s-]+$/),
    targetCountry: z.string(),
    targetCities: z.array(z.enum(AVAILABLE_CITIES)),
    missionCountries: z.array(z.enum(AVAILABLE_COUNTRIES)),
    targetSubCategories: z.array(z.enum(VISA_CATEGORIES)),
    debug: z.boolean(),
  }),
  api: z.object({
    baseUrl: z.string().url(),
    maxRetries: z.number().int().positive(),
    retryDelayBase: z.number().int().positive(),
  }),
  cache: z.object({
    maxSize: z.number().int().positive(),
    cleanupInterval: z.number().int().positive(),
  }),
});

export type EnvironmentConfig = z.infer<typeof envSchema>;

function validateEnvironment(): EnvironmentConfig {
  try {
    const parsedConfig = {
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        channelId: process.env.TELEGRAM_CHAT_ID,
        rateLimit: Number(process.env.TELEGRAM_RATE_LIMIT) || DEFAULT_CONFIG.telegram.rateLimit,
        retryAfter: Number(process.env.TELEGRAM_RETRY_AFTER) || DEFAULT_CONFIG.telegram.retryAfter,
      },
      app: {
        checkInterval: process.env.CHECK_INTERVAL || DEFAULT_CONFIG.app.checkInterval,
        targetCountry: process.env.TARGET_COUNTRY || DEFAULT_CONFIG.app.targetCountry,
        targetCities: process.env.CITIES?.split(',').map((city) => city.trim()) || [],
        missionCountries:
          process.env.MISSION_COUNTRY?.split(',').map((country) => country.trim()) || [],
        targetSubCategories:
          process.env.VISA_SUBCATEGORIES?.split(',').map((cat) => cat.trim()) || [],
        debug: process.env.DEBUG === 'true',
      },
      api: {
        baseUrl: process.env.VISA_API_URL || DEFAULT_CONFIG.api.baseUrl,
        maxRetries: Number(process.env.MAX_RETRIES) || DEFAULT_CONFIG.api.maxRetries,
        retryDelayBase: Number(process.env.RETRY_DELAY_BASE) || DEFAULT_CONFIG.api.retryDelayBase,
      },
      cache: {
        maxSize: Number(process.env.MAX_CACHE_SIZE) || DEFAULT_CONFIG.cache.maxSize,
        cleanupInterval:
          Number(process.env.CACHE_CLEANUP_INTERVAL) || DEFAULT_CONFIG.cache.cleanupInterval,
      },
    };

    return envSchema.parse(parsedConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:', error.errors);
    }
    process.exit(1);
  }
}

export const config = validateEnvironment();
