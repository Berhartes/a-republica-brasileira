export * from './api';
export * from './events';
export * from './firebase';

// Reexportações específicas ao invés de export * para evitar conflitos
import * as senadoTypes from './senado';
export { senadoTypes };

export * from './testing';

/**
 * Tipos para variáveis de ambiente
 */
interface ImportMetaEnv {
  // Firebase
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_SERVICE_ACCOUNT_PATH: string;

  // Upstash Redis
  readonly VITE_UPSTASH_REDIS_REST_URL: string;
  readonly VITE_UPSTASH_REDIS_REST_TOKEN: string;

  // Sentry
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE: string;
  readonly VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE: string;
  readonly VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: string;

  // DataDog
  readonly VITE_DATADOG_APPLICATION_ID: string;
  readonly VITE_DATADOG_CLIENT_TOKEN: string;
  readonly VITE_DATADOG_SITE: string;
  readonly VITE_DATADOG_SERVICE: string;
  readonly VITE_DATADOG_ENV: string;

  // Analytics
  readonly VITE_AMPLITUDE_API_KEY: string;
  readonly VITE_POSTHOG_API_KEY: string;
  readonly VITE_POSTHOG_API_HOST: string;

  // Logger
  readonly VITE_LOGGER_LEVEL: string;
  readonly VITE_LOGGER_ENABLED: string;
  readonly VITE_LOGGER_TRANSMIT_LEVEL: string;
  readonly VITE_LOGGER_TRANSMIT_URL: string;

  // App
  readonly VITE_APP_VERSION: string;
}

/**
 * Estende o tipo ImportMeta para incluir variáveis de ambiente
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}