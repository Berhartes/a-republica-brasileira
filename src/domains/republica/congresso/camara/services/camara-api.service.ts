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
// import { Proposicao, Votacao, Presenca, RequestParams, ApiError } from '../types'; // TODO: Definir schemas para Proposicao, Votacao, Presenca
import { QueryOptions as RequestParams, ErrorResponse as ApiError } from '@shared/types';
// import { Redis } from '@upstash/redis'; // Removido - Usaremos SharedCacheService
import { CacheService as SharedCacheService } from '@/shared/services/cache/cache-service';
import { Redis } from '@upstash/redis'; // Necessário para instanciar SharedCacheService se não injetado

// TODO: Criar schemas Zod para Proposicao, Votacao, Presenca e importar os tipos inferidos
// type Proposicao = any;
// type Votacao = any;
// type Presenca = any;

import { logger } from '@/shared/utils/logger';

// Cache TTL in seconds - pode ser usado para configurar o SharedCacheService ou CacheOptions
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
  private cacheService: SharedCacheService;
  
  constructor(baseURL?: string, sharedCacheServiceInstance?: SharedCacheService) {
    this.baseURL = baseURL || this.baseURL;
    this.client = new ApiClient(this.baseURL);
    // Instanciar SharedCacheService aqui. Idealmente, a instância Redis também seria injetada ou gerenciada centralmente.
    const redisInstance = new Redis({
      url: import.meta.env.VITE_UPSTASH_REDIS_URL || '',
      token: import.meta.env.VITE_UPSTASH_REDIS_TOKEN || '',
    });
    this.cacheService = sharedCacheServiceInstance || new SharedCacheService(
      redisInstance,
      { 
        namespace: 'camara', 
        defaultTtl: CACHE_TTL.DEPUTADOS, // TTL padrão para este namespace
        version: 'v1' 
      }
    );
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
  private async getWithCache<DataType, ApiResponseType extends { dados: DataType }>(
    path: string,
    apiResponseSchema: z.ZodType<ApiResponseType>, // Schema para a resposta completa da API, ex: deputadoResponseSchema
    params?: RequestParams,
    ttl: number = CACHE_TTL.DEPUTADOS // TTL específico para esta chamada
  ): Promise<DataType> { // Retorna DataType (ex: Deputado[])
    const cacheKey = this.createCacheKey(path, params); // Chave para o SharedCacheService

    const data = await this.cacheService.getOrSet<DataType>(
      cacheKey,
      async () => { // Fallback: buscar da API
        logger.debug(`Cache miss, fetching from API: ${cacheKey}`);
        const queryString = params
          ? Object.entries(params)
              .filter(([_, value]) => value !== undefined)
              .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
              .join('&')
          : '';
        const url = `${path}${queryString ? `?${queryString}` : ''}`;
        const rawApiData = await this.client.get<unknown>(url); // Obter como unknown
        
        // Validar a resposta da API e extrair os dados internos
        const parsedApiResponse = apiResponseSchema.parse(rawApiData);
        if (!parsedApiResponse || typeof parsedApiResponse.dados === 'undefined') {
          // Isso pode acontecer se o schema não corresponder ou a API retornar algo inesperado
          logger.error(`API response for ${url} did not match expected schema or missing 'dados' property.`);
          throw new Error(`Invalid API response structure for ${url}.`);
        }
        return parsedApiResponse.dados; 
      },
      {
        ttl: ttl, // Usar o TTL passado ou o default da instância
        tags: [`camara_data`, `path:${path.replace(/\//g, '_')}`] // Tags genéricas, normalizando path
      }
    );
    // A validação do tipo DataType já ocorreu dentro do fallback pelo apiResponseSchema.parse().dados
    return data;
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
      const queryOptions: RequestParams | undefined = params ? {
        page: params.pagina,
        pageSize: params.itens,
        filter: {
          ...(params.siglaUf && { siglaUf: params.siglaUf }),
          ...(params.siglaPartido && { siglaPartido: params.siglaPartido }),
          ...(params.nome && { nome: params.nome }),
        },
        ...(params.ordenarPor && params.ordem && {
          sort: {
            field: params.ordenarPor,
            direction: params.ordem,
          }
        }),
      } : undefined;

      // DataType é Deputado[], ApiResponseType é z.infer<typeof deputadoResponseSchema>
      return await this.getWithCache<Deputado[], z.infer<typeof deputadoResponseSchema>>(
        '/deputados',
        deputadoResponseSchema,
        queryOptions,
        CACHE_TTL.DEPUTADOS // Passando o TTL específico
      );
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
      // DataType é DeputadoDetalhado, ApiResponseType é z.infer<typeof deputadoDetalhadoResponseSchema>
      return await this.getWithCache<DeputadoDetalhado, z.infer<typeof deputadoDetalhadoResponseSchema>>(
        `/deputados/${deputadoId}`,
        deputadoDetalhadoResponseSchema,
        undefined,
        CACHE_TTL.DEPUTADO
      );
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
      const queryOptions: RequestParams | undefined = params ? {
        page: params.pagina,
        pageSize: params.itens,
        filter: {
          ...(params.ano && { ano: params.ano }),
          ...(params.mes && { mes: params.mes }),
          ...(params.cnpjCpf && { cnpjCpfFornecedor: params.cnpjCpf }),
        },
        ...(params.ordenarPor && params.ordem && {
          sort: {
            field: params.ordenarPor,
            direction: params.ordem,
          }
        }),
      } : undefined;

      // DataType é Despesa[], ApiResponseType é z.infer<typeof despesaResponseSchema>
      return await this.getWithCache<Despesa[], z.infer<typeof despesaResponseSchema>>(
        `/deputados/${deputadoId}/despesas`,
        despesaResponseSchema,
        queryOptions,
        CACHE_TTL.DESPESAS
      );
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
