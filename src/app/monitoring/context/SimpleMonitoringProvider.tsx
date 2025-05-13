import React, { PropsWithChildren, useEffect } from 'react';
import { errorHandler } from '../error-tracking/error-handler';
import { performanceMonitor } from '../performance/performance-monitor';
import { consoleLogger } from '../logger';

interface SimpleMonitoringConfig {
  /** Configuração do manipulador de erros */
  errorHandler?: {
    /** Se deve armazenar erros no localStorage */
    storeInLocalStorage?: boolean;
    /** Número máximo de erros para armazenar */
    maxStoredErrors?: number;
    /** Se deve registrar erros no console */
    logToConsole?: boolean;
  };
  
  /** Configuração do monitor de performance */
  performanceMonitor?: {
    /** Se deve armazenar métricas no localStorage */
    storeInLocalStorage?: boolean;
    /** Número máximo de métricas para armazenar */
    maxStoredMetrics?: number;
    /** Se deve registrar métricas no console */
    logToConsole?: boolean;
    /** Se deve coletar métricas web vitals automaticamente */
    collectWebVitals?: boolean;
    /** Se deve coletar métricas de recursos automaticamente */
    collectResourceMetrics?: boolean;
  };
  
  /** Configuração do logger */
  logger?: {
    /** Nível mínimo de log */
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    /** Se deve armazenar logs no localStorage */
    storeInLocalStorage?: boolean;
    /** Número máximo de logs para armazenar */
    maxStoredLogs?: number;
    /** Se o logger está ativo */
    enabled?: boolean;
  };
}

interface SimpleMonitoringProviderProps extends PropsWithChildren {
  config?: SimpleMonitoringConfig;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * Componente ErrorBoundary simples
 */
class SimpleErrorBoundary extends React.Component<PropsWithChildren & { fallback?: React.ComponentType<{ error: Error; resetError: () => void }> }> {
  state = { hasError: false, error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Captura o erro quando ocorre
    errorHandler.captureError(error, {
      source: 'react',
      metadata: { componentStack: errorInfo.componentStack }
    });
  }
  
  resetError = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      // Renderiza fallback ou fallback padrão
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.resetError} />;
      }
      
      // Fallback padrão
      return (
        <div className="error-boundary p-4 border border-red-500 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-700 mb-2">
            Algo deu errado
          </h2>
          <pre className="text-sm text-red-600 mb-4 overflow-auto">
            {this.state.error?.message}
          </pre>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

/**
 * Provider de monitoramento simples que usa alternativas locais
 * em vez de serviços externos como Sentry e DataDog
 */
export function SimpleMonitoringProvider({ 
  children,
  config,
  fallback
}: SimpleMonitoringProviderProps) {
  useEffect(() => {
    // Registra inicialização
    consoleLogger.info('SimpleMonitoringProvider inicializado', { config });
    
    // Configura manipulador de erros global
    window.addEventListener('error', (event) => {
      errorHandler.captureError(event.error || new Error(event.message), {
        source: 'window.onerror',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
    
    // Configura manipulador de promessas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      errorHandler.captureError(error, {
        source: 'unhandledrejection'
      });
    });
    
    // Registra métricas de navegação iniciais
    const navMetrics = performanceMonitor.getNavigationMetrics();
    if (navMetrics) {
      consoleLogger.info('Métricas de navegação iniciais', navMetrics);
    }
    
    return () => {
      // Remove event listeners ao desmontar
      window.removeEventListener('error', () => {});
      window.removeEventListener('unhandledrejection', () => {});
    };
  }, []);
  
  return (
    <SimpleErrorBoundary fallback={fallback}>
      {children}
    </SimpleErrorBoundary>
  );
}

export default SimpleMonitoringProvider;
