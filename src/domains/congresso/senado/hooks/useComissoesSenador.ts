// src/domains/congresso/senado/hooks/useComissoesSenador.ts
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { senadoApiClient } from '@/domains/congresso/senado/services/api-client';
import { apiResponseSchema, type ComissaoSchema } from '@/domains/congresso/senado/schemas';

// Extend ComissaoSchema to include 'ativa' and 'tipo' properties
interface ComissaoResponse extends ComissaoSchema {
  ativa: boolean;
  tipo?: string;
}
import { logger } from '@/app/monitoring/logger';

// Stats interface
interface ComissoesStats {
  total: number;
  ativas: number;
  inativas: number;
  percentualAtivas: number;
  totalPorTipo: Record<string, number>;
  totalPorCargo: Record<string, number>;
  presidente: number;
  relator: number;
}

// Options schema with Zod
const useComissoesSenadorOptionsSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
  incluirInativas: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true)
}).transform(data => ({
  id: data.id,
  incluirInativas: data.incluirInativas ?? false,
  enabled: data.enabled ?? true
}));

// Infer TypeScript type from schema
type UseComissoesSenadorOptions = z.infer<typeof useComissoesSenadorOptionsSchema>;

/**
 * Hook para buscar as comissões das quais um senador é membro usando TanStack Query
 * 
 * Utiliza o endpoint `/senador/{codigo}/comissoes` da API do Senado
 * 
 * @param options Opções para configurar a busca de comissões
 * @returns Objeto com dados das comissões, estado de carregamento, erro e estatísticas
 */
export function useComissoesSenador(options: Partial<UseComissoesSenadorOptions>) {
  // Validate options with Zod
  const validatedOptions = useComissoesSenadorOptionsSchema.parse(options);
  const {
    id,
    incluirInativas,
    enabled
  } = validatedOptions;

  // Query function that handles API call
  const fetchComissoes = async (): Promise<ComissaoResponse[]> => {
    try {
      const response = await senadoApiClient.get<any>(
        `/senador/${id}/comissoes`
      );
      
      const data = response.data;

      // Transform raw data to match schema
      const transformedComissoes = (Array.isArray(data) ? data : [data]).map(com => {
        // Determine if comissão is active
        const hoje = new Date();
        const dataFim = com.dataFim ? new Date(com.dataFim) : null;
        const ativa = !dataFim || dataFim > hoje;

        return {
          ...com,
          ativa
        };
      });

      // Filter inactive if requested
      return incluirInativas 
        ? transformedComissoes 
        : transformedComissoes.filter(c => c.ativa);
    } catch (error) {
      logger.error('Error fetching comissões:', error);
      throw error;
    }
  };

  // Calculate statistics from comissões data
  const calculateStats = (comissoes: ComissaoResponse[]): ComissoesStats => {
    const comissoesAtivas = comissoes.filter(c => c.ativa);
    const comissoesInativas = comissoes.filter(c => !c.ativa);
    
    // Count by type
    const totalPorTipo = comissoes.reduce((acc, comissao) => {
      const tipo = comissao.tipo || 'Não especificado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count by role
    const totalPorCargo = comissoes.reduce((acc, comissao) => {
      const cargo = comissao.cargo || 'Membro';
      acc[cargo] = (acc[cargo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: comissoes.length,
      ativas: comissoesAtivas.length,
      inativas: comissoesInativas.length,
      percentualAtivas: comissoes.length > 0 ? 
        (comissoesAtivas.length / comissoes.length) * 100 : 0,
      totalPorTipo,
      totalPorCargo,
      presidente: comissoes.filter(c => 
        c.cargo?.toLowerCase().includes('presidente') || 
        c.cargo?.toLowerCase().includes('presidenta')).length,
      relator: comissoes.filter(c => 
        c.cargo?.toLowerCase().includes('relator') || 
        c.cargo?.toLowerCase().includes('relatora')).length
    };
  };

  // Use TanStack Query
  const query = useQuery({
    queryKey: ['comissoes', 'senador', id, { incluirInativas }],
    queryFn: fetchComissoes,
    enabled,
    staleTime: 1000 * 60 * 30, // Consider data stale after 30 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in memory for 1 hour
  });

  // Calculate stats from query data
  const stats = query.data ? calculateStats(query.data) : null;

  return {
    ...query,
    data: query.data ?? null,
    stats
  };
}

export default useComissoesSenador;
