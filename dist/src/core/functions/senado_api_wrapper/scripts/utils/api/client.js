"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.replacePath = replacePath;
const tslib_1 = require("tslib");
/**
 * Utilitário para requisições à API do Senado
 */
const axios_1 = tslib_1.__importDefault(require("axios"));
const endpoints_1 = require("./endpoints");
const logging_1 = require("../logging");
const logging_2 = require("../logging");
// Cria instância do Axios com configurações padrão
const api = axios_1.default.create({
    baseURL: endpoints_1.endpoints.BASE_URL,
    timeout: endpoints_1.endpoints.REQUEST.TIMEOUT,
    headers: {
        'Accept': 'application/json'
    }
});
/**
 * Realiza requisição GET para a API do Senado
 */
async function get(path, params = {}) {
    return (0, logging_2.withRetry)(async () => {
        try {
            const config = {
                params: {
                    ...params
                }
            };
            logging_1.logger.debug(`Requisição GET para ${path}`, {
                params,
                url: `${endpoints_1.endpoints.BASE_URL}${path}`,
                headers: { 'Accept': 'application/json' }
            });
            const response = await api.get(path, config);
            return response.data;
        }
        catch (error) {
            if (error.response) {
                if (error.response.status === 404) {
                    throw new logging_2.NotFoundError(path);
                }
                throw new logging_2.ApiError(`Erro na requisição: ${error.response.status} - ${error.response.statusText}`, error.response.status, path, error);
            }
            // Para erros sem response (timeout, network error, etc)
            if (error.request) {
                logging_1.logger.error(`Erro na requisição sem resposta para ${path}`, {
                    error: error.message,
                    code: error.code,
                    config: error.config
                });
            }
            throw new logging_2.ApiError(`Erro na requisição: ${error.message}`, undefined, path, error);
        }
    }, endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `GET ${path}`);
}
/**
 * Substitui parâmetros no caminho da URL
 * Exemplo: substituir "{codigo}" em "/rota/{codigo}" por "123"
 */
function replacePath(path, params) {
    let result = path;
    Object.entries(params).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        result = result.replace(placeholder, String(value));
    });
    return result;
}
//# sourceMappingURL=client.js.map