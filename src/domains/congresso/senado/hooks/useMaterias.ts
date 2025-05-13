// src/domains/congresso/senado/hooks/useMaterias.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { 
  apiResponseSchema, 
  type MateriaSchema as MateriaResponse 
} from '@/domains/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';

// Options schema with Zod
const useMateriasOptionsSchema = z.object({
  codigo: z.string().optional(),
  sigla: z.string().optional(),
  numero: z.number().optional(),
  ano: z.number().optional().default(() => new Date().getFullYear()),
  autor: z.string().optional(),
  situacao: z.string().optional(),
  emTramitacao: z.boolean().optional(),
  enabled: z.boolean().optional().default(true)
}).transform(data => ({
  codigo: data.codigo,
  sigla: data.sigla,
  numero: data.numero,
  ano: data.ano ?? new Date().getFullYear(),
  autor: data.autor,
  situacao: data.situacao,
  emTramitacao: data.emTramitacao,
  enabled: data.enabled ?? true
}));

// Infer TypeScript type from schema
type UseMateriasOptions = z.infer<typeof useMateriasOptionsSchema>;

/**
 * Hook para buscar matérias legislativas da API do Senado Federal usando TanStack Query
 * 
 * @param options Opções de filtragem e comportamento
 * @returns Objeto com dados, estado de carregamento e erro
 */
export function useMaterias(options: Partial<UseMateriasOptions> = {}) {
  // Validate options with Zod
  const validatedOptions = useMateriasOptionsSchema.parse(options);
  const {
    codigo,
    sigla,
    numero,
    ano,
    autor,
    situacao,
    emTramitacao,
    enabled
  } = validatedOptions;

  // Determine endpoint based on parameters
  const getEndpoint = (): string => {
    if (codigo) {
      return `/materias/${codigo}`;
    } else if (sigla && numero && ano) {
      return `/materias/${sigla}/${numero}/${ano}`;
    } else if (autor) {
      return `/materias/autor/${autor}`;
    } else if (emTramitacao) {
      return `/materias/tramitando`;
    } else {
      return `/materias`;
    }
  };

  // Build query parameters
  const getParams = (): Record<string, string | number> => {
    const params: Record<string, string | number> = {};
    
    if (situacao && !codigo && !sigla) {
      params.situacao = situacao;
    }
    
    if (getEndpoint() === '/materias') {
      if (ano) params.ano = ano;
      if (sigla) params.sigla = sigla;
      if (numero) params.numero = numero;
    }
    
    return params;
  };

  // Query function that handles API call
  const fetchMaterias = async (): Promise<MateriaResponse[]> => {
    try {
      const response = await senadoApiClient.get<any>(
        getEndpoint(),
        {
          params: getParams()
        }
      );

      const data = response.data;
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      logger.error('Error fetching materias:', error);
      throw error;
    }
  };

  // Use TanStack Query
  const query = useQuery({
    queryKey: ['materias', {
      codigo,
      sigla,
      numero,
      ano,
      autor,
      situacao,
      emTramitacao
    }],
    queryFn: fetchMaterias,
    enabled,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in memory for 1 hour
  });

  return {
    ...query,
    data: query.data ?? []
  };
}

export default useMaterias;
