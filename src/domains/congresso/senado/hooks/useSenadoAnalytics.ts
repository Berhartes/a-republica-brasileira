// src/domains/congresso/senado/hooks/useSenadoAnalytics.ts
import { useMemo } from 'react';
import { z } from 'zod';
import { useSenadores } from './useSenadores';
import { useVotacoes } from './useVotacoes';
import { TipoVoto } from '@/domains/congresso/senado/types/index';
import { logger } from '@/app/monitoring/logger';

// Schemas para validação de dados e opções
const useSenadoAnalyticsOptionsSchema = z.object({
  ano: z.number().optional().default(() => new Date().getFullYear()),
  periodo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional().default('anual'),
  uf: z.string().optional()
}).transform(data => ({
  ano: data.ano ?? new Date().getFullYear(),
  periodo: data.periodo ?? 'anual',
  uf: data.uf
}));

// Inferir tipo TypeScript do schema
type UseSenadoAnalyticsOptions = z.infer<typeof useSenadoAnalyticsOptionsSchema>;

// Interface para as análises estatísticas por partido
interface PartidoAnalytics {
  sigla: string;
  nome: string;
  senadores: number;
  votacoes: number;
  votosSim: number;
  votosNao: number;
  abstencoes: number;
  percentualSim: number;
  percentualNao: number;
  percentualAbstencao: number;
  coesao: number;
}

// Interface para temas mais votados
interface TemaVotado {
  tema: string;
  contagem: number;
}

// Interface para o retorno do hook
interface UseSenadoAnalyticsReturn {
  loading: boolean;
  totalSenadores: number;
  totalVotacoes: number;
  partidosAnalytics: PartidoAnalytics[];
  temasMaisVotados: TemaVotado[];
}

/**
 * Hook para análise estatística de dados do Senado
 * 
 * Combina dados de senadores e votações para gerar insights e estatísticas
 * 
 * @param options Opções para filtrar as análises
 * @returns Objeto com os dados estatísticos e análises
 */
export function useSenadoAnalytics(
  options: Partial<UseSenadoAnalyticsOptions> = {}
): UseSenadoAnalyticsReturn {
  // Validar opções com Zod
  const validatedOptions = useSenadoAnalyticsOptionsSchema.parse(options);
  const { ano, periodo, uf } = validatedOptions;
  
  // Buscar senadores usando o hook refatorado
  const { 
    data: senadores, 
    isLoading: loadingSenadores 
  } = useSenadores({
    uf
  });
  
  // Buscar votações do período
  const { 
    data: votacoes, 
    isLoading: loadingVotacoes 
  } = useVotacoes({
    ano
  });
  
  // Calcular estatísticas por partido
  const partidosAnalytics = useMemo<PartidoAnalytics[]>(() => {
    if (!senadores || !votacoes) return [];
    
    try {
      // Agrupar senadores por partido
      const senadoresPorPartido: Record<string, any[]> = {};
      senadores.forEach((senador: any) => {
        const partido = senador?.IdentificacaoParlamentar?.SiglaPartidoParlamentar;
        if (partido) {
          if (!senadoresPorPartido[partido]) {
            senadoresPorPartido[partido] = [];
          }
          senadoresPorPartido[partido].push(senador);
        }
      });
      
      // Processar votações
      const votosPorPartido: Record<string, {
        total: number;
        sim: number;
        nao: number;
        abstencao: number;
        votos: Record<string, TipoVoto[]>;
      }> = {};
      
      // Inicializar estrutura
      Object.keys(senadoresPorPartido).forEach(partido => {
        votosPorPartido[partido] = {
          total: 0,
          sim: 0,
          nao: 0,
          abstencao: 0,
          votos: {}
        };
        
        // Inicializar votos por senador
        senadoresPorPartido[partido].forEach(senador => {
          const senadorId = senador.IdentificacaoParlamentar.CodigoParlamentar;
          votosPorPartido[partido].votos[senadorId] = [];
        });
      });
      
      // Processar cada votação
      votacoes.forEach(votacao => {
        if (!votacao.votos || !Array.isArray(votacao.votos)) return;
        
        votacao.votos.forEach(voto => {
          // Cast para solucionar erro de tipo
          const votoComPartido = voto as { senadorId: string; voto: string; data?: Date | null | undefined; partido?: string; siglaPartido?: string };
          const partido = votoComPartido.partido || votoComPartido.siglaPartido;
          if (!partido || !votosPorPartido[partido]) return;
          
          // Incrementar contadores
          votosPorPartido[partido].total++;
          
          if (voto.voto === 'Sim') {
            votosPorPartido[partido].sim++;
          } else if (voto.voto === 'Não') {
            votosPorPartido[partido].nao++;
          } else if (voto.voto === 'Abstenção') {
            votosPorPartido[partido].abstencao++;
          }
          
          // Registrar voto individual
          const senadorId = voto.senadorId.toString();
          const votos = votosPorPartido[partido].votos;
          if (!votos[senadorId]) {
            votos[senadorId] = [];
          }
          votos[senadorId].push(voto.voto as TipoVoto);
        });
      });
      
      // Calcular coesão para cada partido
      return Object.entries(senadoresPorPartido).map(([sigla, partidoSenadores]) => {
        const votos = votosPorPartido[sigla];
        const total = votos.total || 1; // Evitar divisão por zero
        
        // Calcular coesão (quanto mais próximo de 100, mais coeso)
        let coesao = 0;
        
        if (Object.keys(votos.votos).length > 0) {
          // Para cada votação, calcular o percentual do voto majoritário
          const votacoesMajoritarias: number[] = [];
          
          // Agrupar votos por votação
          const votacoes: Record<string, Record<string, number>> = {};
          
          Object.values(votos.votos).forEach((senadorVotos: any) => {
            senadorVotos.forEach((voto: any, index: number) => {
              if (!votacoes[index]) {
                votacoes[index] = {
                  'Sim': 0,
                  'Não': 0,
                  'Abstenção': 0,
                  'Obstrução': 0,
                  'Ausente': 0
                };
              }
              votacoes[index][voto]++;
            });
          });
          
          // Calcular percentual do voto majoritário em cada votação
          Object.values(votacoes).forEach(contagem => {
            const totalVotos = Object.values(contagem).reduce((a, b) => a + b, 0);
            if (totalVotos > 0) {
              const maximo = Math.max(...Object.values(contagem));
              votacoesMajoritarias.push((maximo / totalVotos) * 100);
            }
          });
          
          // Média das votações majoritárias
          coesao = votacoesMajoritarias.length > 0
            ? votacoesMajoritarias.reduce((a, b) => a + b, 0) / votacoesMajoritarias.length
            : 0;
        }
        
        return {
          sigla,
          nome: sigla, // Nome completo do partido poderia vir de outra fonte
          senadores: partidoSenadores.length,
          votacoes: total,
          votosSim: votos.sim,
          votosNao: votos.nao,
          abstencoes: votos.abstencao,
          percentualSim: (votos.sim / total) * 100,
          percentualNao: (votos.nao / total) * 100,
          percentualAbstencao: (votos.abstencao / total) * 100,
          coesao
        };
      }).sort((a, b) => b.senadores - a.senadores); // Ordenar por número de senadores
    } catch (error) {
      logger.error('Erro ao calcular estatísticas por partido:', error);
      return [];
    }
  }, [senadores, votacoes]);
  
  // Análise de temas mais votados
  const temasMaisVotados = useMemo<TemaVotado[]>(() => {
    if (!votacoes) return [];
    
    try {
      // Para uma análise real, precisaríamos de dados de temas
      // Podemos extrair palavras-chave das descrições
      const temasTags: Record<string, number> = {};
      
      votacoes.forEach(votacao => {
        if (!votacao.descricao) return;
        
        // Exemplo: extrair palavras-chave da descrição
        const keywords = votacao.descricao
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .split(' ')
          .filter(w => w.length > 3 && !['para', 'como', 'pelo', 'pela', 'sobre'].includes(w));
        
        keywords.forEach(keyword => {
          temasTags[keyword] = (temasTags[keyword] || 0) + 1;
        });
      });
      
      // Ordenar por frequência
      return Object.entries(temasTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10
        .map(([tema, contagem]) => ({ tema, contagem }));
    } catch (error) {
      logger.error('Erro ao analisar temas mais votados:', error);
      return [];
    }
  }, [votacoes]);
  
  return {
    loading: loadingSenadores || loadingVotacoes,
    totalSenadores: senadores?.length || 0,
    totalVotacoes: votacoes?.length || 0,
    partidosAnalytics,
    temasMaisVotados
  };
}

export default useSenadoAnalytics;
