// src/domains/congresso/senado/hooks/useVotacoes.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { 
  apiResponseSchema, 
  type VotacaoSchema as SingleVotacaoResponse
} from '@/domains/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';

// Options schema with Zod
const useVotacoesOptionsSchema = z.object({
  ano: z.number().optional().default(() => new Date().getFullYear()),
  dataInicio: z.string().regex(/^\d{8}$/).optional(),
  dataFim: z.string().regex(/^\d{8}$/).optional(),
  codigo: z.string().optional(),
  materiaId: z.string().optional(),
  enabled: z.boolean().optional().default(true)
}).transform(data => ({
  ano: data.ano ?? new Date().getFullYear(),
  enabled: data.enabled ?? true,
  dataInicio: data.dataInicio,
  dataFim: data.dataFim,
  codigo: data.codigo,
  materiaId: data.materiaId
}));

// Infer TypeScript type from schema
type UseVotacoesOptions = z.infer<typeof useVotacoesOptionsSchema>;

// Stats interface
interface VotacoesStats {
  total: number;
  aprovadas: number;
  rejeitadas: number;
  percentualAprovacao: number;
  percentualRejeicao: number;
}

/**
 * Hook para buscar votações da API do Senado Federal usando TanStack Query
 * 
 * @param options Opções de filtragem e comportamento
 * @returns Objeto com dados, estatísticas, estado de carregamento e erro
 * 
 * @example
 * // Buscar votações do ano atual
 * const { data: votacoes, estatisticas } = useVotacoes();
 * 
 * // Filtrar por período específico
 * const { data } = useVotacoes({ 
 *   dataInicio: '20230101',
 *   dataFim: '20230630'
 * });
 */
export function useVotacoes(options: Partial<UseVotacoesOptions> = {}) {
  // Validate options with Zod
  const validatedOptions = useVotacoesOptionsSchema.parse(options);
  const {
    dataInicio,
    dataFim,
    materiaId,
    enabled
  } = validatedOptions;

  // Query function that uses the API client
  const fetchVotacoes = async (): Promise<SingleVotacaoResponse[]> => {
    try {
      const response = await senadoApiClient.get<any>(
        '/votacoes',
        {
          params: {
            dataInicio,
            dataFim,
            materiaId: materiaId ? parseInt(materiaId, 10) : undefined
          }
        }
      );
      
      const data = response.data;
      // Transform the data to match the expected format
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      logger.error('Error fetching votações:', error);
      throw error;
    }
  };

  // Use TanStack Query
  const query = useQuery({
    queryKey: ['votacoes', { dataInicio, dataFim, materiaId }],
    queryFn: fetchVotacoes,
    enabled,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in memory for 1 hour
  });

  // Calculate statistics
  const estatisticas: VotacoesStats | null = query.data ? {
    total: query.data.length,
    aprovadas: query.data.filter(v => v.resultado === 'Aprovado').length,
    rejeitadas: query.data.filter(v => v.resultado === 'Rejeitado').length,
    percentualAprovacao: query.data.length > 0 
      ? (query.data.filter(v => v.resultado === 'Aprovado').length / query.data.length) * 100 
      : 0,
    percentualRejeicao: query.data.length > 0
      ? (query.data.filter(v => v.resultado === 'Rejeitado').length / query.data.length) * 100
      : 0,
  } : null;

  return {
    ...query,
    estatisticas,
  };
}

export default useVotacoes;
