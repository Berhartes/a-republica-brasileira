// src/domains/congresso/senado/hooks/useDespesasSenador.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { 
  apiResponseSchema, 
  despesaSchema,
  type DespesaSchema as Despesa 
} from '@/domains/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';

// Stats interface
interface DespesasStats {
  total: number;
  media: number;
  maiorDespesa: Despesa;
  menorDespesa: Despesa;
  totalPorTipo: Record<string, number>;
  totalPorMes: Record<string, number>;
  quantidadeDespesas: number;
}

// Options schema with Zod
const useDespesasSenadorOptionsSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  ano: z.number().optional().default(() => new Date().getFullYear()),
  mes: z.number().min(1).max(12).optional(),
  tipo: z.string().optional(),
  enabled: z.boolean().optional().default(true)
}).transform(data => ({
  id: data.id,
  ano: data.ano ?? new Date().getFullYear(),
  mes: data.mes,
  tipo: data.tipo,
  enabled: data.enabled ?? true
}));

// Infer TypeScript type from schema
type UseDespesasSenadorOptions = z.infer<typeof useDespesasSenadorOptionsSchema>;

/**
 * Hook para buscar as despesas de um senador usando TanStack Query
 * 
 * Este hook obtém dados de despesas que não estão disponíveis diretamente
 * na API pública do Senado, mas são extraídos do Portal da Transparência.
 * 
 * @param options Configurações para busca de despesas
 * @returns Objeto com dados das despesas, estado de carregamento, estatísticas e erros
 */
export function useDespesasSenador(options: Partial<UseDespesasSenadorOptions>) {
  // Validate options with Zod
  const validatedOptions = useDespesasSenadorOptionsSchema.parse(options);
  const {
    id,
    ano,
    mes,
    tipo,
    enabled
  } = validatedOptions;

  // Query function that handles API call
  const fetchDespesas = async (): Promise<Despesa[]> => {
    try {
      // Try primary endpoint
      try {
        const response = await senadoApiClient.get<any>(
          `/senador/${id}/despesas`,
          {
            params: {
              ano,
              mes,
              tipo
            }
          }
        );

        const data = response.data;
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        // Try fallback endpoint
        logger.warn('Primary endpoint failed, trying fallback:', error);
        
        const fallbackResponse = await fetch(
          `https://www6g.senado.gov.br/transparencia/sen/${id}/despesas/${ano}${mes ? `/${mes}` : ''}`
        );
        
        if (!fallbackResponse.ok) {
          throw new Error('Fallback endpoint also failed');
        }
        
        const fallbackData = await fallbackResponse.json();
        
        // Validate and transform data using schema
        return despesaSchema.array().parse(fallbackData);
      }
    } catch (error) {
      logger.error('Error fetching despesas:', error);
      throw error;
    }
  };

  // Calculate statistics from despesas data
  const calculateStats = (despesas: Despesa[]): DespesasStats => {
    const totalPorTipo = despesas.reduce((acc, despesa) => {
      const tipo = despesa.tipo || 'Não especificado';
      acc[tipo] = (acc[tipo] || 0) + despesa.valor;
      return acc;
    }, {} as Record<string, number>);
    
    const totalPorMes = despesas.reduce((acc, despesa) => {
      const mes = despesa.mes;
      if (mes >= 1 && mes <= 12) {
        acc[mes] = (acc[mes] || 0) + despesa.valor;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const total = despesas.reduce((sum, despesa) => sum + despesa.valor, 0);
    const media = despesas.length > 0 ? total / despesas.length : 0;
    const maiorDespesa = [...despesas].sort((a, b) => b.valor - a.valor)[0] || despesas[0];
    const menorDespesa = [...despesas].filter(d => d.valor > 0).sort((a, b) => a.valor - b.valor)[0] || despesas[0];
    
    return {
      total,
      media,
      maiorDespesa,
      menorDespesa,
      totalPorTipo,
      totalPorMes,
      quantidadeDespesas: despesas.length
    };
  };

  // Use TanStack Query
  const query = useQuery({
    queryKey: ['despesas', 'senador', id, { ano, mes, tipo }],
    queryFn: fetchDespesas,
    enabled,
    staleTime: 1000 * 60 * 30, // Consider data stale after 30 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in memory for 1 hour
  });

  // Calculate stats from query data
  const stats = query.data ? calculateStats(query.data) : null;

  return {
    ...query,
    data: query.data ?? [],
    stats
  };
}

export default useDespesasSenador;
