/**
 * Utilitário para requisições à API do Senado
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { endpoints } from '../config/endpoints';
import { logger } from './logger';
import { withRetry, ApiError, NotFoundError } from './error_handler';

// Cria instância do Axios com configurações padrão
const api: AxiosInstance = axios.create({
  baseURL: endpoints.BASE_URL,
  timeout: endpoints.REQUEST.TIMEOUT,
  headers: {
    'Accept': 'application/json'
  }
});

/**
 * Realiza requisição GET para a API do Senado
 */
export async function get<T = any>(path: string, params: any = {}): Promise<T> {
  return withRetry(
    async () => {
      try {
        const config: AxiosRequestConfig = { 
          params: {
            ...params
          }
        };
        
        logger.debug(`Requisição GET para ${path}`, {
          params,
          url: `${endpoints.BASE_URL}${path}`,
          headers: { 'Accept': 'application/json' }
        });
        
        const response = await api.get<T>(path, config);
        return response.data;
      } catch (error: any) {
        if (error.response) {
          if (error.response.status === 404) {
            throw new NotFoundError(path);
          }
          
          throw new ApiError(
            `Erro na requisição: ${error.response.status} - ${error.response.statusText}`,
            error.response.status,
            path,
            error
          );
        }
        
        // Para erros sem response (timeout, network error, etc)
        if (error.request) {
          logger.error(`Erro na requisição sem resposta para ${path}`, { 
            error: error.message,
            code: error.code,
            config: error.config
          });
        }
        
        throw new ApiError(`Erro na requisição: ${error.message}`, undefined, path, error);
      }
    },
    endpoints.REQUEST.RETRY_ATTEMPTS,
    endpoints.REQUEST.RETRY_DELAY,
    `GET ${path}`
  );
}

/**
 * Substitui parâmetros no caminho da URL
 * Exemplo: substituir "{codigo}" em "/rota/{codigo}" por "123"
 */
export function replacePath(path: string, params: Record<string, string | number>): string {
  let result = path;
  
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(placeholder, String(value));
  });
  
  return result;
}
