import { ApiError } from "./types";
/**
 * Lida com erros da API, transformando AxiosError em um formato ApiError mais simples.
 * @param error - O erro Axios original.
 * @param endpoint - O endpoint que foi chamado (para logging e debug).
 * @returns Um objeto ApiError.
 */
export declare function handleApiError(error: any, endpoint?: string): ApiError;
/**
 * Classe base para erros específicos do wrapper.
 */
export declare class WrapperError extends Error {
    originalError?: any;
    constructor(message: string, originalError?: any);
}
/**
 * Erro para quando um recurso não é encontrado.
 */
export declare class NotFoundError extends WrapperError {
    constructor(resource: string, identifier: string | number, originalError?: any);
}
/**
 * Erro para parâmetros inválidos.
 */
export declare class InvalidParameterError extends WrapperError {
    constructor(parameterName: string, reason: string, originalError?: any);
}
