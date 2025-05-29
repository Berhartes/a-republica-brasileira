"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.requestManager = exports.RequestManager = void 0;
const tslib_1 = require("tslib");
/**
 * Módulo de Requisições Avançadas
 *
 * Este módulo oferece funcionalidades avançadas para requisições HTTP,
 * incluindo retry, tratamento de erros específicos, e monitoramento.
 */
const axios_1 = tslib_1.__importDefault(require("axios"));
const logging_1 = require("../logging");
const logging_2 = require("../logging");
/**
 * Classe para gerenciar requisições HTTP avançadas
 */
class RequestManager {
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
        return this.executeRequest(() => axios_1.default.get(url, config), config, 'GET', url);
    }
    /**
     * Executa uma requisição POST com retry automático
     */
    async post(url, data, config = {}) {
        return this.executeRequest(() => axios_1.default.post(url, data, config), config, 'POST', url);
    }
    /**
     * Executa uma requisição PUT com retry automático
     */
    async put(url, data, config = {}) {
        return this.executeRequest(() => axios_1.default.put(url, data, config), config, 'PUT', url);
    }
    /**
     * Executa uma requisição DELETE com retry automático
     */
    async delete(url, config = {}) {
        return this.executeRequest(() => axios_1.default.delete(url, config), config, 'DELETE', url);
    }
    /**
     * Executa a requisição com retry automático
     */
    async executeRequest(requestFn, config, method, url) {
        const maxRetries = config.maxRetries || this.defaultRetries;
        const retryDelay = config.retryDelay || this.defaultRetryDelay;
        return (0, logging_2.withRetry)(async () => {
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
                    logging_1.logger.warn(`Erro na requisição ${method} ${url}:`, {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    });
                }
                else {
                    logging_1.logger.error(`Erro de rede na requisição ${method} ${url}:`, error.message);
                }
                throw error;
            }
        }, maxRetries, retryDelay, `${method} ${url}`);
    }
}
exports.RequestManager = RequestManager;
/**
 * Instância padrão do gerenciador de requisições
 */
exports.requestManager = new RequestManager();
/**
 * Funções utilitárias para requisições simples
 */
exports.request = {
    get: (url, config) => exports.requestManager.get(url, config),
    post: (url, data, config) => exports.requestManager.post(url, data, config),
    put: (url, data, config) => exports.requestManager.put(url, data, config),
    delete: (url, config) => exports.requestManager.delete(url, config)
};
//# sourceMappingURL=request.js.map