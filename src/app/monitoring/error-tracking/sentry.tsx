import * as Sentry from '@sentry/react';
import type { SeverityLevel } from '@sentry/types';
import { PropsWithChildren } from 'react';
import type { SentryConfig, ErrorContext } from '../types';

// Default configuration values
const DEFAULT_CONFIG: Partial<SentryConfig> = {
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
};

/**
 * Check if a value is a placeholder
 */
function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return value.includes('placeholder') || value.includes('PLACEHOLDER');
}

/**
 * Initialize Sentry with configuration
 */
export function initSentry(config: Partial<SentryConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check if DSN is missing or is a placeholder
  if (!finalConfig.dsn || isPlaceholder(finalConfig.dsn)) {
    // Em ambiente de desenvolvimento, não exibimos o aviso
    if (import.meta.env.PROD) {
      console.warn('Sentry DSN not provided or is a placeholder. Error tracking will be disabled.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: finalConfig.dsn,
      environment: finalConfig.environment,
      tracesSampleRate: finalConfig.tracesSampleRate,
      replaysSessionSampleRate: finalConfig.replaysSessionSampleRate,
      replaysOnErrorSampleRate: finalConfig.replaysOnErrorSampleRate,
      
      beforeSend(event) {
        // Sanitize sensitive data
        if (event.request?.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.Cookie;
        }

        // Remove PII from URLs
        if (event.request?.url) {
          event.request.url = event.request.url.replace(/email=([^&]*)/g, 'email=REDACTED');
        }

        // Add environment context
        event.tags = {
          ...event.tags,
          app_version: import.meta.env.VITE_APP_VERSION,
          node_env: import.meta.env.MODE,
        };

        return event;
      },
    });

    // Log successful initialization in development
    if (import.meta.env.DEV) {
      console.log('Sentry initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

interface ErrorBoundaryProps extends PropsWithChildren {
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Default error fallback component
 */
const DefaultFallback = ({ error, resetError }: ErrorFallbackProps) => (
  <div className="error-boundary p-4 border border-red-500 rounded-lg bg-red-50">
    <h2 className="text-lg font-semibold text-red-700 mb-2">
      Algo deu errado
    </h2>
    <pre className="text-sm text-red-600 mb-4 overflow-auto">
      {error.message}
    </pre>
    <button
      onClick={resetError}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Tentar novamente
    </button>
  </div>
);

/**
 * Error Boundary component with Sentry integration
 */
export const SentryErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children,
  fallback: CustomFallback,
}) => {
  const handleError = (error: unknown, componentStack: string) => {
    Sentry.withScope((scope) => {
      scope.setTag('error_boundary', 'true');
      scope.setExtra('componentStack', componentStack);
      scope.setExtra('timestamp', new Date().toISOString());
      Sentry.captureException(error);
    });
  };

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => {
        const Component = CustomFallback || DefaultFallback;
        return <Component error={error as Error} resetError={resetError} />;
      }}
      onError={handleError}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

/**
 * Utility to manually capture errors with context
 */
export function captureError(error: Error, context?: ErrorContext) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setTag('error_source', context.source);
      scope.setExtra('error_context', context);
    }

    scope.setExtra('timestamp', new Date().toISOString());
    Sentry.captureException(error);
  });
}

/**
 * Utility to manually capture messages
 */
export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Set user information in Sentry
 */
export function setUser(
  id: string,
  data?: { email?: string; username?: string; [key: string]: unknown }
) {
  Sentry.setUser({
    id,
    ...data,
  });
}

/**
 * Clear user information from Sentry
 */
export function clearUser() {
  Sentry.setUser(null);
}
