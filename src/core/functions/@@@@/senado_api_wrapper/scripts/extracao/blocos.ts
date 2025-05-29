/**
 * Extrator para Blocos Parlamentares
 */
import { logger } from '../utils/logging';
import * as api from '../utils/api';
import { endpoints } from '../utils/api/endpoints';
import { withRetry } from '../utils/logging';

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

interface ResultadoExtracao {
  timestamp: string;
  total: number;
  blocos: BlocoParlamentar[];
}

interface ResultadoExtracacaoDetalhe {
  timestamp: string;
  codigo: string | number;
  detalhes: any;
}

interface ResultadoCompleto {
  lista: ResultadoExtracao;
  detalhes: ResultadoExtracacaoDetalhe[];
}

/**
 * Classe para extração de dados de blocos parlamentares
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
   * Extrai detalhes de um bloco específico
   */
  async extractDetalhe(codigo: string | number): Promise<ResultadoExtracacaoDetalhe> {
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
      const detalhesResults = (await Promise.all(detalhesPromises)).filter(result => result !== null) as ResultadoExtracacaoDetalhe[];

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
