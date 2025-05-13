/**
 * Lida com erros da API, transformando AxiosError em um formato ApiError mais simples.
 * @param error - O erro Axios original.
 * @param endpoint - O endpoint que foi chamado (para logging e debug).
 * @returns Um objeto ApiError.
 */
export function handleApiError(error, endpoint) {
    if (axios.isAxiosError(error)) {
        const axiosError = error;
        const status = axiosError.response?.status;
        const responseData = axiosError.response?.data;
        let message = `Erro ao acessar o endpoint: ${endpoint || 'desconhecido'}.`;
        if (responseData) {
            if (typeof responseData === 'string') {
                message = responseData;
            }
            else if (responseData.message) {
                message = responseData.message;
            }
            else if (responseData.Message) { // Algumas APIs usam "Message"
                message = responseData.Message;
            }
            else if (responseData.error) {
                message = responseData.error;
            }
            else if (responseData.Descricao) { // Formato específico da API do Senado em alguns casos
                message = responseData.Descricao;
            }
        }
        if (status) {
            message = `[${status}] ${message}`;
        }
        return {
            message: message,
            status: status,
            code: responseData?.codigo || responseData?.CodigoErro, // Tenta pegar códigos de erro específicos
            details: responseData,
        };
    }
    else {
        // Erro não Axios
        return {
            message: error.message || "Ocorreu um erro desconhecido.",
            details: error,
        };
    }
}
/**
 * Classe base para erros específicos do wrapper.
 */
export class WrapperError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = this.constructor.name;
        this.originalError = originalError;
        Object.setPrototypeOf(this, new.target.prototype); // Mantém a cadeia de protótipos
    }
}
/**
 * Erro para quando um recurso não é encontrado.
 */
export class NotFoundError extends WrapperError {
    constructor(resource, identifier, originalError) {
        super(`Recurso '${resource}' com identificador '${identifier}' não encontrado.`, originalError);
    }
}
/**
 * Erro para parâmetros inválidos.
 */
export class InvalidParameterError extends WrapperError {
    constructor(parameterName, reason, originalError) {
        super(`Parâmetro inválido '${parameterName}': ${reason}`, originalError);
    }
}
// Importar axios para usar isAxiosError
import axios from 'axios';
//# sourceMappingURL=errors.js.map