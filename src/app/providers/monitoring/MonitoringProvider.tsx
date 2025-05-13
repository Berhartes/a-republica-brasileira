import { MonitoringProvider as CoreMonitoringProvider } from '@/app/monitoring';
import type { MonitoringConfig } from '@/app/monitoring';
import { PropsWithChildren } from 'react';

// Re-export for simplicity
export { MonitoringProvider } from '@/app/monitoring';

// Default config for the application
export const defaultMonitoringConfig: MonitoringConfig = {
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE),
    replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE),
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE),
  },
  datadog: {
    applicationId: import.meta.env.VITE_DATADOG_APPLICATION_ID,
    clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
    options: {
      site: import.meta.env.VITE_DATADOG_SITE,
      service: import.meta.env.VITE_DATADOG_SERVICE,
      env: import.meta.env.VITE_DATADOG_ENV,
      sessionSampleRate: 100,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input' as const,
    },
  },
  analytics: {
    amplitude: {
      apiKey: import.meta.env.VITE_AMPLITUDE_API_KEY,
    },
    posthog: {
      apiKey: import.meta.env.VITE_POSTHOG_API_KEY,
      apiHost: import.meta.env.VITE_POSTHOG_API_HOST,
    },
  },
  logger: {
    level: import.meta.env.VITE_LOGGER_LEVEL as any,
    enabled: import.meta.env.VITE_LOGGER_ENABLED === 'true',
    transport: {
      level: import.meta.env.VITE_LOGGER_TRANSMIT_LEVEL as any,
      url: import.meta.env.VITE_LOGGER_TRANSMIT_URL,
    },
  },
};

// Simple provider with default config
export const AppMonitoringProvider: React.FC<PropsWithChildren<{
  config?: Partial<MonitoringConfig>;
}>> = ({ children, config }) => {
  const mergedConfig = {
    ...defaultMonitoringConfig,
    ...config,
  };

  return (
    <CoreMonitoringProvider config={mergedConfig}>
      {children}
    </CoreMonitoringProvider>
  );
};