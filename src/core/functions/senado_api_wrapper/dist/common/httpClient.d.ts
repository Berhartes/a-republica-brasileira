import { AxiosRequestConfig } from 'axios';
/**
 * Configurações para o cliente HTTP.
 */
export interface HttpClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}
/**
 * Cliente HTTP genérico para fazer requisições à API.
 */
export declare class HttpClient {
    private instance;
    constructor(config: HttpClientConfig);
    private initializeInterceptors;
    /**
     * Realiza uma requisição GET.
     * @param url - O caminho do endpoint.
     * @param config - Configurações adicionais da requisição (ex: params).
     */
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Realiza uma requisição POST.
     * @param url - O caminho do endpoint.
     * @param data - O corpo da requisição.
     * @param config - Configurações adicionais da requisição.
     */
    post<T = any, R = any>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R>;
    /**
     * Realiza uma requisição PUT.
     * @param url - O caminho do endpoint.
     * @param data - O corpo da requisição.
     * @param config - Configurações adicionais da requisição.
     */
    put<T = any, R = any>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R>;
    /**
     * Realiza uma requisição DELETE.
     * @param url - O caminho do endpoint.
     * @param config - Configurações adicionais da requisição.
     */
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
