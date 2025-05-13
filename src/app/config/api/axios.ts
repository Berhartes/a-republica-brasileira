import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger } from '@/core/monitoring';

/**
 * Configuração do cliente Axios para APIs
 */
export interface ApiClientConfig extends AxiosRequestConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  withCredentials?: boolean;
  validateStatus?: (status: number) => boolean;
}

/**
 * Resposta de erro padronizada da API
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Cria e configura uma instância do Axios com interceptors padrão
 * @param config Configuração do cliente API
 * @returns Instância configurada do Axios
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const instance = axios.create({
    timeout: 30000,
    retryDelay: 1000,
    retries: 3,
    validateStatus: (status) => status >= 200 && status < 300,
    ...config,
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Adiciona cabeçalhos comuns
      const headers = new axios.AxiosHeaders(config.headers);
      headers.set('Content-Type', 'application/json');
      headers.set('X-Client-Version', import.meta.env.VITE_APP_VERSION || '1.0.0');
      config.headers = headers;

      return config;
    },
    (error) => {
      logger.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;
      
      // @ts-ignore - Adicionamos esta propriedade na configuração Axios
      const retries = originalRequest?.retries || 0;
      // @ts-ignore
      const currentRetry = originalRequest?.__retryCount || 0;
      // @ts-ignore
      const retryDelay = originalRequest?.retryDelay || 1000;

      // Se ainda temos tentativas disponíveis e o erro é passível de retry
      // @ts-ignore
      if (currentRetry < retries && isRetryableError(error) && originalRequest) {
        // @ts-ignore
        originalRequest.__retryCount = currentRetry + 1;
        
        logger.info(`Retrying request (${currentRetry + 1}/${retries})...`);
        
        // Espera antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        return instance(originalRequest);
      }

      // Formata o erro para um formato padrão
      const apiError = formatApiError(error);
      logger.error('API error:', apiError);
      
      return Promise.reject(apiError);
    }
  );

  return instance;
}

/**
 * Verifica se um erro pode ser tentado novamente
 */
function isRetryableError(error: AxiosError): boolean {
  // Erros de rede, timeout ou 5xx são retentáveis
  return (
    !error.response ||
    error.code === 'ECONNABORTED' ||
    (error.response && error.response.status >= 500)
  );
}

/**
 * Formata um erro do Axios para um formato padronizado
 */
function formatApiError(error: AxiosError): ApiErrorResponse {
  // Verifica se é um erro de rede
  if (!error.response) {
    return {
      code: error.code || 'NETWORK_ERROR',
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
    };
  }

  // Erro de resposta da API
  const { status, data } = error.response;

  // Se a API retornou um erro estruturado
  if (data && typeof data === 'object' && 'message' in data) {
    return {
      code: (data as any).code || `HTTP_${status}`,
      message: (data as any).message as string,
      details: (data as any).details,
    };
  }

  // Erro genérico baseado no status HTTP
  return {
    code: `HTTP_${status}`,
    message: getDefaultErrorMessage(status),
  };
}

/**
 * Obtém uma mensagem de erro padrão baseada no status HTTP
 */
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Requisição inválida.';
    case 401:
      return 'Não autorizado. Faça login e tente novamente.';
    case 403:
      return 'Acesso negado.';
    case 404:
      return 'Recurso não encontrado.';
    case 408:
      return 'Tempo limite de requisição excedido.';
    case 429:
      return 'Muitas requisições. Tente novamente mais tarde.';
    case 500:
      return 'Erro interno do servidor.';
    case 502:
      return 'Gateway inválido.';
    case 503:
      return 'Serviço indisponível.';
    case 504:
      return 'Tempo limite do gateway excedido.';
    default:
      return `Erro inesperado (${status}).`;
  }
}