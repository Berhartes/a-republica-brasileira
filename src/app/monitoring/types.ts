/**
 * Sentry configuration
 */
export interface SentryConfig {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
  }
  
  /**
   * DataDog configuration
   */
  export interface DatadogConfig {
    applicationId: string;
    clientToken: string;
    options?: {
      site?: string;
      service?: string;
      env?: string;
      version?: string;
      sessionSampleRate?: number;
      trackUserInteractions?: boolean;
      trackResources?: boolean;
      trackLongTasks?: boolean;
      defaultPrivacyLevel?: 'mask-user-input' | 'allow' | 'mask' | 'mask-all';
    };
  }
  
  /**
   * Analytics configuration
   */
  export interface AnalyticsConfig {
    amplitude?: {
      apiKey: string;
    };
    posthog?: {
      apiKey: string;
      apiHost?: string;
    };
  }
  
  /**
   * Logger configuration
   */
  export interface LoggerConfig {
    /** Nível mínimo de log */
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    /** Nome do serviço/aplicação */
    name?: string;
    /** Se deve mostrar timestamp */
    timestamp?: boolean;
    /** Se o logger está ativo */
    enabled: boolean;
    /** Configurações de transporte */
    transport?: {
      /** URL para envio de logs (se aplicável) */
      url?: string;
      /** Nível mínimo para envio remoto */
      level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    };
  }
  
  /**
   * Combined monitoring configuration
   */
  export interface MonitoringConfig {
    sentry?: Partial<SentryConfig>;
    datadog?: DatadogConfig;
    analytics?: AnalyticsConfig;
    logger?: LoggerConfig;
  }
  
  /**
   * User context for monitoring services
   */
  export interface UserContext {
    id: string;
    email?: string;
    username?: string;
    [key: string]: unknown;
  }
  
  /**
   * Error context for monitoring services
   */
  export interface ErrorContext {
    source: string;
    timestamp?: number;
    metadata?: Record<string, unknown>;
  }
  
  /**
   * Performance context for monitoring services
   */
  export interface PerformanceContext {
    name: string;
    duration?: number;
    tags?: Record<string, string>;
    data?: Record<string, unknown>;
  }
  
  /**
   * Feature flag context
   */
  export interface FeatureFlagContext {
    name: string;
    defaultValue: boolean;
    rules?: {
      condition: string;
      value: boolean;
    }[];
  }