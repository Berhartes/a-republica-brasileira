"use strict";
/**
 * Sistema de Logging Unificado
 *
 * Este módulo oferece uma interface unificada para logging e tratamento de erros.
 *
 * @example
 * ```typescript
 * import { logger, LogLevel, withRetry, ApiError } from '../utils/logging';
 *
 * // Configurar nível de log
 * logger.setLevel(LogLevel.DEBUG);
 *
 * // Usar logging
 * logger.info('Processamento iniciado');
 * logger.error('Erro na requisição', error);
 *
 * // Usar retry com tratamento de erros
 * const resultado = await withRetry(async () => {
 *   // operação que pode falhar
 * }, 3, 1000, 'Operação crítica');
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.NotFoundError = exports.ApiError = exports.withRetry = exports.LogLevel = exports.logger = void 0;
// Exportar tudo do logger
var logger_1 = require("./logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logger_1.LogLevel; } });
// Exportar tudo do error handler
var error_handler_1 = require("./error-handler");
Object.defineProperty(exports, "withRetry", { enumerable: true, get: function () { return error_handler_1.withRetry; } });
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return error_handler_1.ApiError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return error_handler_1.NotFoundError; } });
Object.defineProperty(exports, "handleError", { enumerable: true, get: function () { return error_handler_1.handleError; } });
//# sourceMappingURL=index.js.map