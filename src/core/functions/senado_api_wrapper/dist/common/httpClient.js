import axios from 'axios';
/**
 * Cliente HTTP genérico para fazer requisições à API.
 */
export class HttpClient {
    constructor(config) {
        this.instance = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 10000, // 10 segundos de timeout padrão
            headers: {
                'Accept': 'application/json', // Por padrão, aceita JSON
                ...(config.headers || {}),
            },
        });
        this.initializeInterceptors();
    }
    initializeInterceptors() {
        this.instance.interceptors.response.use((response) => response.data, // Retorna diretamente os dados da resposta
        (error) => {
            // Aqui pode-se adicionar um tratamento de erro mais robusto no futuro
            // Por exemplo, logar o erro, transformar o erro em um formato padrão, etc.
            console.error('Erro na requisição HTTP:', error.config?.url, error.message, error.response?.status);
            return Promise.reject(error);
        });
    }
    /**
     * Realiza uma requisição GET.
     * @param url - O caminho do endpoint.
     * @param config - Configurações adicionais da requisição (ex: params).
     */
    async get(url, config) {
        return this.instance.get(url, config);
    }
    /**
     * Realiza uma requisição POST.
     * @param url - O caminho do endpoint.
     * @param data - O corpo da requisição.
     * @param config - Configurações adicionais da requisição.
     */
    async post(url, data, config) {
        return this.instance.post(url, data, config);
    }
    /**
     * Realiza uma requisição PUT.
     * @param url - O caminho do endpoint.
     * @param data - O corpo da requisição.
     * @param config - Configurações adicionais da requisição.
     */
    async put(url, data, config) {
        return this.instance.put(url, data, config);
    }
    /**
     * Realiza uma requisição DELETE.
     * @param url - O caminho do endpoint.
     * @param config - Configurações adicionais da requisição.
     */
    async delete(url, config) {
        return this.instance.delete(url, config);
    }
}
//# sourceMappingURL=httpClient.js.map