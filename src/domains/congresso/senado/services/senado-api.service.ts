import { 
    ApiClient, 
    senadoApiClient 
  } from './api-client';
  import { 
    CacheService, 
    cacheService 
  } from './cache-service';
  import { 
    normalizeSenador, 
    normalizeSenadorDetalhado, 
    normalizeVotacao, 
    normalizeMateria,
    formatDateToApi
  } from '../transformers';
  import {
    senadorSchema,
    senadorDetalhadoSchema,
    votacaoSchema,
    materiaSchema,
    despesaSchema,
    presencaSchema,
    getSenadoresParamsSchema,
    getVotacoesParamsSchema,
    getMateriasParamsSchema,
    getDespesasParamsSchema,
    paginationSchema
  } from '../schemas';
  import {
    Senador,
    SenadorDetalhado,
    Votacao,
    Materia,
    Despesa,
    Presenca,
    GetSenadoresParams,
    GetVotacoesParams,
    GetMateriasParams,
    GetDespesasParams,
    PaginationParams,
    PaginatedResponse
  } from '../types/index';
  import { 
    ServerApiError, 
    NotFoundApiError 
  } from '../errors';
  import {
    PARLAMENTARES_ENDPOINT,
    MATERIAS_ENDPOINT,
    VOTACOES_ENDPOINT,
    DESPESAS_ENDPOINT,
    PRESENCAS_ENDPOINT,
    SENADO_CACHE_CONFIG
  } from './api-config';
  import { z } from 'zod';
import { logger } from '@/app/monitoring';
  
  /**
   * Serviço de API do Senado
   */
  export class SenadoApiService {
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
    
    /**
     * Limpa o cache da API
     */
    limparCache(): void {
      try {
        this.cacheService.invalidatePattern('senadores:*');
        this.cacheService.invalidatePattern('senador:*');
        this.cacheService.invalidatePattern('votacoes:*');
        this.cacheService.invalidatePattern('materias:*');
        logger.info('Cache limpo com sucesso');
      } catch (error) {
        logger.error('Erro ao limpar cache:', error);
      }
    }
    
    /**
     * Busca senadores para ranking
     * @param criterio Critério de ordenação
     * @param limite Limite de resultados
     * @returns Lista de senadores ordenada
     */
    async buscarSenadoresRanking(criterio: string, limite: number): Promise<Senador[]> {
      try {
        const senadores = await this.buscarTodosSenadores();
        
        // Implementar ordenação baseada no critério
        if (criterio === 'presenca') {
          // Ordenar por presença (exemplo)
          return senadores.slice(0, limite);
        } else if (criterio === 'gastos') {
          // Ordenar por gastos (exemplo)
          return senadores.slice(0, limite);
        } else if (criterio === 'proposicoes') {
          // Ordenar por proposições (exemplo)
          return senadores.slice(0, limite);
        } else {
          // Ordenação padrão
          return senadores.slice(0, limite);
        }
      } catch (error) {
        logger.error(`Erro ao buscar senadores para ranking (${criterio}):`, error);
        throw new ServerApiError(
          'Falha ao buscar senadores para ranking',
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    private readonly apiClient: ApiClient;
  private readonly cacheService: CacheService;
    
  constructor(
    apiClient: ApiClient = senadoApiClient,
    cacheService2: CacheService = cacheService
  ) {
    this.apiClient = apiClient;
    this.cacheService = cacheService2;
    }
    
    /**
     * Gera chave de cache com base em parâmetros
     * @param base Base da chave
     * @param params Parâmetros para formar a chave
     * @returns Chave de cache formatada
     */
    private createCacheKey(base: string, params?: Record<string, any>): string {
      if (!params || Object.keys(params).length === 0) {
        return base;
      }
      
      // Ordenar e formatar parâmetros
      const formattedParams = Object.entries(params)
        .filter(([_, value]) => value != null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
        
      return `${base}?${formattedParams}`;
    }
    
    /**
     * Obtém TTL adequado para o tipo de entidade
     * @param entityType Tipo de entidade
     * @returns TTL em ms
     */
    private getTTL(entityType: keyof typeof SENADO_CACHE_CONFIG.ttlByEntity): number {
      return SENADO_CACHE_CONFIG.ttlByEntity[entityType] || SENADO_CACHE_CONFIG.defaultTTL;
    }
    
    /**
     * Realiza paginação no array de dados
     * @param data Array completo de dados
     * @param pagination Parâmetros de paginação
     * @returns Objeto com resultado paginado
     */
    private paginateResults<T>(data: T[], pagination: PaginationParams): PaginatedResponse<T> {
      const { page, limit } = pagination;
      const total = data.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedData = data.slice(startIndex, endIndex);
      
      return {
        data: paginatedData,
        pagination: {
          page,
          pageSize: limit,
          total,
          totalPages
        }
      };
    }
    
    /**
     * Obtém lista de senadores
     * @param params Parâmetros de consulta (opcional)
     * @returns Lista paginada de senadores
     */
    async getSenadores(params?: GetSenadoresParams): Promise<PaginatedResponse<Senador>> {
      // Validar parâmetros
      const validParams = params
        ? getSenadoresParamsSchema.parse(params)
        : paginationSchema.parse({});
        
      const { page, limit, ...filters } = validParams;
      
      // Criar chave de cache
      const cacheKey = this.createCacheKey('senadores', filters);
      
      try {
        // Obter ou definir cache
        const senadores = await this.cacheService.getOrSet<Senador[]>(
          cacheKey,
          async (): Promise<Senador[]> => {
            const response = await this.apiClient.get<any>(`${PARLAMENTARES_ENDPOINT}/lista/atual`);
            
            // Extrair e normalizar senadores
            const parlamentares = response.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
            
            if (!Array.isArray(parlamentares)) {
              throw new ServerApiError('Formato de resposta inválido');
            }
            
            return parlamentares.map(parlamentar => normalizeSenador(parlamentar));
          },
          this.getTTL('senadores'),
          z.array(senadorSchema) as z.ZodType<Senador[], z.ZodTypeDef, Senador[]>
        );
        
        // Filtrar resultados
        let filteredData = [...senadores];
        
        const typedFilters = filters as {
          uf?: string;
          partido?: string;
          emExercicio?: boolean;
        };
        
        if (typedFilters.uf) {
          filteredData = filteredData.filter(senador => 
            senador.siglaUf.toLowerCase() === typedFilters.uf?.toLowerCase()
          );
        }
        
        if (typedFilters.partido) {
          filteredData = filteredData.filter(senador => 
            senador.siglaPartido.toLowerCase() === typedFilters.partido?.toLowerCase()
          );
        }
        
        if (typedFilters.emExercicio !== undefined) {
          filteredData = filteredData.filter(senador => 
            senador.emExercicio === typedFilters.emExercicio
          );
        }
        
        // Paginar resultados
        return this.paginateResults(filteredData, { page, limit });
      } catch (error) {
        if (error instanceof ServerApiError) {
          throw error;
        }
        
        throw new ServerApiError(
          'Falha ao obter lista de senadores',
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Obtém detalhes de um senador
     * @param id ID do senador
     * @returns Detalhes do senador
     */
    async getSenador(id: string): Promise<SenadorDetalhado> {
      // Criar chave de cache
      const cacheKey = `senador:${id}`;
      
      try {
        // Obter ou definir cache
        return await this.cacheService.getOrSet<SenadorDetalhado>(
          cacheKey,
          async (): Promise<SenadorDetalhado> => {
            const response = await this.apiClient.get<any>(`${PARLAMENTARES_ENDPOINT}/${id}`);
            
            // Extrair e normalizar senador
            const senador = response.DetalheParlamentar?.Parlamentar;
            
            if (!senador) {
              throw new NotFoundApiError(`Senador não encontrado com ID ${id}`, id);
            }
            
            return normalizeSenadorDetalhado(senador);
          },
          this.getTTL('senadorDetalhado'),
          senadorDetalhadoSchema as z.ZodType<SenadorDetalhado, z.ZodTypeDef, SenadorDetalhado>
        );
      } catch (error) {
        if (error instanceof NotFoundApiError || error instanceof ServerApiError) {
          throw error;
        }
        
        throw new ServerApiError(
          `Falha ao obter detalhes do senador ${id}`,
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Obtém votações de um senador
     * @param params Parâmetros de consulta
     * @returns Lista paginada de votações
     */
    async getVotacoes(params: GetVotacoesParams): Promise<PaginatedResponse<Votacao>> {
      // Validar parâmetros
      const validParams = getVotacoesParamsSchema.parse(params);
      const { page, limit, ...filters } = validParams;
      
      // Criar chave de cache
      const cacheKey = this.createCacheKey('votacoes', filters);
      
      try {
        // Obter ou definir cache
        const votacoes = await this.cacheService.getOrSet<Votacao[]>(
          cacheKey,
          async () => {
            let endpoint = VOTACOES_ENDPOINT;
            
            // Adicionar filtros à URL
            const queryParams: Record<string, string> = {};
            
            if (filters.senadorId) {
              endpoint = `${PARLAMENTARES_ENDPOINT}/${filters.senadorId}/votacoes`;
            }
            
            if (filters.dataInicio) {
              queryParams.dataInicio = formatDateToApi(filters.dataInicio) || '';
            }
            
            if (filters.dataFim) {
              queryParams.dataFim = formatDateToApi(filters.dataFim) || '';
            }
            
            if (filters.siglaMateria) {
              queryParams.siglaMateria = filters.siglaMateria;
            }
            
            const response = await this.apiClient.get<any>(endpoint, {
              params: queryParams
            });
            
            // Extrair e normalizar votações
            const votacoesData = filters.senadorId 
              ? response.VotacaoParlamentar?.Votacoes?.Votacao 
              : response.ListaVotacoes?.Votacoes?.Votacao;
              
            if (!votacoesData) {
              return [];
            }
            
            const votacoesArray = Array.isArray(votacoesData) 
              ? votacoesData 
              : [votacoesData];
              
            return votacoesArray.map(votacao => normalizeVotacao(votacao));
          },
          this.getTTL('votacoes'),
          z.array(votacaoSchema) as z.ZodType<Votacao[], z.ZodTypeDef, Votacao[]>
        );
        
        // Paginar resultados
        return this.paginateResults(votacoes, { page, limit });
      } catch (error) {
        if (error instanceof ServerApiError) {
          throw error;
        }
        
        throw new ServerApiError(
          'Falha ao obter votações',
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Obtém detalhes de uma votação
     * @param id ID da votação
     * @returns Detalhes da votação
     */
    async getVotacao(id: string): Promise<Votacao> {
      // Criar chave de cache
      const cacheKey = `votacao:${id}`;
      
      try {
        // Obter ou definir cache
        return await this.cacheService.getOrSet<Votacao>(
          cacheKey,
          async () => {
            const response = await this.apiClient.get<any>(`${VOTACOES_ENDPOINT}/${id}`);
            
            // Extrair e normalizar votação
            const votacao = response.VotacaoMateria?.Votacao;
            
            if (!votacao) {
              throw new NotFoundApiError(`Votação não encontrada com ID ${id}`, id);
            }
            
            return normalizeVotacao(votacao);
          },
          this.getTTL('votacaoDetalhada'),
          votacaoSchema as z.ZodType<Votacao, z.ZodTypeDef, Votacao>
        );
      } catch (error) {
        if (error instanceof NotFoundApiError || error instanceof ServerApiError) {
          throw error;
        }
        
        throw new ServerApiError(
          `Falha ao obter detalhes da votação ${id}`,
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Obtém matérias legislativas
     * @param params Parâmetros de consulta
     * @returns Lista paginada de matérias
     */
    async getMaterias(params: GetMateriasParams): Promise<PaginatedResponse<Materia>> {
      // Validar parâmetros
      const validParams = getMateriasParamsSchema.parse(params);
      const { page, limit, ...filters } = validParams;
      
      // Criar chave de cache
      const cacheKey = this.createCacheKey('materias', filters);
      
      try {
        // Obter ou definir cache
        const materias = await this.cacheService.getOrSet<Materia[]>(
          cacheKey,
          async () => {
            let endpoint = MATERIAS_ENDPOINT;
            
            // Adicionar filtros à URL
            const queryParams: Record<string, string> = {};
            
            if (filters.senadorId) {
              endpoint = `${PARLAMENTARES_ENDPOINT}/${filters.senadorId}/autorias`;
            }
            
            if (filters.dataInicio) {
              queryParams.dataInicio = formatDateToApi(filters.dataInicio) || '';
            }
            
            if (filters.dataFim) {
              queryParams.dataFim = formatDateToApi(filters.dataFim) || '';
            }
            
            if (filters.tipo) {
              queryParams.sigla = filters.tipo;
            }
            
            if (filters.situacao) {
              queryParams.situacao = filters.situacao;
            }
            
            const response = await this.apiClient.get<any>(endpoint, {
              params: queryParams
            });
            
            // Extrair e normalizar matérias
            const materiasData = filters.senadorId 
              ? response.AutoriasParlamentar?.Autorias?.Autoria 
              : response.ListaMaterias?.Materias?.Materia;
              
            if (!materiasData) {
              return [];
            }
            
            const materiasArray = Array.isArray(materiasData) 
              ? materiasData 
              : [materiasData];
              
            return materiasArray.map(materia => normalizeMateria(materia));
          },
          this.getTTL('materias'),
          z.array(materiaSchema) as z.ZodType<Materia[], z.ZodTypeDef, Materia[]>
        );
        
        // Paginar resultados
        return this.paginateResults(materias, { page, limit });
      } catch (error) {
        if (error instanceof ServerApiError) {
          throw error;
        }
        
        throw new ServerApiError(
          'Falha ao obter matérias',
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Obtém detalhes de uma matéria
     * @param id ID da matéria
     * @returns Detalhes da matéria
     */
    async getMateria(id: string): Promise<Materia> {
      // Criar chave de cache
      const cacheKey = `materia:${id}`;
      
      try {
        // Obter ou definir cache
        return await this.cacheService.getOrSet<Materia>(
          cacheKey,
          async () => {
            const response = await this.apiClient.get<any>(`${MATERIAS_ENDPOINT}/${id}`);
            
            // Extrair e normalizar matéria
            const materia = response.DetalheMateria?.Materia;
            
            if (!materia) {
              throw new NotFoundApiError(`Matéria não encontrada com ID ${id}`, id);
            }
            
            return normalizeMateria(materia);
          },
          this.getTTL('materiaDetalhada'),
          materiaSchema as z.ZodType<Materia, z.ZodTypeDef, Materia>
        );
      } catch (error) {
        if (error instanceof NotFoundApiError || error instanceof ServerApiError) {
          throw error;
        }
        
        throw new ServerApiError(
          `Falha ao obter detalhes da matéria ${id}`,
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Obtém despesas de um senador
     * @param params Parâmetros de consulta
     * @returns Lista paginada de despesas
     */
    async getDespesas(params: GetDespesasParams): Promise<PaginatedResponse<Despesa>> {
      // Validar parâmetros
      const validParams = getDespesasParamsSchema.parse(params);
      const { page, limit, senadorId, ...filters } = validParams;
      
      // Criar chave de cache
      const cacheKey = this.createCacheKey(`senador:${senadorId}:despesas`, filters);
      
      try {
        // Obter ou definir cache
        const despesas = await this.cacheService.getOrSet<Despesa[]>(
          cacheKey,
          async () => {
            // Adicionar filtros à URL
            const queryParams: Record<string, string> = {};
            
            if (filters.ano) {
              queryParams.ano = filters.ano.toString();
            }
            
            if (filters.mes) {
              queryParams.mes = filters.mes.toString();
            }
            
            if (filters.tipo) {
              queryParams.tipo = filters.tipo;
            }
            
            const response = await this.apiClient.get<any>(`${DESPESAS_ENDPOINT}/${senadorId}`, {
              params: queryParams
            });
            
            // Extrair e normalizar despesas
            const despesasData = response.DespesasParlamentar?.Despesas?.Despesa;
              
            if (!despesasData) {
              return [];
            }
            
            const despesasArray = Array.isArray(despesasData) 
              ? despesasData 
              : [despesasData];
              
            // Processar despesas (implementação fictícia, ajustar conforme API real)
            return despesasArray.map((despesa: any, index: number) => ({
              id: `${senadorId}-${despesa.Ano}-${despesa.Mes}-${index}`,
              ano: parseInt(despesa.Ano) || 0,
              mes: parseInt(despesa.Mes) || 0,
              tipo: despesa.TipoDespesa || '',
              valor: parseFloat(despesa.ValorDespesa?.replace(',', '.')) || 0,
              fornecedor: despesa.Fornecedor || '',
              descricao: despesa.Descricao || '',
              dataDocumento: formatDateToApi(despesa.DataDocumento) ? new Date(despesa.DataDocumento) : undefined,
              urlDocumento: despesa.UrlDocumento || '',
              senadorId
            }));
          },
          this.getTTL('despesas'),
          z.array(despesaSchema) as z.ZodType<Despesa[], z.ZodTypeDef, Despesa[]>
        );
        
        // Paginar resultados
        return this.paginateResults(despesas, { page, limit });
      } catch (error) {
        if (error instanceof ServerApiError) {
          throw error;
        }
        
        throw new ServerApiError(
          `Falha ao obter despesas do senador ${senadorId}`,
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Invalida cache de senadores
     * @returns Número de chaves invalidadas
     */
    async invalidateSenadoresCache(): Promise<number> {
      try {
        return await this.cacheService.invalidatePattern('senadores:*');
      } catch (error) {
        logger.error('Erro ao invalidar cache de senadores:', error);
        throw new ServerApiError(
          'Falha ao invalidar cache de senadores',
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Invalida cache de um senador específico
     * @param id ID do senador
     * @returns Número de chaves invalidadas
     */
    async invalidateSenadorCache(id: string): Promise<number> {
      try {
        return await this.cacheService.invalidatePattern(`senador:${id}:*`);
      } catch (error) {
        logger.error(`Erro ao invalidar cache do senador ${id}:`, error);
        throw new ServerApiError(
          `Falha ao invalidar cache do senador ${id}`,
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Invalida cache de votações
     * @returns Número de chaves invalidadas
     */
    async invalidateVotacoesCache(): Promise<number> {
      try {
        return await this.cacheService.invalidatePattern('votacoes:*');
      } catch (error) {
        logger.error('Erro ao invalidar cache de votações:', error);
        throw new ServerApiError(
          'Falha ao invalidar cache de votações',
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }
    }
    
    /**
     * Invalida cache de materias
     * @returns Número de chaves invalidadas
     */
    async invalidateMateriasCache(): Promise<number> {
      try {
        return await this.cacheService.invalidatePattern('materias:*');
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
