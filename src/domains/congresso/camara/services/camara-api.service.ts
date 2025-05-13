// src/domains/congresso/camara/services/camara-api.service.ts
import { ApiClient } from './api-client';
import { z } from 'zod';
import { 
  deputadoResponseSchema, 
  deputadoDetalhadoResponseSchema,
  despesaResponseSchema,
  DeputadoDetalhado,
  Deputado,
  Despesa 
} from '../schemas';
import { Proposicao, Votacao, Presenca, RequestParams, ApiError } from '../types';
import { Redis } from '@upstash/redis';
import { logger } from '@/core/monitoring/logger';

// Redis client for caching
const redis = new Redis({
  url: import.meta.env.VITE_UPSTASH_REDIS_URL || '',
  token: import.meta.env.VITE_UPSTASH_REDIS_TOKEN || '',
});

// Cache TTL in seconds
const CACHE_TTL = {
  DEPUTADOS: 60 * 60 * 24, // 24 hours
  DEPUTADO: 60 * 60 * 24, // 24 hours
  DESPESAS: 60 * 60 * 24 * 7, // 7 days
  PROPOSICOES: 60 * 60 * 6, // 6 hours
  VOTACOES: 60 * 60 * 6, // 6 hours
};

export class CamaraApiService {
  private client: ApiClient;
  private baseURL: string = 'https://dadosabertos.camara.leg.br/api/v2';
  
  constructor(baseURL?: string) {
    this.baseURL = baseURL || this.baseURL;
    this.client = new ApiClient(this.baseURL);
  }
  
  /**
   * Creates cache key for the given path and params
   */
  private createCacheKey(path: string, params?: RequestParams): string {
    const queryString = params 
      ? Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : '';
    
    return `camara:${path}${queryString ? `:${queryString}` : ''}`;
  }
  
  /**
   * Gets data from cache or fetches from API
   */
  private async getWithCache<T>(
    path: string, 
    schema: z.ZodType<T>, 
    params?: RequestParams, 
    ttl: number = CACHE_TTL.DEPUTADOS
  ): Promise<T> {
    const cacheKey = this.createCacheKey(path, params);
    
    try {
      // Try to get from cache
      const cachedData = await redis.get<T>(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return schema.parse(cachedData);
      }
    } catch (error) {
      logger.warn(`Cache error: ${cacheKey}`, error);
      // Continue with API call if cache fails
    }
    
    logger.debug(`Cache miss: ${cacheKey}`);
    
    // Build query string
    const queryString = params
      ? Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&')
      : '';
    
    // Fetch from API
    const url = `${path}${queryString ? `?${queryString}` : ''}`;
    const data = await this.client.get<T>(url);
    const validatedData = schema.parse(data);
    
    // Save to cache
    try {
      await redis.set(cacheKey, JSON.stringify(validatedData), { ex: ttl });
    } catch (error) {
      logger.warn(`Failed to cache data: ${cacheKey}`, error);
    }
    
    return validatedData;
  }
  
  /**
   * Gets list of deputies with optional filtering
   */
  async getDeputados(params?: {
    ordem?: 'asc' | 'desc';
    ordenarPor?: string;
    siglaUf?: string;
    siglaPartido?: string;
    nome?: string;
    pagina?: number;
    itens?: number;
  }): Promise<Deputado[]> {
    try {
      const response = await this.getWithCache(
        '/deputados',
        deputadoResponseSchema,
        params
      );
      
      return response.dados;
    } catch (error) {
      logger.error('Error fetching deputies:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Gets detailed information about a specific deputy
   */
  async getDeputado(deputadoId: number): Promise<DeputadoDetalhado> {
    try {
      const response = await this.getWithCache(
        `/deputados/${deputadoId}`,
        deputadoDetalhadoResponseSchema,
        undefined,
        CACHE_TTL.DEPUTADO
      );
      
      return response.dados;
    } catch (error) {
      logger.error(`Error fetching deputy ${deputadoId}:`, error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Gets expenses for a specific deputy
   */
  async getDeputadoDespesas(
    deputadoId: number,
    params?: {
      ano?: number;
      mes?: number;
      cnpjCpf?: string;
      itens?: number;
      pagina?: number;
      ordenarPor?: string;
      ordem?: 'asc' | 'desc';
    }
  ): Promise<Despesa[]> {
    try {
      const response = await this.getWithCache(
        `/deputados/${deputadoId}/despesas`,
        despesaResponseSchema,
        params,
        CACHE_TTL.DESPESAS
      );
      
      return response.dados;
    } catch (error) {
      logger.error(`Error fetching deputy ${deputadoId} expenses:`, error);
      throw this.handleError(error);
    }
  }
  
  /**
   * Handles API errors and converts them to ApiError
   */
  private handleError(error: unknown): ApiError {
    if (error instanceof z.ZodError) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data received from API',
        details: error.errors,
      };
    }
    
    if (error instanceof Error) {
      return {
        code: 'API_ERROR',
        message: error.message,
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: error,
    };
  }
}

// Create singleton instance
export const camaraApiService = new CamaraApiService();