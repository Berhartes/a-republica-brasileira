# Sistema de Monitoramento

Este diretório contém o sistema de monitoramento da aplicação, com suporte para rastreamento de erros, monitoramento de performance e logging.

## Opções de Monitoramento

O sistema oferece duas abordagens para monitoramento:

### 1. Monitoramento com Serviços Externos (Sentry e DataDog)

Utiliza serviços externos para monitoramento completo:

- **Sentry**: Para rastreamento de erros e exceções
- **DataDog**: Para monitoramento de performance e experiência do usuário
- **Analytics**: Para análise de comportamento do usuário

Para usar esta abordagem, você precisa configurar as credenciais no arquivo `.env`:

```
# Sentry Configuration
VITE_SENTRY_DSN=seu-dsn-aqui
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0

# DataDog Configuration
VITE_DATADOG_APPLICATION_ID=seu-application-id-aqui
VITE_DATADOG_CLIENT_TOKEN=seu-client-token-aqui
VITE_DATADOG_SITE=datadoghq.com
VITE_DATADOG_SERVICE=a-republica-brasileira
VITE_DATADOG_ENV=development
```

Exemplo de uso:

```tsx
import { MonitoringProvider } from '@/app/monitoring';

// Configuração
const monitoringConfig = {
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    // ...outras configurações
  },
  datadog: {
    applicationId: import.meta.env.VITE_DATADOG_APPLICATION_ID,
    clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
    // ...outras configurações
  },
  // ...outras configurações
};

// Uso no componente App
<MonitoringProvider config={monitoringConfig}>
  <App />
</MonitoringProvider>
```

### 2. Monitoramento Simples (Alternativa Local)

Uma alternativa mais simples que não depende de serviços externos, ideal para desenvolvimento ou projetos menores:

- **errorHandler**: Sistema local de rastreamento de erros com armazenamento no localStorage
- **performanceMonitor**: Monitoramento de performance usando a API Performance do navegador
- **consoleLogger**: Sistema de logging formatado com armazenamento no localStorage

Exemplo de uso:

```tsx
import { SimpleMonitoringProvider } from '@/app/monitoring';

// Configuração
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
    level: 'debug',
    storeInLocalStorage: true,
    maxStoredLogs: 100,
    enabled: true
  }
};

// Uso no componente App
<SimpleMonitoringProvider config={simpleMonitoringConfig}>
  <App />
</SimpleMonitoringProvider>
```

## Utilitários Disponíveis

### Logging

```tsx
import { consoleLogger } from '@/app/monitoring';

// Logs com diferentes níveis
consoleLogger.trace('Mensagem de trace');
consoleLogger.debug('Mensagem de debug');
consoleLogger.info('Mensagem informativa');
consoleLogger.warn('Aviso importante');
consoleLogger.error('Erro ocorrido', { detalhes: 'Informações adicionais' });
consoleLogger.fatal('Erro crítico', new Error('Detalhes do erro'));

// Agrupamento de logs
consoleLogger.group('Operação Complexa');
consoleLogger.info('Passo 1');
consoleLogger.info('Passo 2');
consoleLogger.groupEnd();

// Medição de tempo
const timer = consoleLogger.time('Operação');
// ... código a ser medido
timer.end(); // Finaliza e registra o tempo

// Recuperar logs armazenados
const logs = consoleLogger.getStoredLogs();
console.table(logs);
```

### Rastreamento de Erros

```tsx
import { errorHandler } from '@/app/monitoring';

// Capturar erros manualmente
try {
  // Código que pode gerar erro
} catch (error) {
  errorHandler.captureError(error instanceof Error ? error : new Error(String(error)), {
    source: 'componente-x',
    metadata: { detalhes: 'contexto adicional' }
  });
}

// Capturar mensagens
errorHandler.captureMessage('Algo importante aconteceu', 'info');
errorHandler.captureMessage('Aviso importante', 'warn');
errorHandler.captureMessage('Erro encontrado', 'error', { detalhes: 'contexto' });

// Recuperar erros armazenados
const errors = errorHandler.getStoredErrors();
console.table(errors);
```

### Monitoramento de Performance

```tsx
import { performanceMonitor } from '@/app/monitoring';

// Medir tempo de operação
const measure = performanceMonitor.startMeasure('operacao-x', { contexto: 'adicional' });
// ... código a ser medido
const duration = measure.stop(); // Finaliza medição e retorna duração

// Registrar métrica diretamente
performanceMonitor.recordMetric('evento-y', 250, { contexto: 'adicional' });

// Obter métricas de navegação
const navMetrics = performanceMonitor.getNavigationMetrics();
console.log(navMetrics);

// Recuperar métricas armazenadas
const metrics = performanceMonitor.getStoredMetrics();
console.table(metrics);
```

## Exemplo Completo

Veja um exemplo completo de uso em `src/app/monitoring/examples/SimpleMonitoringExample.tsx`.

## Migração

Para migrar do MonitoringProvider para o SimpleMonitoringProvider:

1. Substitua o provider no seu App.tsx:

```tsx
// Antes
<MonitoringProvider config={monitoringConfig}>
  <App />
</MonitoringProvider>

// Depois
<SimpleMonitoringProvider config={simpleMonitoringConfig}>
  <App />
</SimpleMonitoringProvider>
```

2. Substitua as chamadas de API:

```tsx
// Antes
import { captureError, captureMessage } from '@/app/monitoring';
captureError(error);
captureMessage('mensagem');

// Depois
import { errorHandler } from '@/app/monitoring';
errorHandler.captureError(error);
errorHandler.captureMessage('mensagem');
```

3. Substitua as chamadas de performance:

```tsx
// Antes
import { startDatadogMeasure } from '@/app/monitoring';
const measure = startDatadogMeasure('operacao');
measure.stop();

// Depois
import { performanceMonitor } from '@/app/monitoring';
const measure = performanceMonitor.startMeasure('operacao');
measure.stop();
```
