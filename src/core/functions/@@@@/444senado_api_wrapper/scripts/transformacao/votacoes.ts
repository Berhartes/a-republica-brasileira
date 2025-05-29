/**
 * Transformador especializado para votações de senadores
 * Este módulo transforma especificamente votações de senadores,
 * tratando as peculiaridades da resposta da API.
 */
import { logger } from '../utils/logging/logger';
import { VotacaoResult } from '../extracao/votacoes';
import { ResultadoTransformacaoLista } from './perfilsenadores';

// Interface para votações transformadas
export interface VotacaoTransformada {
  codigo: string;
  senador: {
    codigo: string;
    nome: string;
    partido?: {
      sigla: string;
      nome?: string;
    };
    uf?: string;
  };
  votacoes: Array<{
    id: string;
    materia: {
      tipo: string;
      numero: string;
      ano: string;
      ementa?: string;
    };
    sessao: {
      codigo: string;
      data: string;
      legislatura: number;
      sessaoLegislativa: number;
    };
    voto: string;
    orientacaoBancada?: string;
    resultado?: string;
    sequencial?: number;
  }>;
  timestamp: string;
}

/**
 * Classe para transformação de dados de votações de senadores
 */
export class VotacoesTransformer {
  /**
   * Transforma os dados de senadores de uma legislatura específica
   * @param senadoresExtraidos - Dados extraídos dos senadores
   * @param legislaturaNumero - Número da legislatura
   * @returns Dados transformados dos senadores
   */
  transformSenadoresLegislatura(senadoresExtraidos: any, legislaturaNumero: number): ResultadoTransformacaoLista {
    try {
      logger.info(`Transformando dados de senadores de legislatura específica`);

      // Verificar se temos dados válidos
      if (!senadoresExtraidos || !senadoresExtraidos.senadores || !Array.isArray(senadoresExtraidos.senadores)) {
        logger.warn(`Dados inválidos para transformação de senadores da legislatura ${legislaturaNumero}`);
        return {
          timestamp: new Date().toISOString(),
          senadores: [],
          legislatura: legislaturaNumero
        };
      }

      // Transformar cada senador
      const senadoresTransformados = senadoresExtraidos.senadores.map((senador: any) => {
        try {
          // Verificar se temos dados de identificação
          const identificacao = senador.IdentificacaoParlamentar || {};

          return {
            codigo: identificacao.CodigoParlamentar || '',
            nome: identificacao.NomeParlamentar || '',
            nomeCompleto: identificacao.NomeCompletoParlamentar || '',
            sexo: identificacao.SexoParlamentar || '',
            partido: {
              sigla: identificacao.SiglaPartidoParlamentar || '',
              nome: identificacao.NomePartidoParlamentar || ''
            },
            uf: identificacao.UfParlamentar || '',
            foto: identificacao.UrlFotoParlamentar || '',
            email: identificacao.EmailParlamentar || '',
            site: identificacao.UrlPaginaParlamentar || '',
            nascimento: {
              data: identificacao.DataNascimento || '',
              local: ''
            },
            mandato: {
              inicio: senador.Mandato?.DataInicio || '',
              fim: senador.Mandato?.DataFim || '',
              titular: senador.Mandato?.DescricaoParticipacao === 'Titular',
              suplente: senador.Mandato?.DescricaoParticipacao === 'Suplente'
            }
          };
        } catch (error: any) {
          logger.warn(`Erro ao transformar senador: ${error.message}`);
          return null;
        }
      }).filter(Boolean);

      logger.info(`Transformados ${senadoresTransformados.length} senadores da legislatura ${legislaturaNumero}`);

      return {
        timestamp: new Date().toISOString(),
        senadores: senadoresTransformados,
        legislatura: legislaturaNumero
      };
    } catch (error: any) {
      logger.error(`Erro ao transformar senadores da legislatura ${legislaturaNumero}: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        senadores: [],
        legislatura: legislaturaNumero
      };
    }
  }

  /**
   * Transforma as votações de um senador
   * @param votacaoResult - Resultado da extração de votações
   * @returns Votações transformadas
   */
  transformVotacoes(votacaoResult: VotacaoResult): VotacaoTransformada | null {
    try {
      // Verificação se o resultado existe
      if (!votacaoResult) {
        logger.error(`Resultado de votações é nulo ou indefinido`);
        return null;
      }

      // Verificação para dados básicos
      if (!votacaoResult.dadosBasicos ||
          !votacaoResult.dadosBasicos.dados ||
          Object.keys(votacaoResult.dadosBasicos.dados).length === 0) {
        logger.warn(`Dados básicos incompletos ou vazios para o senador ${votacaoResult.codigo || 'desconhecido'}`);
        return null;
      }

      logger.info(`Transformando votações do senador ${votacaoResult.codigo}`);

      // Extrair componentes principais
      const dadosBasicos = votacaoResult.dadosBasicos.dados || {};
      const votacoes = votacaoResult.votacoes?.dados || null;

      // Verificar se temos dados parlamentares
      const parlamentar = dadosBasicos.Parlamentar ||
                        dadosBasicos.DetalheParlamentar?.Parlamentar || {};

      // Verificar se temos dados de identificação
      const identificacao = parlamentar.IdentificacaoParlamentar || {};

      // Transformar votações
      const votacoesTransformadas = this.transformVotacoesDetalhadas(votacoes);

      // Criar objeto de votações transformadas
      const votacaoTransformada: VotacaoTransformada = {
        codigo: votacaoResult.codigo.toString(),
        senador: {
          codigo: votacaoResult.codigo.toString(),
          nome: identificacao.NomeParlamentar || 'Nome não disponível',
          partido: {
            sigla: identificacao.SiglaPartidoParlamentar || '',
            nome: identificacao.NomePartidoParlamentar || undefined
          },
          uf: identificacao.UfParlamentar || ''
        },
        votacoes: votacoesTransformadas,
        timestamp: new Date().toISOString()
      };

      return votacaoTransformada;
    } catch (error: any) {
      logger.error(`Erro ao transformar votações: ${error.message}`);
      return null;
    }
  }

  /**
   * Transforma votações detalhadas
   * @param votacoes - Dados de votações
   * @returns Votações transformadas
   */
  private transformVotacoesDetalhadas(votacoes: any): Array<{
    id: string;
    materia: {
      tipo: string;
      numero: string;
      ano: string;
      ementa?: string;
    };
    sessao: {
      codigo: string;
      data: string;
      legislatura: number;
      sessaoLegislativa: number;
    };
    voto: string;
    orientacaoBancada?: string;
    resultado?: string;
    sequencial?: number;
  }> {
    if (!votacoes) {
      logger.debug('Dados de votações não encontrados ou vazios');
      return [];
    }

    // Verificar estrutura das votações
    let votacoesArray = [];

    if (votacoes.VotacaoParlamentar && votacoes.VotacaoParlamentar.Parlamentar) {
      const parlamentar = votacoes.VotacaoParlamentar.Parlamentar;
      
      if (parlamentar.Votacoes && parlamentar.Votacoes.Votacao) {
        votacoesArray = Array.isArray(parlamentar.Votacoes.Votacao)
          ? parlamentar.Votacoes.Votacao
          : [parlamentar.Votacoes.Votacao];
      }
    } else if (votacoes.Votacoes && votacoes.Votacoes.Votacao) {
      votacoesArray = Array.isArray(votacoes.Votacoes.Votacao)
        ? votacoes.Votacoes.Votacao
        : [votacoes.Votacoes.Votacao];
    }

    logger.debug(`Encontradas ${votacoesArray.length} votações para transformação`);

    // Transformar cada votação
    return votacoesArray.map((votacao: any) => {
      try {
        const materia = votacao.Materia || {};
        const sessao = votacao.Sessao || {};
        
        return {
          id: votacao.SequencialVotacao || votacao.id || '',
          materia: {
            tipo: materia.SiglaMateria || materia.tipo || '',
            numero: materia.NumeroMateria || materia.numero || '',
            ano: materia.AnoMateria || materia.ano || '',
            ementa: materia.DescricaoMateria || materia.ementa || undefined
          },
          sessao: {
            codigo: sessao.CodigoSessao || sessao.codigo || '',
            data: sessao.DataSessao || sessao.data || '',
            legislatura: parseInt(sessao.NumeroLegislatura || '0', 10),
            sessaoLegislativa: parseInt(sessao.NumeroSessaoLegislativa || '0', 10)
          },
          voto: votacao.DescricaoVoto || votacao.voto || '',
          orientacaoBancada: votacao.DescricaoOrientacaoBancada || votacao.orientacaoBancada || undefined,
          resultado: votacao.DescricaoResultado || votacao.resultado || undefined,
          sequencial: parseInt(votacao.SequencialVotacao || '0', 10) || undefined
        };
      } catch (error: any) {
        logger.warn(`Erro ao transformar votação: ${error.message}`);
        return null;
      }
    }).filter(Boolean) as Array<{
      id: string;
      materia: {
        tipo: string;
        numero: string;
        ano: string;
        ementa?: string;
      };
      sessao: {
        codigo: string;
        data: string;
        legislatura: number;
        sessaoLegislativa: number;
      };
      voto: string;
      orientacaoBancada?: string;
      resultado?: string;
      sequencial?: number;
    }>;
  }
}

// Exporta uma instância do transformador
export const votacoesTransformer = new VotacoesTransformer();
