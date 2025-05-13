import React, { PropsWithChildren, useEffect } from 'react';
import { initSentry, SentryErrorBoundary } from '../error-tracking';
import { initDatadog } from '../performance';
import { initAnalytics } from '../analytics';
import { logger } from '../logger';
import type { MonitoringConfig } from '../types';

interface MonitoringProviderProps extends PropsWithChildren {
  config: MonitoringConfig;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * Provider component for monitoring services
 */
export function MonitoringProvider({ 
  children,
  config,
  fallback,
}: MonitoringProviderProps) {
  useEffect(() => {
    // Initialize Sentry
    if (config.sentry) {
      initSentry(config.sentry);
    }

    // Initialize DataDog
    if (config.datadog) {
      initDatadog(config.datadog);
    }

    // Initialize Analytics
    if (config.analytics) {
      initAnalytics(config.analytics);
    }

    // Configure Logger
    if (config.logger) {
      // Sobrescrever as configurações padrão do logger
      Object.assign(logger, {
        level: config.logger.level,
        enabled: config.logger.enabled,
      });
    }
  }, [config]);

  return (
    <SentryErrorBoundary fallback={fallback}>
      {children}
    </SentryErrorBoundary>
  );
}