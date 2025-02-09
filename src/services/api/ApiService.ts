import axios, { AxiosError, AxiosInstance } from 'axios';
import { config } from '../../config/environment';
import { VisaAppointment } from '../../types';
import logger from '../../utils/logger';

export class ApiService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: 10000,
    });
  }

  private async fetchWithRetry<T>(
    fn: () => Promise<T>,
    retries = config.api.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (
        retries > 0 &&
        error instanceof AxiosError &&
        error.response &&
        typeof error.response.status === 'number' &&
        error.response.status >= 500
      ) {
        logger.warn(
          `Retrying API call... ${config.api.maxRetries - retries + 1}/${config.api.maxRetries}`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, config.api.retryDelayBase * (config.api.maxRetries - retries + 1))
        );
        return this.fetchWithRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  async fetchAppointments(): Promise<VisaAppointment[]> {
    try {
      const response = await this.fetchWithRetry(() =>
        this.client.get<VisaAppointment[]>('/?format=json')
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        logger.error('API Error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
      } else {
        logger.error('Unknown error:', error);
      }
      return [];
    }
  }
}
