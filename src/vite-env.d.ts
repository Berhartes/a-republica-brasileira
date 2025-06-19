/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly SSR: boolean;
    readonly [key: string]: string | boolean | undefined;
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
    readonly VITE_USE_FIREBASE_EMULATOR?: string;
    readonly VITE_SENTRY_DSN?: string;
    readonly VITE_SENTRY_ENVIRONMENT?: string;
    readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
    readonly VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE?: string;
    readonly VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE?: string;
    readonly VITE_DATADOG_APPLICATION_ID?: string;
    readonly VITE_DATADOG_CLIENT_TOKEN?: string;
    readonly VITE_DATADOG_SITE?: string;
    readonly VITE_DATADOG_SERVICE?: string;
    readonly VITE_DATADOG_ENV?: string;
    readonly VITE_AMPLITUDE_API_KEY?: string;
    readonly VITE_POSTHOG_API_KEY?: string;
    readonly VITE_POSTHOG_API_HOST?: string;
    readonly VITE_LOGGER_LEVEL?: string;
    readonly VITE_LOGGER_ENABLED?: string;
    readonly VITE_LOGGER_TRANSMIT_LEVEL?: string;
    readonly VITE_LOGGER_TRANSMIT_URL?: string;
    readonly VITE_APP_VERSION?: string;
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_UPSTASH_REDIS_URL?: string;
    readonly VITE_UPSTASH_REDIS_TOKEN?: string;
  };
}
