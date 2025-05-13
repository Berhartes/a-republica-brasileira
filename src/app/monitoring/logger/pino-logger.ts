import pino from 'pino';

/**
 * Níveis de log suportados
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Configuração do logger
 */
export interface LoggerConfig {
  /** Nível mínimo de log */
  level: LogLevel;
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
    level?: LogLevel;
  };
}

/**
 * Configuração padrão do logger
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: (import.meta.env.VITE_LOGGER_LEVEL as LogLevel) || 'info',
  name: 'a-republica-brasileira',
  timestamp: true,
  enabled: import.meta.env.VITE_LOGGER_ENABLED !== 'false',
  transport: {
    level: (import.meta.env.VITE_LOGGER_TRANSMIT_LEVEL as LogLevel) || 'error',
    url: import.meta.env.VITE_LOGGER_TRANSMIT_URL
  }
};

/**
 * Cria instância do logger Pino
 */
const pinoLogger = pino({
  level: DEFAULT_CONFIG.level,
  enabled: DEFAULT_CONFIG.enabled,
  base: {
    name: DEFAULT_CONFIG.name,
    env: import.meta.env.MODE
  },
  timestamp: DEFAULT_CONFIG.timestamp,
  browser: {
    asObject: true,
    transmit: {
      level: DEFAULT_CONFIG.transport?.level || 'error',
      send: (level, logEvent) => {
        // Apenas envia logs remotamente se estiver em produção e tiver URL configurada
        if (import.meta.env.PROD && DEFAULT_CONFIG.transport?.url) {
          const url = DEFAULT_CONFIG.transport.url;
          
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(logEvent),
            keepalive: true
          }).catch(console.error);
        }
      }
    }
  }
});

/**
 * Logger unificado para aplicação
 */
export const logger = {
  /**
   * Log de nível trace
   * @param message Mensagem do log
   * @param args Argumentos adicionais
   */
  trace: (message: string, ...args: unknown[]) => {
    pinoLogger.trace({ args }, message);
  },
  
  /**
   * Log de nível debug
   * @param message Mensagem do log
   * @param args Argumentos adicionais
   */
  debug: (message: string, ...args: unknown[]) => {
    pinoLogger.debug({ args }, message);
  },
  
  /**
   * Log de nível info
   * @param message Mensagem do log
   * @param args Argumentos adicionais
   */
  info: (message: string, ...args: unknown[]) => {
    pinoLogger.info({ args }, message);
  },
  
  /**
   * Log de nível warn
   * @param message Mensagem do log
   * @param args Argumentos adicionais
   */
  warn: (message: string, ...args: unknown[]) => {
    pinoLogger.warn({ args }, message);
  },
  
  /**
   * Log de nível error
   * @param message Mensagem do log
   * @param args Argumentos adicionais
   */
  error: (message: string, ...args: unknown[]) => {
    pinoLogger.error({ args }, message);
  },
  
  /**
   * Log de nível fatal
   * @param message Mensagem do log
   * @param args Argumentos adicionais
   */
  fatal: (message: string, ...args: unknown[]) => {
    pinoLogger.fatal({ args }, message);
  },
  
  /**
   * Criar logger filho com contexto adicional
   * @param bindings Contexto adicional
   * @returns Nova instância de logger
   */
  child: (bindings: Record<string, unknown>) => {
    const childLogger = pinoLogger.child(bindings);
    
    return {
      trace: (message: string, ...args: unknown[]) => childLogger.trace({ args }, message),
      debug: (message: string, ...args: unknown[]) => childLogger.debug({ args }, message),
      info: (message: string, ...args: unknown[]) => childLogger.info({ args }, message),
      warn: (message: string, ...args: unknown[]) => childLogger.warn({ args }, message),
      error: (message: string, ...args: unknown[]) => childLogger.error({ args }, message),
      fatal: (message: string, ...args: unknown[]) => childLogger.fatal({ args }, message)
    };
  }
};

export default logger;
