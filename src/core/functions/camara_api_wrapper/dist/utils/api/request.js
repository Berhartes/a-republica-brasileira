/**
 * Módulo de Requisições Avançadas
 *
 * Este módulo oferece funcionalidades avançadas para requisições HTTP,
 * incluindo retry, tratamento de erros específicos, e monitoramento.
 */
import axios from 'axios';
import { logger } from '../logging';
import { withRetry } from '../logging';
/**
 * Classe para gerenciar requisições HTTP avançadas
 */
export class RequestManager {
    constructor() {
        this.defaultRetries = 3;
        this.defaultRetryDelay = 1000;
    }
    /**
     * Configura valores padrão para retry
     */
    setDefaults(retries, retryDelay) {
        this.defaultRetries = retries;
        this.defaultRetryDelay = retryDelay;
    }
    /**
     * Executa uma requisição GET com retry automático
     */
    async get(url, config = {}) {
        return this.executeRequest(() => axios.get(url, config), config, 'GET', url);
    }
    /**
     * Executa uma requisição POST com retry automático
     */
    async post(url, data, config = {}) {
        return this.executeRequest(() => axios.post(url, data, config), config, 'POST', url);
    }
    /**
     * Executa uma requisição PUT com retry automático
     */
    async put(url, data, config = {}) {
        return this.executeRequest(() => axios.put(url, data, config), config, 'PUT', url);
    }
    /**
     * Executa uma requisição DELETE com retry automático
     */
    async delete(url, config = {}) {
        return this.executeRequest(() => axios.delete(url, config), config, 'DELETE', url);
    }
    /**
     * Executa a requisição com retry automático
     */
    async executeRequest(requestFn, config, method, url) {
        const maxRetries = config.maxRetries || this.defaultRetries;
        const retryDelay = config.retryDelay || this.defaultRetryDelay;
        return withRetry(async () => {
            try {
                const response = await requestFn();
                return {
                    data: response.data,
                    status: response.status,
                    headers: response.headers
                };
            }
            catch (error) {
                if (error.response) {
                    logger.warn(`Erro na requisição ${method} ${url}:`, {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    });
                }
                else {
                    logger.error(`Erro de rede na requisição ${method} ${url}:`, error.message);
                }
                throw error;
            }
        }, maxRetries, retryDelay, `${method} ${url}`);
    }
}
/**
 * Instância padrão do gerenciador de requisições
 */
export const requestManager = new RequestManager();
/**
 * Funções utilitárias para requisições simples
 */
export const request = {
    get: (url, config) => requestManager.get(url, config),
    post: (url, data, config) => requestManager.post(url, data, config),
    put: (url, data, config) => requestManager.put(url, data, config),
    delete: (url, config) => requestManager.delete(url, config)
};
//# sourceMappingURL=request.js.map