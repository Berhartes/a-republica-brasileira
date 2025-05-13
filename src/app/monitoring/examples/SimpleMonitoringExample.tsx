import React from 'react';
import { SimpleMonitoringProvider, consoleLogger, errorHandler, performanceMonitor } from '@/app/monitoring';

/**
 * Exemplo de como usar o SimpleMonitoringProvider como alternativa ao MonitoringProvider
 * 
 * Este componente demonstra como substituir o MonitoringProvider que usa Sentry e DataDog
 * por uma alternativa mais simples que usa apenas ferramentas locais.
 */
export function SimpleMonitoringExample() {
  // Configuração do monitoramento simples
  const simpleMonitoringConfig = {
    errorHandler: {
      storeInLocalStorage: true,
      maxStoredErrors: 50,
      logToConsole: true
    },
    performanceMonitor: {
      storeInLocalStorage: true,
      maxStoredMetrics: 100,
      logToConsole: true,
      collectWebVitals: true,
      collectResourceMetrics: true
    },
    logger: {
      level: 'debug' as 'debug', // Tipagem explícita para resolver o erro
      storeInLocalStorage: true,
      maxStoredLogs: 100,
      enabled: true
    }
  };

  // Exemplo de como usar o SimpleMonitoringProvider
  return (
    <SimpleMonitoringProvider config={simpleMonitoringConfig}>
      <YourApp />
    </SimpleMonitoringProvider>
  );
}

/**
 * Exemplo de como usar as ferramentas de monitoramento simples em componentes
 */
function YourApp() {
  // Exemplo de como registrar logs
  React.useEffect(() => {
    // Usando o consoleLogger
    consoleLogger.info('Aplicação inicializada');
    consoleLogger.debug('Detalhes de inicialização', { timestamp: new Date() });
    
    // Medindo performance
    const measure = performanceMonitor.startMeasure('app-initialization');
    
    // Simulando alguma operação
    setTimeout(() => {
      // Finalizando medição
      const duration = measure.stop();
      consoleLogger.info(`Inicialização completa em ${duration.toFixed(2)}ms`);
      
      // Registrando evento de performance
      performanceMonitor.recordMetric('app-ready', performance.now(), {
        route: window.location.pathname
      });
    }, 500);
    
    // Exemplo de como capturar erros manualmente
    try {
      // Simulando uma operação que pode falhar
      const data = localStorage.getItem('user-data');
      if (!data) {
        throw new Error('Dados do usuário não encontrados');
      }
    } catch (error) {
      // Capturando o erro
      errorHandler.captureError(error instanceof Error ? error : new Error(String(error)), {
        source: 'app-initialization'
      });
    }
    
    // Exemplo de como registrar uma mensagem de erro
    errorHandler.captureMessage('Aviso importante', 'warn', {
      context: 'startup',
      details: 'Alguma configuração está faltando'
    });
    
    return () => {
      consoleLogger.info('Aplicação encerrada');
    };
  }, []);
  
  // Exemplo de como simular um erro para testar o ErrorBoundary
  const simulateError = () => {
    throw new Error('Erro simulado para teste');
  };
  
  return (
    <div className="app">
      <h1>Exemplo de Monitoramento Simples</h1>
      
      <div className="card">
        <h2>Ferramentas Disponíveis</h2>
        <ul>
          <li>consoleLogger - Para logs formatados no console</li>
          <li>errorHandler - Para captura e armazenamento de erros</li>
          <li>performanceMonitor - Para métricas de performance</li>
        </ul>
      </div>
      
      <div className="card">
        <h2>Ações de Teste</h2>
        <button onClick={() => consoleLogger.info('Botão clicado')}>
          Registrar Log
        </button>
        <button onClick={() => performanceMonitor.recordMetric('button-click', 0)}>
          Registrar Métrica
        </button>
        <button onClick={() => errorHandler.captureMessage('Mensagem de teste', 'info')}>
          Registrar Mensagem
        </button>
        <button onClick={simulateError}>
          Simular Erro (Testar ErrorBoundary)
        </button>
      </div>
      
      <div className="card">
        <h2>Visualizar Dados Armazenados</h2>
        <button onClick={() => console.table(consoleLogger.getStoredLogs())}>
          Ver Logs Armazenados
        </button>
        <button onClick={() => console.table(errorHandler.getStoredErrors())}>
          Ver Erros Armazenados
        </button>
        <button onClick={() => console.table(performanceMonitor.getStoredMetrics())}>
          Ver Métricas Armazenadas
        </button>
      </div>
    </div>
  );
}

/**
 * Exemplo de como usar o SimpleMonitoringProvider no App.tsx principal
 * 
 * Para usar o SimpleMonitoringProvider em vez do MonitoringProvider original,
 * você pode substituir o código no App.tsx:
 * 
 * ```tsx
 * // Antes:
 * <MonitoringProvider config={monitoringConfig}>
 *   <RouterProvider router={router} />
 * </MonitoringProvider>
 * 
 * // Depois:
 * <SimpleMonitoringProvider config={simpleMonitoringConfig}>
 *   <RouterProvider router={router} />
 * </SimpleMonitoringProvider>
 * ```
 */
export function AppExample() {
  return (
    <SimpleMonitoringProvider>
      {/* Seu conteúdo de aplicação aqui */}
    </SimpleMonitoringProvider>
  );
}

export default SimpleMonitoringExample;
