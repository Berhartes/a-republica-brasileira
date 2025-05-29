/**
 * Cliente HTTP para a API da Câmara dos Deputados
 *
 * Fornece uma interface unificada para fazer requisições à API
 * com retry automático, rate limiting e tratamento de erros.
 */
import { AxiosRequestConfig } from 'axios';
/**
 * Configuração de requisição
 */
export interface RequestConfig extends AxiosRequestConfig {
    retries?: number;
    timeout?: number;
    context?: string;
}
/**
 * Cliente HTTP para API da Câmara
 */
declare class CamaraAPIClient {
    private client;
    private requestCount;
    private lastRequestTime;
    constructor();
    /**
     * Configura interceptors do axios
     */
    private setupInterceptors;
    /**
     * Aplica rate limiting
     */
    private enforceRateLimit;
    /**
     * Requisição GET com retry
     */
    get(url: string, params?: any, config?: RequestConfig): Promise<any>;
    /**
     * Requisição POST com retry
     */
    post(url: string, data?: any, config?: RequestConfig): Promise<any>;
    /**
     * Processa resposta da API
     */
    private processResponse;
    /**
     * Requisição com paginação automática
     */
    getAllPages(url: string, params?: any, config?: RequestConfig & {
        maxPages?: number;
        pageParam?: string;
        itemsParam?: string;
    }): Promise<any[]>;
    /**
     * Verifica conectividade com a API
     */
    checkConnectivity(): Promise<boolean>;
    /**
     * Obtém estatísticas do cliente
     */
    getStats(): {
        requestCount: number;
        lastRequestTime: number;
        baseURL: string;
    };
    /**
     * Reset das estatísticas
     */
    resetStats(): void;
}
/**
 * Instância singleton do cliente
 */
export declare const apiClient: CamaraAPIClient;
/**
 * Funções de conveniência
 */
/**
 * Requisição GET simples
 */
export declare function get(url: string, params?: any, config?: RequestConfig): Promise<any>;
/**
 * Requisição POST simples
 */
export declare function post(url: string, data?: any, config?: RequestConfig): Promise<any>;
/**
 * Substitui placeholders em URLs
 */
export declare function replacePath(pathTemplate: string, params: Record<string, string>): string;
/**
 * Valida resposta da API
 */
export declare function validateResponse(response: any, expectedFields?: string[]): boolean;
/**
 * Utilitários de URL
 */
export declare const urlUtils: {
    /**
     * Constrói URL com parâmetros
     */
    buildUrl(path: string, params?: Record<string, any>): string;
    /**
     * Extrai parâmetros de URL
     */
    parseUrl(url: string): {
        path: string;
        params: Record<string, string>;
    };
    /**
     * Valida URL
     */
    isValidUrl(url: string): boolean;
};
/**
 * Utilitários de resposta
 */
export declare const responseUtils: {
    /**
     * Extrai dados de resposta paginada
     */
    extractPagedData(response: any): {
        dados: any[];
        links?: any;
        pagination?: any;
    };
    /**
     * Extrai número da página de URL
     */
    extractPageFromUrl(url: string): number;
    /**
     * Verifica se resposta tem mais páginas
     */
    hasMorePages(response: any): boolean;
    /**
     * Conta total de itens estimado
     */
    estimateTotal(response: any, currentPage: number, itemsPerPage: number): number;
};
export {};
