/**
 * @file Logger utilitário para uso global
 */

// Níveis de log
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Interface do logger
export interface Logger {
  trace(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
  child(bindings: Record<string, any>): Logger;
}

// Implementação básica do logger usando console
const makeConsoleLogger = (bindings: Record<string, any> = {}): Logger => {
  const log = (level: LogLevel, message: string, ...args: any[]) => {
    // console[level] não é seguro para 'fatal', e 'trace' pode não existir em todos os consoles.
    // Mapear para funções de console existentes.
    let consoleFn = console.log; // default
    if (level === 'info') consoleFn = console.info;
    else if (level === 'warn') consoleFn = console.warn;
    else if (level === 'error' || level === 'fatal') consoleFn = console.error;
    else if (level === 'debug') consoleFn = console.debug;
    // 'trace' pode usar console.trace se disponível, ou console.debug/log

    const prefix = Object.entries(bindings).map(([key, value]) => `${key}=${value}`).join(' ');
    const timestamp = new Date().toISOString();
    
    let fullMessage = `[${timestamp}] [${level.toUpperCase()}]`;
    if (prefix) {
      fullMessage += ` [${prefix}]`;
    }
    fullMessage += ` ${message}`;

    consoleFn(fullMessage, ...args);
  };

  return {
    trace: (message, ...args) => log('trace', message, ...args),
    debug: (message, ...args) => log('debug', message, ...args),
    info: (message, ...args) => log('info', message, ...args),
    warn: (message, ...args) => log('warn', message, ...args),
    error: (message, ...args) => log('error', message, ...args),
    fatal: (message, ...args) => log('fatal', `FATAL: ${message}`, ...args),
    child: (childBindings) => makeConsoleLogger({ ...bindings, ...childBindings }),
  };
};

export const logger: Logger = makeConsoleLogger();

export default logger;
