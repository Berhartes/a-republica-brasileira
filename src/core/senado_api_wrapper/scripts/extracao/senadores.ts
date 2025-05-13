/**
 * Extrator para Senadores em Exercício
 */
import { logger } from '../utils/logger';
import * as api from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/error_handler';

// Interfaces para tipagem dos dados
interface IdentificacaoParlamentar {
  CodigoParlamentar: string | number;
  CodigoPublicoNaLegAtual?: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar: string;
  SexoParlamentar: string;
  FormaTratamento?: string;
  UrlFotoParlamentar?: string;
  UrlPaginaParlamentar?: string;
  UrlPaginaParticular?: string;
  EmailParlamentar?: string;
  Telefones?: {
    Telefone: Array<{
      NumeroTelefone: string;
      OrdemPublicacao: string;
      IndicadorFax: string;
    }> | {
      NumeroTelefone: string;
      OrdemPublicacao: string;
      IndicadorFax: string;
    };
  };
  SiglaPartidoParlamentar: string;
  UfParlamentar: string;
  Bloco?: {
    CodigoBloco: string | number;
    NomeBloco: string;
    NomeApelido?: string;
    DataCriacao?: string;
  };
  MembroMesa: string;
  MembroLideranca: string;
}

interface Mandato {
  CodigoMandato: string | number;
  UfParlamentar: string;
  PrimeiraLegislaturaDoMandato: {
    NumeroLegislatura: string | number;
    DataInicio: string;
    DataFim: string;
  };
  SegundaLegislaturaDoMandato?: {
    NumeroLegislatura: string | number;
    DataInicio: string;
    DataFim: string;
  };
  DescricaoParticipacao: string;
  Suplentes?: {
    Suplente: Array<{
      DescricaoParticipacao: string;
      CodigoParlamentar: string | number;
      NomeParlamentar: string;
    }> | {
      DescricaoParticipacao: string;
      CodigoParlamentar: string | number;
      NomeParlamentar: string;
    };
  };
  Titular?: {
    DescricaoParticipacao: string;
    CodigoParlamentar: string | number;
    NomeParlamentar: string;
  };
  Exercicios: {
    Exercicio: Array<{
      CodigoExercicio: string | number;
      DataInicio: string;
      DataFim?: string;
      SiglaCausaAfastamento?: string;
      DescricaoCausaAfastamento?: string;
    }> | {
      CodigoExercicio: string | number;
      DataInicio: string;
      DataFim?: string;
      SiglaCausaAfastamento?: string;
      DescricaoCausaAfastamento?: string;
    };
  };
}

interface Parlamentar {
  IdentificacaoParlamentar: IdentificacaoParlamentar;
  Mandato: Mandato;
}

interface ResultadoExtracao {
  timestamp: string;
  origem: any; // Changed from string to any to allow objects
  senadores: Parlamentar[];
  metadados: any;
  erro?: string;
}

/**
 * Classe para extração de dados de senadores em exercício
 */
export class SenadoresExtractor {
  /**
   * Extrai a lista de senadores em exercício
   */
  async extractSenadoresAtuais(): Promise<ResultadoExtracao> {
    logger.info('Extraindo lista de senadores em exercício');
    
    try {
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoints.SENADORES.LISTA_ATUAL.PATH, endpoints.SENADORES.LISTA_ATUAL.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        'Extração lista de senadores atuais'
      );
      
      // Verificar se a resposta tem o formato esperado
      if (!response || !response.ListaParlamentarEmExercicio || !response.ListaParlamentarEmExercicio.Parlamentares) {
        logger.warn('Formato de resposta inválido para lista de senadores atuais');
        return {
          timestamp: new Date().toISOString(),
          origem: endpoints.SENADORES.LISTA_ATUAL,
          senadores: [],
          metadados: {}
        };
      }
      
      // Extrair a lista de parlamentares
      const parlamentares = response.ListaParlamentarEmExercicio.Parlamentares.Parlamentar || [];
      
      // Garantir que temos um array de parlamentares
      const senadores = Array.isArray(parlamentares) ? parlamentares : [parlamentares];
      
      logger.info(`Extraídos ${senadores.length} senadores em exercício`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoints.SENADORES.LISTA_ATUAL,
        senadores: senadores,
        metadados: response.ListaParlamentarEmExercicio.Metadados || {}
      };
    } catch (error) {
      logger.error('Erro ao extrair lista de senadores em exercício', error);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoints.SENADORES.LISTA_ATUAL,
        senadores: [],
        metadados: {},
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Extrai detalhes de um senador específico
   */
  async extractDetalhesParlamentar(codigo: string | number): Promise<any> {
    logger.info(`Extraindo detalhes do parlamentar ${codigo}`);
    
    try {
      // Substituir o parâmetro {codigo} no caminho
      const endpoint = api.replacePath(endpoints.SENADORES.PERFIL.PATH, { codigo });
      
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoint, endpoints.SENADORES.PERFIL.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração detalhes do parlamentar ${codigo}`
      );
      
      // Extrair os detalhes do parlamentar
      const detalhes = response?.DetalheParlamentar?.Parlamentar || {};
      
      return {
        timestamp: new Date().toISOString(),
        codigo: codigo,
        detalhes: detalhes
      };
    } catch (error) {
      logger.error(`Erro ao extrair detalhes do parlamentar ${codigo}`, error);
      throw error;
    }
  }
}

// Exporta uma instância do extrator
export const senadoresExtractor = new SenadoresExtractor();

// Exemplo de uso:
if (require.main === module) {
  // Se executado diretamente (não importado como módulo)
  (async () => {
    try {
      logger.info('Iniciando extração de senadores em exercício');
      const resultado = await senadoresExtractor.extractSenadoresAtuais();
      logger.info(`Extração concluída: ${resultado.senadores.length} senadores extraídos`);
      
      if (resultado.senadores.length > 0) {
        console.log(`Primeiro senador: ${resultado.senadores[0].IdentificacaoParlamentar.NomeParlamentar}`);
        
        // Extrair detalhes do primeiro senador como exemplo
        const codigoParlamentar = resultado.senadores[0].IdentificacaoParlamentar.CodigoParlamentar;
        logger.info(`Extraindo detalhes do senador ${codigoParlamentar}`);
        
        const detalhes = await senadoresExtractor.extractDetalhesParlamentar(codigoParlamentar);
        logger.info(`Detalhes do senador ${codigoParlamentar} extraídos com sucesso`);
      }
    } catch (error) {
      logger.error('Erro ao executar o script', error);
      process.exit(1);
    }
  })();
}
