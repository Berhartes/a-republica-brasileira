/**
 * Módulo de Requisições Avançadas
 * 
 * Este módulo oferece funcionalidades avançadas para requisições HTTP,
 * incluindo retry, tratamento de erros específicos, e monitoramento.
 */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../logging';
import { withRetry, ApiError } from '../logging';

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
export class RequestManager {
  private defaultRetries: number = 3;
  private defaultRetryDelay: number = 1000;

  /**
   * Configura valores padrão para retry
   */
  setDefaults(retries: number, retryDelay: number): void {
    this.defaultRetries = retries;
    this.defaultRetryDelay = retryDelay;
  }

  /**
   * Executa uma requisição GET com retry automático
   */
  async get<T = any>(url: string, config: RequestConfig = {}): Promise<RequestResponse<T>> {
    return this.executeRequest(() => axios.get<T>(url, config), config, 'GET', url);
  }

  /**
   * Executa uma requisição POST com retry automático
   */
  async post<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<RequestResponse<T>> {
    return this.executeRequest(() => axios.post<T>(url, data, config), config, 'POST', url);
  }

  /**
   * Executa uma requisição PUT com retry automático
   */
  async put<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<RequestResponse<T>> {
    return this.executeRequest(() => axios.put<T>(url, data, config), config, 'PUT', url);
  }

  /**
   * Executa uma requisição DELETE com retry automático
   */
  async delete<T = any>(url: string, config: RequestConfig = {}): Promise<RequestResponse<T>> {
    return this.executeRequest(() => axios.delete<T>(url, config), config, 'DELETE', url);
  }

  /**
   * Executa a requisição com retry automático
   */
  private async executeRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    config: RequestConfig,
    method: string,
    url: string
  ): Promise<RequestResponse<T>> {
    const maxRetries = config.maxRetries || this.defaultRetries;
    const retryDelay = config.retryDelay || this.defaultRetryDelay;

    return withRetry(
      async () => {
        try {
          const response = await requestFn();
          return {
            data: response.data,
            status: response.status,
            headers: response.headers
          };
        } catch (error: any) {
          if (error.response) {
            logger.warn(`Erro na requisição ${method} ${url}:`, {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data
            });
          } else {
            logger.error(`Erro de rede na requisição ${method} ${url}:`, error.message);
          }
          throw error;
        }
      },
      maxRetries,
      retryDelay,
      `${method} ${url}`
    );
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
  get: <T = any>(url: string, config?: RequestConfig) => requestManager.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => requestManager.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => requestManager.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: RequestConfig) => requestManager.delete<T>(url, config)
};
