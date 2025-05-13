/**
 * Utilitário para formatação e armazenamento de logs no console e localStorage
 */

// Tipos de log suportados
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Cores para diferentes níveis de log
const LOG_COLORS = {
  trace: '#6c757d', // cinza
  debug: '#17a2b8', // ciano
  info: '#28a745',  // verde
  warn: '#ffc107',  // amarelo
  error: '#dc3545', // vermelho
  fatal: '#7b1fa2'  // roxo
};

// Configuração do logger
export interface ConsoleLoggerConfig {
  /** Nível mínimo de log */
  level: LogLevel;
  /** Nome do serviço/aplicação */
  name?: string;
  /** Se deve mostrar timestamp */
  timestamp?: boolean;
  /** Se o logger está ativo */
  enabled: boolean;
  /** Se deve armazenar logs no localStorage */
  storeInLocalStorage?: boolean;
  /** Número máximo de logs para armazenar no localStorage */
  maxStoredLogs?: number;
}

// Configuração padrão
const DEFAULT_CONFIG: ConsoleLoggerConfig = {
  level: (import.meta.env.VITE_LOGGER_LEVEL as LogLevel) || 'info',
  name: 'a-republica-brasileira',
  timestamp: true,
  enabled: import.meta.env.VITE_LOGGER_ENABLED !== 'false',
  storeInLocalStorage: true,
  maxStoredLogs: 100
};

// Mapeamento de níveis de log para prioridade numérica
const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};

/**
 * Verifica se um nível de log deve ser registrado com base na configuração
 */
function shouldLog(level: LogLevel, config: ConsoleLoggerConfig): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

/**
 * Formata uma mensagem de log
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  config: ConsoleLoggerConfig
): string {
  const parts = [];
  
  if (config.timestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  if (config.name) {
    parts.push(`[${config.name}]`);
  }
  
  parts.push(`[${level.toUpperCase()}]`);
  parts.push(message);
  
  return parts.join(' ');
}

/**
 * Armazena um log no localStorage
 */
function storeLogInLocalStorage(
  level: LogLevel,
  message: string,
  args: unknown[],
  config: ConsoleLoggerConfig
): void {
  if (!config.storeInLocalStorage) return;
  
  try {
    // Recupera logs existentes ou inicializa array vazio
    const storedLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    
    // Adiciona novo log
    storedLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      args: args.length > 0 ? JSON.stringify(args) : undefined
    });
    
    // Limita o número de logs armazenados
    const maxLogs = config.maxStoredLogs || 100;
    const trimmedLogs = storedLogs.slice(-maxLogs);
    
    // Salva logs de volta no localStorage
    localStorage.setItem('app_logs', JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Falha ao armazenar log no localStorage:', error);
  }
}

/**
 * Cria uma instância do console logger
 */
export function createConsoleLogger(customConfig?: Partial<ConsoleLoggerConfig>) {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  return {
    /**
     * Log de nível trace
     */
    trace: (message: string, ...args: unknown[]) => {
      if (shouldLog('trace', config)) {
        const formattedMessage = formatLogMessage('trace', message, config);
        console.log(`%c${formattedMessage}`, `color: ${LOG_COLORS.trace}`, ...args);
        storeLogInLocalStorage('trace', message, args, config);
      }
    },
    
    /**
     * Log de nível debug
     */
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug', config)) {
        const formattedMessage = formatLogMessage('debug', message, config);
        console.log(`%c${formattedMessage}`, `color: ${LOG_COLORS.debug}`, ...args);
        storeLogInLocalStorage('debug', message, args, config);
      }
    },
    
    /**
     * Log de nível info
     */
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info', config)) {
        const formattedMessage = formatLogMessage('info', message, config);
        console.log(`%c${formattedMessage}`, `color: ${LOG_COLORS.info}`, ...args);
        storeLogInLocalStorage('info', message, args, config);
      }
    },
    
    /**
     * Log de nível warn
     */
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn', config)) {
        const formattedMessage = formatLogMessage('warn', message, config);
        console.warn(`%c${formattedMessage}`, `color: ${LOG_COLORS.warn}`, ...args);
        storeLogInLocalStorage('warn', message, args, config);
      }
    },
    
    /**
     * Log de nível error
     */
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error', config)) {
        const formattedMessage = formatLogMessage('error', message, config);
        console.error(`%c${formattedMessage}`, `color: ${LOG_COLORS.error}`, ...args);
        storeLogInLocalStorage('error', message, args, config);
      }
    },
    
    /**
     * Log de nível fatal
     */
    fatal: (message: string, ...args: unknown[]) => {
      if (shouldLog('fatal', config)) {
        const formattedMessage = formatLogMessage('fatal', message, config);
        console.error(`%c${formattedMessage}`, `color: ${LOG_COLORS.fatal}; font-weight: bold`, ...args);
        storeLogInLocalStorage('fatal', message, args, config);
      }
    },
    
    /**
     * Inicia um grupo de logs no console
     */
    group: (label: string, collapsed = false) => {
      if (config.enabled) {
        if (collapsed) {
          console.groupCollapsed(label);
        } else {
          console.group(label);
        }
      }
    },
    
    /**
     * Finaliza um grupo de logs no console
     */
    groupEnd: () => {
      if (config.enabled) {
        console.groupEnd();
      }
    },
    
    /**
     * Mede o tempo de execução de uma operação
     */
    time: (label: string) => {
      if (config.enabled) {
        console.time(label);
      }
      
      return {
        end: () => {
          if (config.enabled) {
            console.timeEnd(label);
          }
        }
      };
    },
    
    /**
     * Recupera logs armazenados no localStorage
     */
    getStoredLogs: (): Array<{
      timestamp: string;
      level: LogLevel;
      message: string;
      args?: string;
    }> => {
      try {
        return JSON.parse(localStorage.getItem('app_logs') || '[]');
      } catch (error) {
        console.error('Falha ao recuperar logs do localStorage:', error);
        return [];
      }
    },
    
    /**
     * Limpa logs armazenados no localStorage
     */
    clearStoredLogs: () => {
      try {
        localStorage.removeItem('app_logs');
      } catch (error) {
        console.error('Falha ao limpar logs do localStorage:', error);
      }
    },
    
    /**
     * Cria um logger filho com contexto adicional
     */
    child: (context: Record<string, unknown>) => {
      return createConsoleLogger({
        ...config,
        name: config.name ? `${config.name}:${Object.values(context).join(':')}` : undefined
      });
    }
  };
}

// Exporta uma instância padrão do console logger
export const consoleLogger = createConsoleLogger();

export default consoleLogger;
