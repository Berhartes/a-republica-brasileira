"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = exports.ApiError = exports.WrapperError = void 0;
exports.handleError = handleError;
exports.withRetry = withRetry;
/**
 * Sistema de tratamento de erros para o ETL de dados do Senado Federal
 */
const logger_1 = require("./logger");
class WrapperError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'WrapperError';
        Object.setPrototypeOf(this, WrapperError.prototype);
    }
}
exports.WrapperError = WrapperError;
class ApiError extends WrapperError {
    constructor(message, statusCode, endpoint, cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
class NotFoundError extends ApiError {
    constructor(endpoint, message = 'Recurso não encontrado') {
        super(message, 404, endpoint);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Registra um erro no sistema de log e opcionalmente no armazenamento
 */
function handleError(error, context) {
    if (error instanceof WrapperError) {
        logger_1.logger.error(`[${context}] ${error.message}`, error.cause);
    }
    else if (error instanceof Error) {
        logger_1.logger.error(`[${context}] ${error.message}`, error);
    }
    else {
        logger_1.logger.error(`[${context}] Erro desconhecido`, error);
    }
    // Aqui poderíamos adicionar código para salvar o erro no Firestore
    // quando estiver configurado
}
/**
 * Função para tentar executar uma operação com retentativas
 */
async function withRetry(operation, maxRetries = 3, retryDelay = 2000, context = 'unknown') {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                const isNotFound = error instanceof NotFoundError ||
                    (error instanceof ApiError && error.statusCode === 404);
                // Não tentar novamente se for um erro de "não encontrado" ou um erro 400 (Bad Request)
                // pois provavelmente é um problema de configuração, não de conectividade
                if (isNotFound || (error instanceof ApiError && error.statusCode === 400)) {
                    logger_1.logger.warn(`[${context}] Erro ${isNotFound ? '404 (Not Found)' : '400 (Bad Request)'}, não tentando novamente.`);
                    if (error instanceof ApiError && error.statusCode === 400) {
                        logger_1.logger.warn(`Possível problema de configuração de API ou parâmetros inválidos para ${context}`);
                    }
                    throw error;
                }
                logger_1.logger.warn(`[${context}] Tentativa ${attempt} falhou, tentando novamente em ${retryDelay}ms`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
            else {
                logger_1.logger.error(`[${context}] Todas as ${maxRetries} tentativas falharam`, error);
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=error-handler.js.map