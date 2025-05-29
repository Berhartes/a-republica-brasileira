/**
 * Sistema de logs para o ETL de dados do Senado Federal
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  /**
   * Define o nível de log
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Obtém o nível atual de log
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Log de erro
   */
  error(message: string, error?: any): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERRO] ${message}`);
      if (error) {
        if (error instanceof Error) {
          console.error(`Stack: ${error.stack}`);
        } else {
          console.error(error);
        }
      }
    }
  }

  /**
   * Log de aviso
   */
  warn(message: string, data?: any): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[AVISO] ${message}`);
      if (data) {
        console.warn(data);
      }
    }
  }

  /**
   * Log informativo
   */
  info(message: string, data?: any): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`);
      if (data) {
        console.info(data);
      }
    }
  }

  /**
   * Log de depuração
   */
  debug(message: string, data?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`);
      if (data) {
        console.debug(data);
      }
    }
  }

  /**
   * Log de requisição API
   */
  apiRequest(method: string, url: string, params?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`🌐 API Request: ${method} ${url}`);
      if (params && Object.keys(params).length > 0) {
        console.log(`📋 Params:`, params);
      }
    }
  }

  /**
   * Log de resposta API
   */
  apiResponse(url: string, status: number, duration: number): void {
    if (this.level >= LogLevel.DEBUG) {
      const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${statusIcon} API Response: ${url} - ${status} (${duration}ms)`);
    }
  }
}

// Exporta uma instância única do logger
export const logger = new Logger(LogLevel.INFO);
