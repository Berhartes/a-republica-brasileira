/**
 * Cliente HTTP para a API da Câmara dos Deputados
 *
 * Fornece uma interface unificada para fazer requisições à API
 * com retry automático, rate limiting e tratamento de erros.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../logging';
import { withRetry, handleError } from '../logging/error-handler';
import { apiConfig } from '../../config/etl.config';
import { environmentConfig } from '../../config/environment.config';

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
class CamaraAPIClient {
  private client: AxiosInstance;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor() {
    this.client = axios.create({
      baseURL: environmentConfig.CAMARA_API_BASE_URL,
      timeout: environmentConfig.CAMARA_API_TIMEOUT,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ETL-Camara-v2.0/Node.js'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Configura interceptors do axios
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Rate limiting
        this.enforceRateLimit();

        // Log da requisição
        const fullUrl = `${config.baseURL}${config.url}`;
        console.log(`🌐 API Request: ${config.method?.toUpperCase() || 'GET'} ${fullUrl}`);
        console.log(`📋 Params:`, config.params);

        // Comentado temporariamente devido a erro no logger
        // if (environmentConfig.LOG_API_REQUESTS) {
        //   logger.apiRequest(
        //     config.method?.toUpperCase() || 'GET',
        //     fullUrl,
        //     config.params
        //   );
        // }

        return config;
      },
      (error) => {
        logger.error(`❌ Erro na configuração da requisição: ${error.message}`);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - this.lastRequestTime;

        if (environmentConfig.LOG_API_RESPONSES) {
          logger.apiResponse(
            response.config.url || '',
            response.status,
            duration
          );
        }

        return response;
      },
      (error) => {
        const duration = Date.now() - this.lastRequestTime;

        if (error.response) {
          logger.apiResponse(
            error.config?.url || '',
            error.response.status,
            duration
          );
        } else {
          logger.error(`❌ Erro de rede: ${error.message}`);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Aplica rate limiting
   */
  private enforceRateLimit(): void {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / apiConfig.rateLimit.requestsPerSecond;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      // Usar setTimeout síncrono para pausar
      const start = Date.now();
      while (Date.now() - start < waitTime) {
        // Busy wait (não ideal, mas simples)
      }
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Requisição GET com retry
   */
  async get(url: string, params?: any, config?: RequestConfig): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      method: 'GET',
      url,
      params,
      timeout: config?.timeout || apiConfig.timeouts.default,
      ...config
    };

    const context = config?.context || `GET ${url}`;
    const retries = config?.retries || apiConfig.retryConfig.attempts;

    return withRetry(
      async () => {
        const response = await this.client.request(requestConfig);
        return this.processResponse(response);
      },
      retries,
      apiConfig.retryConfig.delay,
      context
    );
  }

  /**
   * Requisição POST com retry
   */
  async post(url: string, data?: any, config?: RequestConfig): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      method: 'POST',
      url,
      data,
      timeout: config?.timeout || apiConfig.timeouts.default,
      ...config
    };

    const context = config?.context || `POST ${url}`;
    const retries = config?.retries || apiConfig.retryConfig.attempts;

    return withRetry(
      async () => {
        const response = await this.client.request(requestConfig);
        return this.processResponse(response);
      },
      retries,
      apiConfig.retryConfig.delay,
      context
    );
  }

  /**
   * Processa resposta da API
   */
  private processResponse(response: AxiosResponse): any {
    if (!response.data) {
      throw new Error('Resposta vazia da API');
    }

    // A API da Câmara retorna dados em diferentes formatos
    // Padronizar resposta
    if (typeof response.data === 'object') {
      return response.data;
    }

    // Se for string, tentar fazer parse JSON
    if (typeof response.data === 'string') {
      try {
        return JSON.parse(response.data);
      } catch (error) {
        throw new Error('Resposta da API não é um JSON válido');
      }
    }

    return response.data;
  }

  /**
   * Requisição com paginação automática
   */
  async getAllPages(
    url: string,
    params: any = {},
    config?: RequestConfig & {
      maxPages?: number;
      pageParam?: string;
      itemsParam?: string;
    }
  ): Promise<any[]> {
    const results: any[] = [];
    let currentPage = 1;
    const maxPages = config?.maxPages || 100;
    const pageParam = config?.pageParam || 'pagina';
    const itemsParam = config?.itemsParam || 'itens';

    logger.info(`📄 Iniciando extração paginada de ${url}`);

    while (currentPage <= maxPages) {
      try {
        const pageParams = {
          ...params,
          [pageParam]: currentPage,
          [itemsParam]: params[itemsParam] || 100
        };

        const response = await this.get(url, pageParams, {
          ...config,
          context: `${config?.context || url} - página ${currentPage}`
        });

        if (!response.dados || !Array.isArray(response.dados)) {
          break;
        }

        const items = response.dados;
        if (items.length === 0) {
          break;
        }

        results.push(...items);
        logger.debug(`📄 Página ${currentPage}: ${items.length} itens (total: ${results.length})`);

        // Se retornou menos itens que o solicitado, é a última página
        if (items.length < pageParams[itemsParam]) {
          break;
        }

        currentPage++;

        // Pausa entre páginas
        await new Promise(resolve => setTimeout(resolve, apiConfig.retryConfig.delay));

      } catch (error: any) {
        logger.error(`❌ Erro na página ${currentPage}: ${error.message}`);
        break;
      }
    }

    logger.info(`✅ Extração paginada concluída: ${results.length} itens em ${currentPage - 1} páginas`);
    return results;
  }

  /**
   * Verifica conectividade com a API
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Fazer uma requisição simples para testar conectividade
      await this.get('/referencias/partidos', {}, {
        timeout: 5000,
        retries: 1,
        context: 'Teste de conectividade'
      });

      return true;
    } catch (error: any) { // Explicitly type error as any
      logger.error(`❌ Falha na conectividade com a API: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtém estatísticas do cliente
   */
  getStats(): {
    requestCount: number;
    lastRequestTime: number;
    baseURL: string;
  } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      baseURL: this.client.defaults.baseURL || ''
    };
  }

  /**
   * Reset das estatísticas
   */
  resetStats(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

/**
 * Instância singleton do cliente
 */
export const apiClient = new CamaraAPIClient();

/**
 * Funções de conveniência
 */

/**
 * Requisição GET simples
 */
export async function get(url: string, params?: any, config?: RequestConfig): Promise<any> {
  return apiClient.get(url, params, config);
}

/**
 * Requisição POST simples
 */
export async function post(url: string, data?: any, config?: RequestConfig): Promise<any> {
  return apiClient.post(url, data, config);
}

/**
 * Substitui placeholders em URLs
 */
export function replacePath(pathTemplate: string, params: Record<string, string>): string {
  let path = pathTemplate;

  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, encodeURIComponent(value));
  }

  return path;
}

/**
 * Valida resposta da API
 */
export function validateResponse(response: any, expectedFields?: string[]): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (expectedFields) {
    for (const field of expectedFields) {
      if (!(field in response)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Utilitários de URL
 */
export const urlUtils = {
  /**
   * Constrói URL com parâmetros
   */
  buildUrl(path: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return path;
    }

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `${path}?${queryString}` : path;
  },

  /**
   * Extrai parâmetros de URL
   */
  parseUrl(url: string): { path: string; params: Record<string, string> } {
    const [path, queryString] = url.split('?');
    const params: Record<string, string> = {};

    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }

    return { path, params };
  },

  /**
   * Valida URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Utilitários de resposta
 */
export const responseUtils = {
  /**
   * Extrai dados de resposta paginada
   */
  extractPagedData(response: any): {
    dados: any[];
    links?: any;
    pagination?: any
  } {
    return {
      dados: response.dados || [],
      links: response.links,
      pagination: {
        currentPage: response.links?.self ? this.extractPageFromUrl(response.links.self) : 1,
        hasNext: !!response.links?.next,
        hasPrev: !!response.links?.prev
      }
    };
  },

  /**
   * Extrai número da página de URL
   */
  extractPageFromUrl(url: string): number {
    const match = url.match(/[?&]pagina=(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  },

  /**
   * Verifica se resposta tem mais páginas
   */
  hasMorePages(response: any): boolean {
    return !!(response.links && response.links.next);
  },

  /**
   * Conta total de itens estimado
   */
  estimateTotal(response: any, currentPage: number, itemsPerPage: number): number {
    if (response.dados && Array.isArray(response.dados)) {
      const currentCount = response.dados.length;

      // Se página não está cheia, é a última
      if (currentCount < itemsPerPage) {
        return ((currentPage - 1) * itemsPerPage) + currentCount;
      }

      // Estimativa baseada em links de paginação
      if (response.links && response.links.last) {
        const lastPage = this.extractPageFromUrl(response.links.last);
        return lastPage * itemsPerPage;
      }
    }

    return 0;
  }
};
