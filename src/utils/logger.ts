/**
 * @file Logger utilitário para uso global
 */

import { logger as appLogger } from '@/core/monitoring';

// Re-exporta o logger da aplicação
export const logger = appLogger;

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

export default logger;
