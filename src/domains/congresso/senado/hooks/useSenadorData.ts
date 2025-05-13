// src/domains/congresso/senado/hooks/useSenadorData.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { 
  apiResponseSchema,
  type SenadorSchema,
  type MateriaSchema,
  type VotacaoSchema,
  type DespesaSchema
} from '@/domains/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';

// Esquema de opções do hook
const useSenadorDataOptionsSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  ano: z.number().optional().default(() => new Date().getFullYear()),
  enabled: z.boolean().optional().default(true)
}).transform(data => ({
  id: data.id,
  ano: data.ano ?? new Date().getFullYear(),
  enabled: data.enabled ?? true
}));

// Inferir tipo do esquema
type UseSenadorDataOptions = z.infer<typeof useSenadorDataOptionsSchema>;

/**
 * Hook para buscar dados detalhados de um senador
 * 
 * Este hook combina dados de diferentes endpoints da API do Senado
 * para fornecer informações completas sobre um senador.
 * 
 * @param options Opções de configuração
 * @returns Objeto com dados do senador, proposições, votações, despesas, loading e erro
 */
export function useSenadorData(options: Partial<UseSenadorDataOptions>) {
  // Validar opções com Zod
  const validatedOptions = useSenadorDataOptionsSchema.parse(options);
  const { id, ano, enabled } = validatedOptions;

  // Query para dados do senador
  const senadorQuery = useQuery({
    queryKey: ['senador', id],
    queryFn: async () => {
      try {
        const response = await senadoApiClient.get<any>(
          `/senador/${id}`
        );
        
        const data = response.data;
        // Normalmente transformaríamos os dados aqui, mas vamos retornar diretamente
        return data as SenadorSchema;
      } catch (error) {
        logger.error(`Erro ao buscar senador ${id}:`, error);
        throw error;
      }
    },
    enabled,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });

  // Query para proposições/autorias
  const proposicoesQuery = useQuery({
    queryKey: ['proposicoes', 'senador', id, ano],
    queryFn: async () => {
      try {
        const response = await senadoApiClient.get<any>(
          `/senador/${id}/autorias`,
          {
            params: { ano }
          }
        );
        
        const data = response.data;
        return Array.isArray(data) ? data : [data] as MateriaSchema[];
      } catch (error) {
        logger.error(`Erro ao buscar proposições do senador ${id}:`, error);
        return []; // Retornar array vazio em caso de erro
      }
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60 * 6, // 6 horas
  });

  // Query para votações
  const votacoesQuery = useQuery({
    queryKey: ['votacoes', 'senador', id, ano],
    queryFn: async () => {
      try {
        const response = await senadoApiClient.get<any>(
          `/votacoes/senador/${id}`,
          {
            params: { ano }
          }
        );
        
        const data = response.data;
        return Array.isArray(data) ? data : [data] as VotacaoSchema[];
      } catch (error) {
        logger.error(`Erro ao buscar votações do senador ${id}:`, error);
        return []; // Retornar array vazio em caso de erro
      }
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60 * 6, // 6 horas
  });

  // Query para despesas
  const despesasQuery = useQuery({
    queryKey: ['despesas', 'senador', id, ano],
    queryFn: async () => {
      try {
        const response = await senadoApiClient.get<any>(
          `/senador/${id}/despesas`,
          {
            params: { ano }
          }
        );
        
        const data = response.data;
        return Array.isArray(data) ? data : [data] as DespesaSchema[];
      } catch (error) {
        logger.error(`Erro ao buscar despesas do senador ${id}:`, error);
        return []; // Retornar array vazio em caso de erro
      }
    },
    enabled,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 12, // 12 horas
  });

  // Função para recarregar todos os dados
  const reload = async () => {
    logger.info(`Recarregando dados do senador ${id}`);
    try {
      await Promise.all([
        senadorQuery.refetch(),
        proposicoesQuery.refetch(),
        votacoesQuery.refetch(),
        despesasQuery.refetch()
      ]);
      logger.info('Dados recarregados com sucesso');
    } catch (error) {
      logger.error('Erro ao recarregar dados:', error);
      throw error;
    }
  };

  return {
    senador: senadorQuery.data,
    proposicoes: proposicoesQuery.data ?? [],
    votacoes: votacoesQuery.data ?? [],
    despesas: despesasQuery.data ?? [],
    loading: senadorQuery.isLoading || proposicoesQuery.isLoading || 
             votacoesQuery.isLoading || despesasQuery.isLoading,
    error: senadorQuery.error ?? proposicoesQuery.error ?? 
           votacoesQuery.error ?? despesasQuery.error ?? null,
    reload
  };
}

export default useSenadorData;
