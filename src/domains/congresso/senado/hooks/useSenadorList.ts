// src/domains/congresso/senado/hooks/useSenadorList.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { apiResponseSchema, type SenadorSchema } from '@/domains/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';

// Opções do hook com Zod
const useSenadorListOptionsSchema = z.object({
  legislatura: z.number().optional(),
  partido: z.string().optional(),
  uf: z.string().optional(),
  enabled: z.boolean().optional().default(true),
}).transform(data => ({
  legislatura: data.legislatura,
  partido: data.partido,
  uf: data.uf,
  enabled: data.enabled ?? true,
}));

type UseSenadorListOptions = z.infer<typeof useSenadorListOptionsSchema>;

/**
 * Gera dados mockados de senadores para desenvolvimento
 */
function gerarSenadoresMockados() {
  return [
    { id: '1', nome: 'Senador Exemplo 1', siglaPartido: 'ABC', siglaUf: 'SP' },
    { id: '2', nome: 'Senador Exemplo 2', siglaPartido: 'DEF', siglaUf: 'RJ' },
    { id: '3', nome: 'Senador Exemplo 3', siglaPartido: 'GHI', siglaUf: 'MG' },
  ];
}

/**
 * Hook para buscar lista de senadores usando TanStack Query
 *
 * @param options Opções de filtragem e comportamento
 * @returns Objeto com dados, estado de carregamento e erro
 *
 * @example
 * // Buscar todos os senadores
 * const { data: senadores, isLoading } = useSenadorList();
 *
 * // Filtrar por UF
 * const { data } = useSenadorList({ uf: 'SP' });
 */
export function useSenadorList(options: Partial<UseSenadorListOptions> = {}) {
  const validatedOptions = useSenadorListOptionsSchema.parse(options);
  const { legislatura, partido, uf, enabled } = validatedOptions;

  return useQuery({
    queryKey: ['senadores', 'list', { legislatura, partido, uf }],
    queryFn: async () => {
      try {
        const response = await senadoApiClient.get<any>(
          '/senadores',
          {
            params: {
              legislatura,
              partido,
              uf
            }
          }
        );

        const data = response.data;
        return data;
      } catch (error) {
        logger.error('Erro ao buscar lista de senadores:', error);

        // Em caso de erro, retornar dados mockados
        logger.info('Retornando dados mockados devido ao erro');
        return gerarSenadoresMockados();
      }
    },
    enabled,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in memory for 1 hour
  });
}

export default useSenadorList;