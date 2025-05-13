// src/domains/congresso/senado/hooks/useVotacoesSenador.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { 
  apiResponseSchema, 
  type VotacaoSchema as SingleVotacaoResponse
} from '@/domains/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';

// Options schema with Zod
const useVotacoesSenadorOptionsSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  ano: z.number().optional().default(() => new Date().getFullYear()),
  dataInicio: z.string().regex(/^\d{8}$/).optional(),
  dataFim: z.string().regex(/^\d{8}$/).optional(),
  incluirComissoes: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true)
}).transform(data => ({
  id: data.id,
  ano: data.ano ?? new Date().getFullYear(),
  dataInicio: data.dataInicio,
  dataFim: data.dataFim,
  incluirComissoes: data.incluirComissoes ?? false,
  enabled: data.enabled ?? true
}));

// Infer TypeScript type from schema
type UseVotacoesSenadorOptions = z.infer<typeof useVotacoesSenadorOptionsSchema>;

// Stats interface
interface VotacoesSenadorStats {
  totalVotacoes: number;
  votosSim: number;
  votosNao: number;
  abstencoes: number;
  ausencias: number;
  obstrucoes: number;
  participacao: number;
  percentualSim: number;
  percentualNao: number;
}

/**
 * Hook para buscar e analisar as votações de um senador usando TanStack Query
 * 
 * @param options Opções de configuração
 * @returns Objeto com votações, estatísticas e estados
 * 
 * @example
 * ```tsx
 * const { data, stats, isLoading } = useVotacoesSenador({
 *   id: '123',
 *   ano: 2023,
 *   incluirComissoes: true
 * });
 * ```
 */
export function useVotacoesSenador(options: Partial<UseVotacoesSenadorOptions>) {
  // Validate options with Zod
  const validatedOptions = useVotacoesSenadorOptionsSchema.parse(options);
  const {
    id,
    ano,
    dataInicio,
    dataFim,
    incluirComissoes,
    enabled
  } = validatedOptions;

  // Query function for plenário votações
  const fetchPlenarioVotacoes = async (): Promise<SingleVotacaoResponse[]> => {
    try {
      const response = await senadoApiClient.get<any>(
        `/votacoes/senador/${id}`,
        {
          params: {
            ano,
            dataInicio,
            dataFim,
          }
        }
      );

      const data = response.data;
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      logger.error('Error fetching plenário votações:', error);
      throw error;
    }
  };

  // Query function for comissões votações
  const fetchComissoesVotacoes = async (): Promise<SingleVotacaoResponse[]> => {
    try {
      const response = await senadoApiClient.get<any>(
        `/votacoes/comissoes/senador/${id}`,
        {
          params: { ano }
        }
      );

      const data = response.data;
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      logger.error('Error fetching comissões votações:', error);
      throw error;
    }
  };

  // Use TanStack Query for plenário votações
  const plenarioQuery = useQuery({
    queryKey: ['votacoes', 'senador', id, 'plenario', { ano, dataInicio, dataFim }],
    queryFn: fetchPlenarioVotacoes,
    enabled,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in memory for 1 hour
  });

  // Use TanStack Query for comissões votações if enabled
  const comissoesQuery = useQuery({
    queryKey: ['votacoes', 'senador', id, 'comissoes', ano],
    queryFn: fetchComissoesVotacoes,
    enabled: enabled && incluirComissoes,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  // Combine votações data
  const combinedVotacoes = (() => {
    if (!plenarioQuery.data) return null;
    
    if (incluirComissoes && comissoesQuery.data) {
      return [...plenarioQuery.data, ...comissoesQuery.data];
    }
    
    return plenarioQuery.data;
  })();

  // Calculate statistics
  const stats: VotacoesSenadorStats | null = combinedVotacoes ? (() => {
    const totalVotacoes = combinedVotacoes.length;
    let votosSim = 0;
    let votosNao = 0;
    let abstencoes = 0;
    let ausencias = 0;
    let obstrucoes = 0;
    
    combinedVotacoes.forEach(votacao => {
      const votosSenador = votacao.votos.filter(v => 
        String(v.senadorId) === String(id)
      );
      
      if (votosSenador.length > 0) {
        const voto = votosSenador[0];
        const tipoVoto = voto.voto;
        
        if (tipoVoto === 'Sim') votosSim++;
        else if (tipoVoto === 'Não') votosNao++;
        else if (tipoVoto === 'Abstenção') abstencoes++;
        else if (tipoVoto === 'Ausente') ausencias++;
        else if (tipoVoto === 'Obstrução') obstrucoes++;
      }
    });
    
    const votosValidos = votosSim + votosNao + abstencoes + obstrucoes;
    
    return {
      totalVotacoes,
      votosSim,
      votosNao,
      abstencoes,
      ausencias,
      obstrucoes,
      participacao: totalVotacoes > 0 ? 
        ((totalVotacoes - ausencias) / totalVotacoes) * 100 : 0,
      percentualSim: votosValidos > 0 ? 
        (votosSim / votosValidos) * 100 : 0,
      percentualNao: votosValidos > 0 ? 
        (votosNao / votosValidos) * 100 : 0
    };
  })() : null;

  return {
    data: combinedVotacoes,
    isLoading: plenarioQuery.isLoading || (incluirComissoes && comissoesQuery.isLoading),
    isError: plenarioQuery.isError || (incluirComissoes && comissoesQuery.isError),
    error: plenarioQuery.error || (incluirComissoes ? comissoesQuery.error : null),
    stats,
    refetch: async () => {
      await plenarioQuery.refetch();
      if (incluirComissoes) {
        await comissoesQuery.refetch();
      }
    }
  };
}

export default useVotacoesSenador;
