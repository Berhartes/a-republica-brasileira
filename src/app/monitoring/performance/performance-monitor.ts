import { consoleLogger } from '../logger';

/**
 * Interface para métricas de performance
 */
export interface PerformanceMetric {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Configuração do monitor de performance
 */
export interface PerformanceMonitorConfig {
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
}

// Configuração padrão
const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  storeInLocalStorage: true,
  maxStoredMetrics: 100,
  logToConsole: true,
  collectWebVitals: true,
  collectResourceMetrics: true
};

/**
 * Armazena uma métrica no localStorage
 */
function storeMetricInLocalStorage(
  metric: PerformanceMetric,
  config?: PerformanceMonitorConfig
): void {
  if (!config?.storeInLocalStorage) return;
  
  try {
    // Recupera métricas existentes ou inicializa array vazio
    const storedMetrics = JSON.parse(localStorage.getItem('app_performance_metrics') || '[]');
    
    // Adiciona nova métrica
    storedMetrics.push({
      ...metric,
      timestamp: new Date().toISOString()
    });
    
    // Limita o número de métricas armazenadas
    const maxMetrics = config?.maxStoredMetrics || 100;
    const trimmedMetrics = storedMetrics.slice(-maxMetrics);
    
    // Salva métricas de volta no localStorage
    localStorage.setItem('app_performance_metrics', JSON.stringify(trimmedMetrics));
  } catch (error) {
    console.error('Falha ao armazenar métrica no localStorage:', error);
  }
}

/**
 * Coleta métricas Web Vitals
 */
function collectWebVitals(config?: PerformanceMonitorConfig): void {
  if (!config?.collectWebVitals) return;
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    // Observa as métricas de navegação
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        const metric: PerformanceMetric = {
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          metadata: {
            entryType: entry.entryType,
            ...entry.toJSON()
          }
        };
        
        if (config?.logToConsole) {
          consoleLogger.info(`[Performance] ${entry.name}`, metric);
        }
        
        storeMetricInLocalStorage(metric, config);
      });
    });
    
    // Observa diferentes tipos de métricas
    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
    
  } catch (error) {
    console.error('Falha ao coletar métricas Web Vitals:', error);
  }
}

/**
 * Coleta métricas de recursos
 */
function collectResourceMetrics(config?: PerformanceMonitorConfig): void {
  if (!config?.collectResourceMetrics) return;
  if (typeof window === 'undefined' || !window.performance) return;
  
  try {
    // Observa as métricas de recursos
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        // Filtra apenas recursos que levaram mais de 100ms para carregar
        if (entry.duration > 100) {
          const metric: PerformanceMetric = {
            name: `resource-${entry.name.split('/').pop()}`,
            startTime: entry.startTime,
            duration: entry.duration,
            metadata: {
              entryType: entry.entryType,
              resourceType: (entry as PerformanceResourceTiming).initiatorType,
              url: entry.name,
              ...entry.toJSON()
            }
          };
          
          if (config?.logToConsole) {
            consoleLogger.info(`[Resource] ${entry.name}`, metric);
          }
          
          storeMetricInLocalStorage(metric, config);
        }
      });
    });
    
    // Observa recursos
    observer.observe({ entryTypes: ['resource'] });
    
  } catch (error) {
    console.error('Falha ao coletar métricas de recursos:', error);
  }
}

/**
 * Cria um monitor de performance
 */
export function createPerformanceMonitor(customConfig?: Partial<PerformanceMonitorConfig>) {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  // Inicia coleta automática de métricas
  if (typeof window !== 'undefined') {
    if (config.collectWebVitals) {
      collectWebVitals(config);
    }
    
    if (config.collectResourceMetrics) {
      collectResourceMetrics(config);
    }
  }
  
  return {
    /**
     * Inicia uma medição de performance
     */
    startMeasure: (name: string, metadata?: Record<string, unknown>) => {
      const startTime = performance.now();
      
      return {
        /**
         * Finaliza a medição e registra a métrica
         */
        stop: () => {
          const duration = performance.now() - startTime;
          
          const metric: PerformanceMetric = {
            name,
            startTime,
            duration,
            metadata
          };
          
          if (config.logToConsole) {
            consoleLogger.info(`[Performance] ${name}: ${duration.toFixed(2)}ms`, metric);
          }
          
          storeMetricInLocalStorage(metric, config);
          
          return duration;
        }
      };
    },
    
    /**
     * Registra uma métrica de performance
     */
    recordMetric: (name: string, duration: number, metadata?: Record<string, unknown>) => {
      const metric: PerformanceMetric = {
        name,
        startTime: performance.now() - duration,
        duration,
        metadata
      };
      
      if (config.logToConsole) {
        consoleLogger.info(`[Performance] ${name}: ${duration.toFixed(2)}ms`, metric);
      }
      
      storeMetricInLocalStorage(metric, config);
    },
    
    /**
     * Recupera métricas armazenadas no localStorage
     */
    getStoredMetrics: () => {
      try {
        return JSON.parse(localStorage.getItem('app_performance_metrics') || '[]');
      } catch (error) {
        console.error('Falha ao recuperar métricas do localStorage:', error);
        return [];
      }
    },
    
    /**
     * Limpa métricas armazenadas no localStorage
     */
    clearStoredMetrics: () => {
      try {
        localStorage.removeItem('app_performance_metrics');
      } catch (error) {
        console.error('Falha ao limpar métricas do localStorage:', error);
      }
    },
    
    /**
     * Retorna métricas de navegação (Web Vitals)
     */
    getNavigationMetrics: () => {
      if (typeof window === 'undefined' || !window.performance) {
        return null;
      }
      
      try {
        const entries = performance.getEntriesByType('navigation');
        if (!entries || entries.length === 0) return null;
        
        // Precisamos fazer um cast para o tipo correto
        const navEntry = entries[0] as PerformanceNavigationTiming;
        
        return {
          // Tempos de carregamento
          domComplete: navEntry.domComplete,
          domContentLoaded: navEntry.domContentLoadedEventEnd,
          loadEvent: navEntry.loadEventEnd,
          
          // Métricas de rede
          redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
          dnsTime: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          tcpTime: navEntry.connectEnd - navEntry.connectStart,
          requestTime: navEntry.responseStart - navEntry.requestStart,
          responseTime: navEntry.responseEnd - navEntry.responseStart,
          
          // Métricas de processamento
          domProcessingTime: navEntry.domComplete - navEntry.responseEnd,
          
          // Métricas totais
          totalTime: navEntry.loadEventEnd
        };
      } catch (error) {
        console.error('Falha ao obter métricas de navegação:', error);
        return null;
      }
    }
  };
}

// Exporta uma instância padrão do monitor de performance
export const performanceMonitor = createPerformanceMonitor();

export default performanceMonitor;
