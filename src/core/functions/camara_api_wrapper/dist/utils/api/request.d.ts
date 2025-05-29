/**
 * Módulo de Requisições Avançadas
 *
 * Este módulo oferece funcionalidades avançadas para requisições HTTP,
 * incluindo retry, tratamento de erros específicos, e monitoramento.
 */
import { AxiosRequestConfig } from 'axios';
/**
 * Interface para configurações de requisição personalizada
 */
export interface RequestConfig extends AxiosRequestConfig {
    maxRetries?: number;
    retryDelay?: number;
    retryCondition?: (error: any) => boolean;
}
/**
 * Interface para resposta de requisição
 */
export interface RequestResponse<T = any> {
    data: T;
    status: number;
    headers: any;
}
/**
 * Classe para gerenciar requisições HTTP avançadas
 */
export declare class RequestManager {
    private defaultRetries;
    private defaultRetryDelay;
    /**
     * Configura valores padrão para retry
     */
    setDefaults(retries: number, retryDelay: number): void;
    /**
     * Executa uma requisição GET com retry automático
     */
    get<T = any>(url: string, config?: RequestConfig): Promise<RequestResponse<T>>;
    /**
     * Executa uma requisição POST com retry automático
     */
    post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<RequestResponse<T>>;
    /**
     * Executa uma requisição PUT com retry automático
     */
    put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<RequestResponse<T>>;
    /**
     * Executa uma requisição DELETE com retry automático
     */
    delete<T = any>(url: string, config?: RequestConfig): Promise<RequestResponse<T>>;
    /**
     * Executa a requisição com retry automático
     */
    private executeRequest;
}
/**
 * Instância padrão do gerenciador de requisições
 */
export declare const requestManager: RequestManager;
/**
 * Funções utilitárias para requisições simples
 */
export declare const request: {
    get: <T = any>(url: string, config?: RequestConfig) => Promise<RequestResponse<T>>;
    post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<RequestResponse<T>>;
    put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<RequestResponse<T>>;
    delete: <T = any>(url: string, config?: RequestConfig) => Promise<RequestResponse<T>>;
};
