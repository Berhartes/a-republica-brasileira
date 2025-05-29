/**
 * Sistema de API Unificado
 * 
 * Este módulo oferece uma interface unificada para comunicação com APIs externas,
 * especialmente a API do Senado Federal.
 * 
 * @example
 * ```typescript
 * import { get, replacePath, endpoints, request } from '../utils/api';
 * 
 * // Requisição simples
 * const senadores = await get(endpoints.SENADORES.LISTA_ATUAL.PATH);
 * 
 * // Requisição com parâmetros no path
 * const path = replacePath(endpoints.SENADORES.PERFIL.PATH, { codigo: '12345' });
 * const perfil = await get(path);
 * 
 * // Requisições avançadas com retry
 * const response = await request.get('https://api.example.com/data', {
 *   maxRetries: 5,
 *   retryDelay: 2000
 * });
 * ```
 */

// Cliente de API principal (compatibilidade com código existente)
export { get, replacePath } from './client';

// Endpoints da API do Senado
export { endpoints } from './endpoints';

// Sistema de requisições avançadas
export { 
  request, 
  requestManager, 
  RequestManager, 
  RequestConfig, 
  RequestResponse 
} from './request';
