/**
 * Sistema de logs para o ETL de dados do Senado Federal
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor(level = LogLevel.INFO) {
        this.level = level;
    }
    /**
     * Define o nível de log
     */
    setLevel(level) {
        this.level = level;
    }
    /**
     * Obtém o nível atual de log
     */
    getLevel() {
        return this.level;
    }
    /**
     * Log de erro
     */
    error(message, error) {
        if (this.level >= LogLevel.ERROR) {
            console.error(`[ERRO] ${message}`);
            if (error) {
                if (error instanceof Error) {
                    console.error(`Stack: ${error.stack}`);
                }
                else {
                    console.error(error);
                }
            }
        }
    }
    /**
     * Log de aviso
     */
    warn(message, data) {
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
    info(message, data) {
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
    debug(message, data) {
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
    apiRequest(method, url, params) {
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
    apiResponse(url, status, duration) {
        if (this.level >= LogLevel.DEBUG) {
            const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
            console.log(`${statusIcon} API Response: ${url} - ${status} (${duration}ms)`);
        }
    }
}
// Exporta uma instância única do logger
export const logger = new Logger(LogLevel.INFO);
//# sourceMappingURL=logger.js.map