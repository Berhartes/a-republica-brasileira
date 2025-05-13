/**
 * Tipos relacionados a APIs e comunicação HTTP
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Estende a configuração do Axios para incluir opções adicionais
 */
export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
  __retryCount?: number;
}

/**
 * Tipo genérico para response de API
 */
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
  links?: {
    self: string;
    next?: string;
    previous?: string;
  };
  meta?: {
    count: number;
    total: number;
    page: number;
    pageCount: number;
  };
}

/**
 * Tipo para erro de API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
}

/**
 * Tipo para opções de cache de API
 */
export interface ApiCacheOptions {
  enabled?: boolean;
  ttl?: number;
  staleWhileRevalidate?: boolean;
  tags?: string[];
}

/**
 * Tipo para parâmetros de paginação
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Tipo para resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    count: number;
    total: number;
    page: number;
    pageCount: number;
  };
}

/**
 * Tipo para parâmetros de ordenação
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Tipo para parâmetros de filtro
 */
export interface FilterParams {
  [key: string]: string | number | boolean | null | undefined | string[];
}

/**
 * Tipo para cabeçalhos HTTP customizados
 */
export interface CustomHeaders {
  [key: string]: string;
}