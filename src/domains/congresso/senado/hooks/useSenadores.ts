// src/domains/congresso/senado/hooks/useSenadores.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { apiResponseSchema, type SenadorSchema } from '@/domains/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';

// Opções do hook com Zod
const useSenadorOptionsSchema = z.object({
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

type UseSenadorOptions = z.infer<typeof useSenadorOptionsSchema>;

// Mock data generator
const gerarSenadoresMockados = () => {
  const partidos = ['MDB', 'PT', 'PSDB', 'PL', 'UNIÃO', 'PP', 'PSD'];
  const estados = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'PE', 'CE', 'PA', 'MA'];
  const nomes = [
    'Ana Silva', 'Carlos Oliveira', 'Patrícia Santos', 'Roberto Lima',
    'Fernanda Costa', 'José Pereira', 'Márcia Souza', 'Paulo Rodrigues',
    'Cláudia Ferreira', 'Antônio Almeida'
  ];

  return nomes.map((nome, i) => ({
    IdentificacaoParlamentar: {
      CodigoParlamentar: 5000 + i,
      NomeParlamentar: nome,
      NomeCompletoParlamentar: nome,
      SexoParlamentar: i % 2 === 0 ? 'M' : 'F',
      FormaTratamento: i % 2 === 0 ? 'Senador' : 'Senadora',
      UrlFotoParlamentar: `https://www.senado.leg.br/senadores/img/fotos-oficiais/senador${5000 + i}.jpg`,
      UrlPaginaParlamentar: `https://www.senado.leg.br/senadores/senador/${5000 + i}`,
      EmailParlamentar: `senador${5000 + i}@senado.leg.br`,
      SiglaPartidoParlamentar: partidos[Math.floor(Math.random() * partidos.length)],
      UfParlamentar: estados[Math.floor(Math.random() * estados.length)]
    },
    mandato: {
      dataInicio: new Date().toISOString(),
      situacao: 'Exercício'
    }
  }));
};

/**
 * Hook para buscar senadores usando TanStack Query
 * 
 * @param options Opções de filtragem e comportamento
 * @returns Objeto com dados, estado de carregamento e erro
 * 
 * @example
 * // Buscar todos os senadores
 * const { data: senadores, isLoading } = useSenadores();
 * 
 * // Filtrar por UF
 * const { data } = useSenadores({ uf: 'SP' });
 */
export function useSenadores(options: Partial<UseSenadorOptions> = {}) {
  const validatedOptions = useSenadorOptionsSchema.parse(options);
  const { legislatura, partido, uf, enabled } = validatedOptions;

  return useQuery({
    queryKey: ['senadores', { legislatura, partido, uf }],
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
        logger.error('Erro ao buscar senadores:', error);
        
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

export default useSenadores;
