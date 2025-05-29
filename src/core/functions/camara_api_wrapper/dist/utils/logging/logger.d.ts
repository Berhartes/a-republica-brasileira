/**
 * Sistema de logs para o ETL de dados do Senado Federal
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
declare class Logger {
    private level;
    constructor(level?: LogLevel);
    /**
     * Define o nível de log
     */
    setLevel(level: LogLevel): void;
    /**
     * Obtém o nível atual de log
     */
    getLevel(): LogLevel;
    /**
     * Log de erro
     */
    error(message: string, error?: any): void;
    /**
     * Log de aviso
     */
    warn(message: string, data?: any): void;
    /**
     * Log informativo
     */
    info(message: string, data?: any): void;
    /**
     * Log de depuração
     */
    debug(message: string, data?: any): void;
    /**
     * Log de requisição API
     */
    apiRequest(method: string, url: string, params?: any): void;
    /**
     * Log de resposta API
     */
    apiResponse(url: string, status: number, duration: number): void;
}
export declare const logger: Logger;
export {};
