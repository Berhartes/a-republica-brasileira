// src/domains/congresso/senado/hooks/useSenadorDetalhado.ts
import { useMemo } from 'react';
import { useSenadores } from './useSenadores';
import { useProposicoesSenador } from './useProposicoesSenador';
import { useVotacoesSenador } from './useVotacoesSenador';
import { useDespesasSenador } from './useDespesasSenador';
import { useComissoesSenador } from './useComissoesSenador';
import { 
  type MateriaSchema,
  type VotacaoSchema,
  type ComissaoSchema,
  type SenadorSchema,
  type DespesaSchema
} from '@/domains/congresso/senado/schemas';
import { 
  type SenadorDetalhado,
  type Materia,
  type Votacao,
  type Despesa,
  type Comissao
} from '@/domains/congresso/senado/types/index';
import { 
  normalizeSenadorDetalhado 
} from '@/domains/congresso/senado/transformers';
import { logger } from '@/app/monitoring/logger';

// Interface para estatísticas do senador
interface SenadorStats {
  proposicoes: {
    total: number;
    emTramitacao: number;
    aprovadas: number;
    arquivadas: number;
  };
  votacoes: {
    total: number;
    participacao: number;
    percentualSim: number;
    percentualNao: number;
  };
  despesas: {
    total: number;
    media: number;
    maiorDespesa: number;
    totalPorTipo: Record<string, number>;
  };
  comissoes: {
    total: number;
    ativas: number;
    presidencias: number;
  };
}

interface UseSenadorDetalhadoResult {
  senador: SenadorDetalhado | null;
  proposicoes: Materia[] | null;
  votacoes: Votacao[] | null;
  despesas: Despesa[] | null;
  comissoes: Comissao[] | null;
  stats: SenadorStats | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Hook combinado que fornece todos os dados de um senador
 * 
 * Este hook é um substituto direto para o antigo useSenadorData,
 * combinando os dados de múltiplos hooks modulares.
 * 
 * @param id ID do senador
 * @param ano Ano para filtrar dados (default: ano atual)
 * @returns Objeto com todos os dados do senador e funções auxiliares
 * 
 * @example
 * ```tsx
 * const { 
 *   senador,
 *   proposicoes,
 *   votacoes,
 *   despesas,
 *   comissoes,
 *   stats,
 *   loading,
 *   error,
 *   reload
 * } = useSenadorDetalhado('123', 2023);
 * ```
 */
export function useSenadorDetalhado(
  id: string | number,
  ano: number = new Date().getFullYear()
): UseSenadorDetalhadoResult {
  // Buscar dados básicos do senador
  const { 
    data: senadoresResponse,
    isLoading: loadingSenador,
    error: senadorError,
    refetch: refetchSenador
  } = useSenadores({
    enabled: true
  });

  // Buscar proposições
  const {
    data: proposicoes,
    isLoading: loadingProposicoes,
    error: proposicoesError,
    refetch: refetchProposicoes
  } = useProposicoesSenador({ 
    id: typeof id === 'string' ? parseInt(id, 10) : id,
    ano 
  });

  // Buscar votações
  const {
    data: votacoes,
    isLoading: loadingVotacoes,
    error: votacoesError,
    stats: votacoesStats,
    refetch: refetchVotacoes
  } = useVotacoesSenador({ 
    id: typeof id === 'string' ? parseInt(id, 10) : id,
    ano 
  });

  // Buscar despesas
  const {
    data: despesas,
    isLoading: loadingDespesas,
    error: despesasError,
    stats: despesasStats,
    refetch: refetchDespesas
  } = useDespesasSenador({ 
    id: typeof id === 'string' ? parseInt(id, 10) : id,
    ano 
  });

  // Buscar comissões
  const {
    data: comissoes,
    isLoading: loadingComissoes,
    error: comissoesError,
    stats: comissoesStats,
    refetch: refetchComissoes
  } = useComissoesSenador({ 
    id: typeof id === 'string' ? parseInt(id, 10) : id
  });

  // Transformar dados do senador
  const senador = useMemo(() => {
    if (!senadoresResponse || !Array.isArray(senadoresResponse)) return null;
    
    const senadorResponse = senadoresResponse.find(s => {
      const senadorId = typeof id === 'string' ? parseInt(id, 10) : id;
      return s.IdentificacaoParlamentar.CodigoParlamentar === senadorId;
    });

    if (!senadorResponse) return null;
    return normalizeSenadorDetalhado(senadorResponse);
  }, [senadoresResponse, id]);

  // Consolidar estatísticas
  const stats = useMemo((): SenadorStats | null => {
    if (!proposicoes || !votacoesStats || !despesasStats || !comissoesStats) return null;

    return {
      proposicoes: {
        total: proposicoes.length,
        emTramitacao: proposicoes.filter(p => p.situacao === 'Em tramitação').length,
        aprovadas: proposicoes.filter(p => p.situacao?.toLowerCase().includes('aprovad')).length,
        arquivadas: proposicoes.filter(p => p.situacao?.toLowerCase().includes('arquivad')).length
      },
      votacoes: {
        total: votacoesStats.totalVotacoes,
        participacao: votacoesStats.participacao,
        percentualSim: votacoesStats.percentualSim,
        percentualNao: votacoesStats.percentualNao
      },
      despesas: {
        total: despesasStats.total,
        media: despesasStats.media,
        maiorDespesa: despesasStats.maiorDespesa.valor,
        totalPorTipo: despesasStats.totalPorTipo
      },
      comissoes: {
        total: comissoesStats.total,
        ativas: comissoesStats.ativas,
        presidencias: comissoesStats.presidente
      }
    };
  }, [proposicoes, votacoesStats, despesasStats, comissoesStats]);

  // Consolidar estado de carregamento
  const loading = loadingSenador || loadingProposicoes || loadingVotacoes || 
                 loadingDespesas || loadingComissoes;

  // Consolidar erros
  const error = senadorError || proposicoesError || votacoesError || 
                despesasError || comissoesError;

  // Função para recarregar todos os dados
  const reload = async () => {
    logger.info(`Recarregando dados do senador ${id}`);
    try {
      await Promise.all([
        refetchSenador(),
        refetchProposicoes(),
        refetchVotacoes(),
        refetchDespesas(),
        refetchComissoes()
      ]);
      logger.info('Dados recarregados com sucesso');
    } catch (error) {
      logger.error('Erro ao recarregar dados:', error);
      throw error;
    }
  };

  return {
    senador: senador as SenadorDetalhado | null,
    proposicoes: proposicoes as Materia[] | null,
    votacoes: votacoes as Votacao[] | null,
    despesas: despesas as Despesa[] | null,
    comissoes: comissoes as Comissao[] | null,
    stats,
    loading,
    error,
    reload
  };
}

export default useSenadorDetalhado;
