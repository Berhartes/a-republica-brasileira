// Tipos para configuração de monitoramento

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  transmit?: {
    level: LogLevel;
    url: string;
  };
}

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

export interface DatadogConfig {
  applicationId: string;
  clientToken: string;
  options: {
    site: string;
    service: string;
    env: string;
    sessionSampleRate: number;
    trackUserInteractions: boolean;
    trackResources: boolean;
    trackLongTasks: boolean;
    defaultPrivacyLevel: 'mask' | 'mask-user-input' | 'allow';
  };
}

export interface AnalyticsConfig {
  amplitude?: {
    apiKey: string;
  };
  posthog?: {
    apiKey: string;
    apiHost: string;
  };
}

export interface MonitoringConfig {
  sentry?: SentryConfig;
  datadog?: DatadogConfig;
  analytics?: AnalyticsConfig;
  logger?: LoggerConfig;
}
