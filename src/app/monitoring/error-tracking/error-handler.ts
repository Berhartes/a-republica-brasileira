import { consoleLogger } from '../logger';

/**
 * Interface para contexto de erro
 */
export interface ErrorContext {
  source: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Configuração do manipulador de erros
 */
export interface ErrorHandlerConfig {
  /** Se deve armazenar erros no localStorage */
  storeInLocalStorage?: boolean;
  /** Número máximo de erros para armazenar */
  maxStoredErrors?: number;
  /** Se deve registrar erros no console */
  logToConsole?: boolean;
  /** Se deve enviar erros para um endpoint remoto */
  reportToEndpoint?: boolean;
  /** URL do endpoint para envio de erros */
  endpointUrl?: string;
}

// Configuração padrão
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  storeInLocalStorage: true,
  maxStoredErrors: 50,
  logToConsole: true,
  reportToEndpoint: false,
  endpointUrl: '/api/errors'
};

/**
 * Armazena um erro no localStorage
 */
function storeErrorInLocalStorage(
  error: Error,
  context?: ErrorContext,
  config?: ErrorHandlerConfig
): void {
  if (!config?.storeInLocalStorage) return;
  
  try {
    // Recupera erros existentes ou inicializa array vazio
    const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    
    // Adiciona novo erro
    storedErrors.push({
      timestamp: context?.timestamp || new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      source: context?.source || 'unknown',
      metadata: context?.metadata
    });
    
    // Limita o número de erros armazenados
    const maxErrors = config?.maxStoredErrors || 50;
    const trimmedErrors = storedErrors.slice(-maxErrors);
    
    // Salva erros de volta no localStorage
    localStorage.setItem('app_errors', JSON.stringify(trimmedErrors));
  } catch (storageError) {
    console.error('Falha ao armazenar erro no localStorage:', storageError);
  }
}

/**
 * Envia um erro para um endpoint remoto
 */
function reportErrorToEndpoint(
  error: Error,
  context?: ErrorContext,
  config?: ErrorHandlerConfig
): void {
  if (!config?.reportToEndpoint || !config?.endpointUrl) return;
  
  try {
    const errorData = {
      timestamp: context?.timestamp || new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      source: context?.source || 'unknown',
      metadata: context?.metadata,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Envia erro para o endpoint
    fetch(config.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorData),
      keepalive: true
    }).catch(fetchError => {
      console.error('Falha ao enviar erro para endpoint:', fetchError);
    });
  } catch (reportError) {
    console.error('Falha ao reportar erro:', reportError);
  }
}

/**
 * Cria um manipulador de erros
 */
export function createErrorHandler(customConfig?: Partial<ErrorHandlerConfig>) {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  return {
    /**
     * Captura um erro com contexto opcional
     */
    captureError: (error: Error, context?: ErrorContext) => {
      // Registra erro no console
      if (config.logToConsole) {
        consoleLogger.error(`[ErrorHandler] ${error.message}`, {
          error,
          context
        });
      }
      
      // Armazena erro no localStorage
      storeErrorInLocalStorage(error, context, config);
      
      // Envia erro para endpoint remoto
      reportErrorToEndpoint(error, context, config);
    },
    
    /**
     * Captura uma mensagem como erro
     */
    captureMessage: (message: string, level: 'info' | 'warn' | 'error' = 'info', context?: Record<string, unknown>) => {
      // Cria um erro a partir da mensagem
      const error = new Error(message);
      
      // Registra no console com nível apropriado
      if (config.logToConsole) {
        if (level === 'info') {
          consoleLogger.info(`[ErrorHandler] ${message}`, context);
        } else if (level === 'warn') {
          consoleLogger.warn(`[ErrorHandler] ${message}`, context);
        } else {
          consoleLogger.error(`[ErrorHandler] ${message}`, context);
        }
      }
      
      // Para mensagens de erro, armazena e reporta
      if (level === 'error') {
        storeErrorInLocalStorage(error, { 
          source: 'message',
          metadata: context
        }, config);
        
        reportErrorToEndpoint(error, {
          source: 'message',
          metadata: context
        }, config);
      }
    },
    
    /**
     * Recupera erros armazenados no localStorage
     */
    getStoredErrors: () => {
      try {
        return JSON.parse(localStorage.getItem('app_errors') || '[]');
      } catch (error) {
        console.error('Falha ao recuperar erros do localStorage:', error);
        return [];
      }
    },
    
    /**
     * Limpa erros armazenados no localStorage
     */
    clearStoredErrors: () => {
      try {
        localStorage.removeItem('app_errors');
      } catch (error) {
        console.error('Falha ao limpar erros do localStorage:', error);
      }
    },
    
    /**
     * Cria um componente ErrorBoundary para React
     * 
     * Nota: Este método deve ser usado em um arquivo .tsx, não diretamente aqui
     * devido às limitações do TypeScript com JSX em arquivos .ts
     */
    createErrorBoundary: (React: any) => {
      // Retorna uma classe que pode ser usada como ErrorBoundary
      return class ErrorBoundary extends React.Component {
        state = { hasError: false, error: null };
        
        static getDerivedStateFromError(error: Error) {
          return { hasError: true, error };
        }
        
        componentDidCatch(error: Error, errorInfo: any) {
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
              return this.props.fallback({
                error: this.state.error,
                resetError: this.resetError
              });
            }
            
            // Não podemos usar JSX diretamente aqui em um arquivo .ts
            // Então retornamos null e deixamos para o componente que usa
            // este ErrorBoundary definir um fallback apropriado
            return null;
          }
          
          return this.props.children;
        }
      };
    }
  };
}

// Exporta uma instância padrão do manipulador de erros
export const errorHandler = createErrorHandler();

export default errorHandler;
