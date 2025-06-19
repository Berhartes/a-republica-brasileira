/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;

  // Upstash Redis
  readonly VITE_UPSTASH_REDIS_URL: string;
  readonly VITE_UPSTASH_REDIS_TOKEN: string;

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

  // API
  readonly VITE_API_BASE_URL: string;

  // App
  readonly VITE_APP_VERSION: string;

  // Vite env vars
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;

  // Catch-all for any other env vars
  readonly [key: string]: string | boolean | undefined;
}

// Explicitly declare ImportMeta interface to fix TypeScript errors
interface ImportMeta {
  readonly env: ImportMetaEnv;
}