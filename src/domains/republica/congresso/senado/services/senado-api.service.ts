import { 
  ApiClient, 
  senadoApiClient 
} from './api-client';
import { CacheService as SharedCacheService } from '@/shared/services/cache/cache-service';
import { redisClient, SENADO_CACHE_CONFIG } from './api-config';
import { 
  normalizeSenador, 
  normalizeVotacao, 
  normalizeMateria,
} from '../transformers';
import {
  getSenadoresParamsSchema,
  getVotacoesParamsSchema,
  getMateriasParamsSchema,
  // Importando os tipos diretamente dos schemas
  type Senador,
  type VotacaoSchema as Votacao, // Assumindo que VotacaoSchema é o tipo inferido
  type MateriaSchema as Materia,   // Assumindo que MateriaSchema é o tipo inferido
  type GetSenadoresParams,      // Assumindo que GetSenadoresParams é exportado
  type GetVotacoesParams,       // Assumindo que GetVotacoesParams é exportado
  type GetMateriasParams,       // Assumindo que GetMateriasParams é exportado
  type PaginatedApiResponse    // Adicionada importação para PaginatedApiResponse
} from '../schemas';
// Removida a importação de '../types/index'
import { 
  ServerApiError
} from '../errors';
import {
  PARLAMENTARES_ENDPOINT,
  MATERIAS_ENDPOINT,
  VOTACOES_ENDPOINT,
} from './api-config';
import { logger } from '@/app/monitoring';

/**
 * Serviço de API do Senado
 */
export class SenadoApiService {
  private readonly apiClient: ApiClient;
  private readonly cacheService: SharedCacheService;

  constructor() {
    this.apiClient = senadoApiClient;
    this.cacheService = new SharedCacheService(redisClient, {
      namespace: SENADO_CACHE_CONFIG.keyPrefix,
      defaultTtl: SENADO_CACHE_CONFIG.defaultTTL,
      version: '1.0', // Defina uma versão para o cache
    });
  }

  async getSenadores(params: GetSenadoresParams): Promise<PaginatedApiResponse<Senador>> {
    try {
      const validatedParams = getSenadoresParamsSchema.parse(params);
      const response = await this.apiClient.get<PaginatedApiResponse<Senador>>(
        `${PARLAMENTARES_ENDPOINT}`,
        { params: validatedParams }
      );
      return {
        ...response,
        data: response.data.map(normalizeSenador),
      };
    } catch (error: any) {
      logger.error('Erro ao buscar senadores:', error);
      throw new ServerApiError(
        'Falha ao buscar senadores',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  async getVotacoes(params: GetVotacoesParams): Promise<PaginatedApiResponse<Votacao>> {
    try {
      const validatedParams = getVotacoesParamsSchema.parse(params);
      const response = await this.apiClient.get<PaginatedApiResponse<Votacao>>(
        `${VOTACOES_ENDPOINT}`,
        { params: validatedParams }
      );
      return {
        ...response,
        data: response.data.map(normalizeVotacao),
      };
    } catch (error: any) {
      logger.error('Erro ao buscar votações:', error);
      throw new ServerApiError(
        'Falha ao buscar votações',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  async getMaterias(params: GetMateriasParams): Promise<PaginatedApiResponse<Materia>> {
    try {
      const validatedParams = getMateriasParamsSchema.parse(params);
      const response = await this.apiClient.get<PaginatedApiResponse<Materia>>(
        `${MATERIAS_ENDPOINT}`,
        { params: validatedParams }
      );
      return {
        ...response,
        data: response.data.map(normalizeMateria),
      };
    } catch (error: any) {
      logger.error('Erro ao buscar matérias:', error);
      throw new ServerApiError(
        'Falha ao buscar matérias',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  async buscarSenadoresRanking(criterio: string, limite: number): Promise<any[]> {
    try {
      // Implemente a lógica para buscar o ranking de senadores aqui
      // Adapte a chamada da API e a normalização dos dados conforme necessário
      // Este é apenas um exemplo, substitua com a implementação correta
      const response = await this.apiClient.get<any[]>(
        `${PARLAMENTARES_ENDPOINT}?criterio=${criterio}&limite=${limite}`
      );
      return response;
    } catch (error: any) {
      logger.error('Erro ao buscar ranking de senadores:', error);
      throw new ServerApiError(
        'Falha ao buscar ranking de senadores',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }

  /**
   * Busca todos os senadores
   * @returns Lista de senadores
   */
  async buscarTodosSenadores(): Promise<Senador[]> {
    try {
      const result = await this.getSenadores({
        page: 1,
        limit: 100
      });
      return result.data;
    } catch (error) {
      logger.error('Erro ao buscar todos os senadores:', error);
      throw new ServerApiError(
        'Falha ao buscar todos os senadores',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }
  
  // ... restante do código permanece inalterado ...

  /**
   * Invalida cache de materias
   * @returns Número de chaves invalidadas
   */
  async invalidateMateriasCache(): Promise<number> {
    try {
      return await this.cacheService.invalidateByTags(['materias_lista']);
    } catch (error) {
      logger.error('Erro ao invalidar cache de matérias:', error);
      throw new ServerApiError(
        'Falha ao invalidar cache de matérias',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }
}

/**
 * Instância do serviço de API do Senado
 */
export const senadoApiService = new SenadoApiService();
