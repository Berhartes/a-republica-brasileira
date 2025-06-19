// Re-export monitoring components
export { SentryErrorBoundary } from './error-tracking';
export { MonitoringProvider, SimpleMonitoringProvider } from './context';

// Re-export monitoring hooks
export { useMonitoring } from './hooks/useMonitoring';

// Re-export monitoring utilities
export {
  captureError,
  captureMessage,
  errorHandler,
} from './error-tracking';

export {
  // DataDog exports para compatibilidade
  addAction as addDatadogAction,
  addError as addDatadogError,
  startMeasure as startDatadogMeasure,
  
  // Novos utilitários de performance
  performanceMonitor,
} from './performance';

export {
  trackEvent,
  identifyUser,
  isFeatureEnabled,
  addPageProperties,
} from './analytics';

export {
  logger,
  consoleLogger,
  createConsoleLogger,
} from './logger';

// Re-export types
export * from './types';
