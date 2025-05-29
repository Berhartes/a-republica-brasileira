/**
 * Extrator para Blocos Parlamentares e Senadores por Bloco
 */
import { logger } from '../utils/logging/logger';
import * as api from '../utils/api';
import { endpoints } from '../utils/api/endpoints';
import { withRetry } from '../utils/logging/error-handler';
import { senadoresExtractor } from './senadores';

// Interfaces para tipagem dos dados
interface BlocoParlamentar {
  CodigoBloco: string | number;
  NomeBloco: string;
  NomeApelido?: string;
  DataCriacao?: string;
  DataExtincao?: string | null;
  Membros?: {
    Membro: Array<{
      Partido: {
        CodigoPartido: string | number;
        NomePartido: string;
        SiglaPartido: string;
      };
      DataAdesao?: string;
      DataDesligamento?: string | null;
    }> | {
      Partido: {
        CodigoPartido: string | number;
        NomePartido: string;
        SiglaPartido: string;
      };
      DataAdesao?: string;
      DataDesligamento?: string | null;
    };
  };
}

interface SenadorBloco {
  codigoSenador: string | number;
  nomeSenador: string;
  siglaPartido: string;
  uf: string;
  codigoBloco: string | number;
  nomeBloco: string;
  siglaBloco?: string;
}

interface MembroBloco {
  codigoParlamentar: string | number;
  nomeParlamentar: string;
  siglaPartido: string;
  uf: string;
  dataAdesao?: string;
  dataDesligamento?: string | null;
  situacao: 'Ativo' | 'Inativo';
}

interface ResultadoExtracao {
  timestamp: string;
  total: number;
  blocos: BlocoParlamentar[];
}

interface ResultadoExtracaoDetalhe {
  timestamp: string;
  codigo: string | number;
  detalhes: any;
}

interface ResultadoExtracaoMembros {
  timestamp: string;
  blocoId: string | number;
  membros: MembroBloco[];
}

interface ResultadoSenadoresPorBloco {
  timestamp: string;
  total: number;
  senadoresPorBloco: Record<string, SenadorBloco[]>;
}

interface ResultadoBlocosLegislatura {
  timestamp: string;
  legislatura: number;
  blocos: BlocoParlamentar[];
  total: number;
}

interface ResultadoCompleto {
  lista: ResultadoExtracao;
  detalhes: ResultadoExtracaoDetalhe[];
}

/**
 * Classe para extração de dados de blocos parlamentares e senadores por bloco
 */
export class BlocoExtractor {
  /**
   * Extrai a lista de blocos parlamentares
   */
  async extractLista(): Promise<ResultadoExtracao> {
    logger.info('Extraindo lista de blocos parlamentares');

    try {
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoints.COMPOSICAO.BLOCOS.LISTA.PATH, endpoints.COMPOSICAO.BLOCOS.LISTA.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        'Extração lista de blocos'
      );

      // Extrai a lista de blocos da estrutura correta
      const blocosData = response?.ListaBlocoParlamentar?.Blocos?.Bloco || [];

      // Garante que blocos seja uma array
      const blocos = Array.isArray(blocosData) ? blocosData : [blocosData];

      logger.info(`Extraídos ${blocos.length} blocos parlamentares`);

      return {
        timestamp: new Date().toISOString(),
        total: blocos.length,
        blocos: blocos
      };
    } catch (error) {
      logger.error('Erro ao extrair lista de blocos parlamentares', error);
      throw error;
    }
  }

  /**
   * Extrai blocos de uma legislatura específica
   * @param legislatura - Número da legislatura
   */
  async extractBlocosLegislatura(legislatura: number): Promise<ResultadoBlocosLegislatura> {
    logger.info(`Extraindo blocos da legislatura ${legislatura}`);

    try {
      // Para blocos, geralmente não há diferenciação por legislatura na API,
      // então extraímos todos os blocos ativos
      const resultado = await this.extractLista();
      
      // Filtrar blocos ativos (sem data de extinção ou data de extinção futura)
      const hoje = new Date();
      const blocosAtivos = resultado.blocos.filter(bloco => {
        if (!bloco.DataExtincao) return true; // Sem data de extinção = ativo
        
        try {
          const dataExtincao = new Date(bloco.DataExtincao);
          return dataExtincao > hoje; // Data de extinção futura = ainda ativo
        } catch {
          return true; // Se não conseguir parsear a data, considera ativo
        }
      });

      logger.info(`Encontrados ${blocosAtivos.length} blocos ativos para a legislatura ${legislatura}`);

      return {
        timestamp: new Date().toISOString(),
        legislatura,
        blocos: blocosAtivos,
        total: blocosAtivos.length
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair blocos da legislatura ${legislatura}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Extrai detalhes de um bloco específico
   */
  async extractDetalhe(codigo: string | number): Promise<ResultadoExtracaoDetalhe> {
    logger.info(`Extraindo detalhes do bloco ${codigo}`);

    try {
      // Substituir o parâmetro {codigo} no caminho
      const endpoint = api.replacePath(endpoints.COMPOSICAO.BLOCOS.DETALHE.PATH, { codigo });

      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoint, endpoints.COMPOSICAO.BLOCOS.DETALHE.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração detalhes do bloco ${codigo}`
      );

      // Extrai os detalhes do bloco
      const detalhes = response?.blocos?.bloco || {};

      return {
        timestamp: new Date().toISOString(),
        codigo: codigo,
        detalhes: detalhes
      };
    } catch (error) {
      logger.error(`Erro ao extrair detalhes do bloco ${codigo}`, error);
      throw error;
    }
  }

  /**
   * Extrai membros de um bloco específico
   * @param blocoId - ID do bloco
   * @param legislatura - Número da legislatura (opcional)
   */
  async extractMembrosBloco(blocoId: string | number, legislatura?: number): Promise<ResultadoExtracaoMembros> {
    logger.info(`Extraindo membros do bloco ${blocoId}`);

    try {
      // Obter lista de senadores em exercício
      const resultadoSenadores = await senadoresExtractor.extractSenadoresAtuais();
      
      if (resultadoSenadores.erro) {
        throw new Error(`Erro ao extrair senadores: ${resultadoSenadores.erro}`);
      }

      // Filtrar senadores que pertencem ao bloco especificado
      const membrosBloco: MembroBloco[] = [];
      
      for (const senador of resultadoSenadores.senadores) {
        const identificacao = senador.IdentificacaoParlamentar;
        
        // Verificar se o senador pertence ao bloco
        if (identificacao.Bloco && 
            String(identificacao.Bloco.CodigoBloco) === String(blocoId)) {
          
          membrosBloco.push({
            codigoParlamentar: identificacao.CodigoParlamentar,
            nomeParlamentar: identificacao.NomeParlamentar,
            siglaPartido: identificacao.SiglaPartidoParlamentar,
            uf: identificacao.UfParlamentar,
            dataAdesao: identificacao.Bloco.DataCriacao || undefined,
            dataDesligamento: null, // Senadores em exercício não têm data de desligamento
            situacao: 'Ativo'
          });
        }
      }

      logger.info(`Encontrados ${membrosBloco.length} membros no bloco ${blocoId}`);

      return {
        timestamp: new Date().toISOString(),
        blocoId,
        membros: membrosBloco
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair membros do bloco ${blocoId}: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Extrai a lista de senadores agrupados por bloco parlamentar
   */
  async extractSenadoresPorBloco(): Promise<ResultadoSenadoresPorBloco> {
    logger.info('Extraindo lista de senadores por bloco parlamentar');

    try {
      // Obter a lista de senadores em exercício
      const resultadoSenadores = await senadoresExtractor.extractSenadoresAtuais();

      if (resultadoSenadores.erro) {
        throw new Error(`Erro ao extrair senadores: ${resultadoSenadores.erro}`);
      }

      // Mapa para armazenar senadores por bloco
      const senadoresPorBloco: Record<string, SenadorBloco[]> = {};
      let totalAssociados = 0;

      // Processar cada senador e associá-lo ao seu bloco
      for (const senador of resultadoSenadores.senadores) {
        const identificacao = senador.IdentificacaoParlamentar;

        // Verificar se o senador pertence a algum bloco
        if (identificacao.Bloco && identificacao.Bloco.CodigoBloco) {
          const codigoBloco = String(identificacao.Bloco.CodigoBloco);

          // Inicializar o array do bloco se ainda não existir
          if (!senadoresPorBloco[codigoBloco]) {
            senadoresPorBloco[codigoBloco] = [];
          }

          // Adicionar o senador ao bloco
          senadoresPorBloco[codigoBloco].push({
            codigoSenador: identificacao.CodigoParlamentar,
            nomeSenador: identificacao.NomeParlamentar,
            siglaPartido: identificacao.SiglaPartidoParlamentar,
            uf: identificacao.UfParlamentar,
            codigoBloco: identificacao.Bloco.CodigoBloco,
            nomeBloco: identificacao.Bloco.NomeBloco,
            siglaBloco: identificacao.Bloco.NomeApelido
          });

          totalAssociados++;
        }
      }

      logger.info(`Extração concluída: ${totalAssociados} senadores associados a ${Object.keys(senadoresPorBloco).length} blocos`);

      return {
        timestamp: new Date().toISOString(),
        total: totalAssociados,
        senadoresPorBloco: senadoresPorBloco
      };
    } catch (error) {
      logger.error('Erro ao extrair lista de senadores por bloco', error);
      throw error;
    }
  }

  /**
   * Extrai lista e detalhes de todos os blocos
   */
  async extractAll(): Promise<ResultadoCompleto> {
    try {
      // Obter lista de blocos
      const listaResult = await this.extractLista();

      logger.info(`Iniciando extração de detalhes para ${listaResult.blocos.length} blocos`);

      // Extrair detalhes para cada bloco
      const detalhesPromises = listaResult.blocos.map(async (bloco) => {
        const codigo = bloco.CodigoBloco;
        if (!codigo) {
          logger.warn(`Bloco sem código encontrado: ${JSON.stringify(bloco)}`);
          return null;
        }

        try {
          // Usar um breve atraso entre requisições para evitar sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 500));
          return await this.extractDetalhe(codigo);
        } catch (error) {
          logger.warn(`Falha ao extrair detalhes do bloco ${codigo}, continuando com os demais...`, error);
          return null;
        }
      });

      // Aguarda todas as promessas e filtra resultados nulos
      const detalhesResults = (await Promise.all(detalhesPromises)).filter(result => result !== null) as ResultadoExtracaoDetalhe[];

      logger.info(`Extração completa: ${listaResult.blocos.length} blocos e ${detalhesResults.length} detalhes`);

      return {
        lista: listaResult,
        detalhes: detalhesResults
      };
    } catch (error) {
      logger.error('Erro ao extrair todos os dados de blocos', error);
      throw error;
    }
  }
}

// Exporta uma instância do extrator
export const blocoExtractor = new BlocoExtractor();

// Exemplo de uso:
if (require.main === module) {
  // Se executado diretamente (não importado como módulo)
  (async () => {
    try {
      logger.info('Iniciando extração de blocos parlamentares');
      const resultado = await blocoExtractor.extractAll();
      logger.info(`Extração concluída: ${resultado.lista.total} blocos extraídos`);
      console.log(`Primeiro bloco: ${JSON.stringify(resultado.lista.blocos[0], null, 2)}`);

      if (resultado.detalhes.length > 0) {
        console.log(`Exemplo de detalhe: ${JSON.stringify(resultado.detalhes[0], null, 2)}`);
      }
    } catch (error) {
      logger.error('Erro ao executar o script', error);
      process.exit(1);
    }
  })();
}
