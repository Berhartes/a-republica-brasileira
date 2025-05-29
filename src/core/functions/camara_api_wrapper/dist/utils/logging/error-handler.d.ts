export declare class WrapperError extends Error {
    readonly cause?: any | undefined;
    constructor(message: string, cause?: any | undefined);
}
export declare class ApiError extends WrapperError {
    readonly statusCode?: number | undefined;
    readonly endpoint?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, endpoint?: string | undefined, cause?: any);
}
export declare class NotFoundError extends ApiError {
    constructor(endpoint: string, message?: string);
}
/**
 * Registra um erro no sistema de log e opcionalmente no armazenamento
 */
export declare function handleError(error: any, context: string): void;
/**
 * Função para tentar executar uma operação com retentativas
 */
export declare function withRetry<T>(operation: () => Promise<T>, maxRetries?: number, retryDelay?: number, context?: string): Promise<T>;
