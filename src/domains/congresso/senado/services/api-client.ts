import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { 
  SENADO_API_BASE_URL, 
  SENADO_API_CONFIG 
} from './api-config';
import { 
  ApiError, 
  NetworkApiError, 
  ServerApiError, 
  ValidationApiError,
  RateLimitApiError
} from '../errors';
import { logger } from '@/app/monitoring';

/**
 * Interface de cliente de API
 */
export interface ApiClient {
  /**
   * Realiza uma requisição GET
   * @param url URL do endpoint
   * @param config Configuração adicional (opcional)
   * @returns Promise com resposta
   */
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  
  /**
   * Realiza uma requisição POST
   * @param url URL do endpoint
   * @param data Dados a serem enviados
   * @param config Configuração adicional (opcional)
   * @returns Promise com resposta
   */
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  
  /**
   * Realiza uma requisição PUT
   * @param url URL do endpoint
   * @param data Dados a serem enviados
   * @param config Configuração adicional (opcional)
   * @returns Promise com resposta
   */
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  
  /**
   * Realiza uma requisição DELETE
   * @param url URL do endpoint
   * @param config Configuração adicional (opcional)
   * @returns Promise com resposta
   */
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

/**
 * Classe de cliente de API para o Senado
 */
export class SenadoApiClient implements ApiClient {
  private axiosInstance: AxiosInstance;
  
  constructor(
    baseURL: string = SENADO_API_BASE_URL,
    config: typeof SENADO_API_CONFIG = SENADO_API_CONFIG
  ) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: config.timeout,
      headers: config.headers
    });
    
    // Configurar interceptors
    this.setupInterceptors(config);
  }
  
  /**
   * Configura interceptors para tratamento de requisições e respostas
   * @param config Configuração da API
   */
  private setupInterceptors(config: typeof SENADO_API_CONFIG): void {
    // Interceptor de requisição
    this.axiosInstance.interceptors.request.use(
      (requestConfig) => {
        logger.debug('API Request:', { 
          url: requestConfig.url, 
          method: requestConfig.method,
          params: requestConfig.params
        });
        return requestConfig;
      },
      (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    // Interceptor de resposta
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug('API Response:', { 
          url: response.config.url, 
          status: response.status
        });
        return response;
      },
      async (error: AxiosError) => {
        return this.handleError(error, config);
      }
    );
  }
  
  /**
   * Trata erros de requisição, implementando retry
   * @param error Erro da requisição
   * @param config Configuração da API
   * @returns Promise rejeitada com erro tratado
   */
  private async handleError(
    error: AxiosError, 
    config: typeof SENADO_API_CONFIG
  ): Promise<never> {
    // Log do erro
    logger.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Verificar se deve realizar retry
    if (
      error.config && 
      error.response?.status && 
      config.retryStatusCodes.includes(error.response.status)
    ) {
      const retryCount = Number(error.config.headers?.['x-retry-count'] || 0);
      
      if (retryCount < config.retries) {
        // Calcular delay com backoff exponencial
        const delay = config.initialRetryDelay * Math.pow(config.backoffFactor, retryCount);
        
        logger.info(`Retry ${retryCount + 1}/${config.retries} for ${error.config.url} in ${delay}ms`);
        
        // Aguardar o delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Incrementar contador de retry
        const newConfig = {
          ...error.config,
          headers: {
            ...error.config.headers,
            'x-retry-count': retryCount + 1
          }
        };
        
        // Realizar nova tentativa
        return this.axiosInstance(newConfig);
      }
    }
    
    // Converter para erro da API
    let apiError: ApiError;
    
    if (!error.response) {
      // Erro de rede
      apiError = new NetworkApiError(
        error.message || 'Erro de conexão com a API',
        { originalError: error.message }
      );
    } else {
      const status = error.response.status;
      const data = error.response.data as Record<string, any>;
      
      switch (status) {
        case 400:
          apiError = new ValidationApiError(
            data?.message || 'Requisição inválida',
            data?.errors || {}
          );
          break;
        case 429:
          const retryAfter = error.response.headers['retry-after'];
          apiError = new RateLimitApiError(
            'Limite de requisições excedido',
            retryAfter ? parseInt(retryAfter) : undefined
          );
          break;
        default:
          apiError = new ServerApiError(
            data?.message || 'Erro no servidor',
            error.message
          );
      }
    }
    
    return Promise.reject(apiError);
  }
  
  /**
   * Realiza uma requisição GET
   * @param url URL do endpoint
   * @param config Configuração adicional (opcional)
   * @returns Promise com resposta
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }
  
  /**
   * Realiza uma requisição POST
   * @param url URL do endpoint
   * @param data Dados a serem enviados
   * @param config Configuração adicional (opcional)
   * @returns Promise com resposta
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }
  
  /**
   * Realiza uma requisição PUT
   * @param url URL do endpoint
   * @param data Dados a serem enviados
   * @param config Configuração adicional (opcional)
   * @returns Promise com resposta
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }
  
  /**
   * Realiza uma requisição DELETE
   * @param url URL do endpoint
   * @param config Configuração adicional (opcional)
   * @returns Promise com resposta
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }
}

/**
 * Instância do cliente de API do Senado
 */
export const senadoApiClient = new SenadoApiClient();
