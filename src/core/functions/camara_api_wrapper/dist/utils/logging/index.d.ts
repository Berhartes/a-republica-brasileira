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
export { logger, LogLevel } from './logger';
export { withRetry, ApiError, NotFoundError, handleError } from './error-handler';
