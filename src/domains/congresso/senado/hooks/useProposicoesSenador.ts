// src/domains/congresso/senado/hooks/useProposicoesSenador.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { 
  apiResponseSchema, 
  type MateriaSchema as MateriaResponse 
} from '@/domains/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';

// Options schema with Zod
const useProposicoesSenadorOptionsSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  ano: z.number().optional().default(() => new Date().getFullYear()),
  situacao: z.string().optional(),
  tipoProposicao: z.string().optional(),
  enabled: z.boolean().optional().default(true)
}).transform(data => ({
  id: data.id,
  ano: data.ano ?? new Date().getFullYear(),
  situacao: data.situacao,
  tipoProposicao: data.tipoProposicao,
  enabled: data.enabled ?? true
}));

// Infer TypeScript type from schema
type UseProposicoesSenadorOptions = z.infer<typeof useProposicoesSenadorOptionsSchema>;

/**
 * Hook para buscar proposições de autoria de um senador usando TanStack Query
 * 
 * Utiliza o endpoint `/senador/{codigo}/autorias` da API do Senado
 * 
 * @param options Opções de filtragem e comportamento
 * @returns Objeto com dados, estado de carregamento e erro
 */
export function useProposicoesSenador(options: Partial<UseProposicoesSenadorOptions>) {
  // Validate options with Zod
  const validatedOptions = useProposicoesSenadorOptionsSchema.parse(options);
  const {
    id,
    ano,
    situacao,
    tipoProposicao,
    enabled
  } = validatedOptions;

  // Build query parameters
  const getParams = (): Record<string, string | number> => {
    const params: Record<string, string | number> = {};
    
    if (ano) params.ano = ano;
    if (situacao) params.situacao = situacao;
    if (tipoProposicao) params.tipo = tipoProposicao;
    
    return params;
  };

  // Query function that handles API call
  const fetchProposicoes = async (): Promise<MateriaResponse[]> => {
    try {
      const response = await senadoApiClient.get<any>(
        `/senador/${id}/autorias`,
        {
          params: getParams()
        }
      );

      const data = response.data;
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      logger.error('Error fetching proposições:', error);
      throw error;
    }
  };

  // Use TanStack Query
  const query = useQuery({
    queryKey: ['proposicoes', 'senador', id, { ano, situacao, tipoProposicao }],
    queryFn: fetchProposicoes,
    enabled,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in memory for 1 hour
  });

  return {
    ...query,
    data: query.data ?? []
  };
}

export default useProposicoesSenador;
