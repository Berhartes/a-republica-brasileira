/**
 * Extrator para Lideranças do Senado Federal
 */
import { logger } from '../utils/logger';
import * as api from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/error_handler';

// Interfaces para tipagem dos dados
interface Lideranca {
  Codigo?: string | number;
  Nome?: string;
  Descricao?: string;
  TipoLideranca?: {
    Codigo?: string | number;
    Descricao?: string;
  };
  Parlamentar?: {
    IdentificacaoParlamentar?: {
      CodigoParlamentar?: string | number;
      NomeParlamentar?: string;
      SiglaPartidoParlamentar?: string;
      UfParlamentar?: string;
    };
  };
}

interface TipoLideranca {
  Codigo?: string | number;
  Descricao?: string;
}

interface TipoUnidade {
  Codigo?: string | number;
  Descricao?: string;
}

interface TipoCargo {
  Codigo?: string | number;
  Descricao?: string;
}

interface ResultadoExtracaoLiderancas {
  timestamp: string;
  liderancas: any;
}

interface ResultadoExtracaoTiposUnidade {
  timestamp: string;
  tiposUnidade: any;
}

interface ResultadoExtracaoTiposLideranca {
  timestamp: string;
  tiposLideranca: any;
}

interface ResultadoExtracaoTiposCargo {
  timestamp: string;
  tiposCargo: any;
}

interface ResultadoCompletoExtracao {
  timestamp: string;
  liderancas: any;
  referencias: {
    tiposUnidade: any;
    tiposLideranca: any;
    tiposCargo: any;
  };
}

/**
 * Classe para extração de dados de lideranças
 */
export class LiderancaExtractor {
  /**
   * Extrai informações de lideranças atuais
   */
  async extractLiderancas(): Promise<ResultadoExtracaoLiderancas> {
    logger.info('Extraindo informações de lideranças atuais');
    
    try {
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoints.COMPOSICAO.LIDERANCAS.LISTA.PATH, endpoints.COMPOSICAO.LIDERANCAS.LISTA.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        'Extração de lideranças'
      );
      
      logger.info('Extração de lideranças concluída com sucesso');
      
      // Preserva a estrutura completa do JSON para processamento posterior
      return {
        timestamp: new Date().toISOString(),
        liderancas: response
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair lideranças: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Extrai tipos de unidade de liderança
   */
  async extractTiposUnidade(): Promise<ResultadoExtracaoTiposUnidade> {
    logger.info('Extraindo tipos de unidade de liderança');
    
    try {
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoints.COMPOSICAO.LIDERANCAS.TIPOS_UNIDADE.PATH, endpoints.COMPOSICAO.LIDERANCAS.TIPOS_UNIDADE.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        'Extração de tipos de unidade'
      );
      
      logger.info('Extração de tipos de unidade concluída com sucesso');
      
      return {
        timestamp: new Date().toISOString(),
        tiposUnidade: response
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair tipos de unidade: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Extrai tipos de liderança
   */
  async extractTiposLideranca(): Promise<ResultadoExtracaoTiposLideranca> {
    logger.info('Extraindo tipos de liderança');
    
    try {
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoints.COMPOSICAO.LIDERANCAS.TIPOS_LIDERANCA.PATH, endpoints.COMPOSICAO.LIDERANCAS.TIPOS_LIDERANCA.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        'Extração de tipos de liderança'
      );
      
      logger.info('Extração de tipos de liderança concluída com sucesso');
      
      return {
        timestamp: new Date().toISOString(),
        tiposLideranca: response
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair tipos de liderança: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Extrai tipos de cargo
   */
  async extractTiposCargo(): Promise<ResultadoExtracaoTiposCargo> {
    logger.info('Extraindo tipos de cargo');
    
    try {
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoints.COMPOSICAO.LIDERANCAS.TIPOS_CARGO.PATH, endpoints.COMPOSICAO.LIDERANCAS.TIPOS_CARGO.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        'Extração de tipos de cargo'
      );
      
      logger.info('Extração de tipos de cargo concluída com sucesso');
      
      return {
        timestamp: new Date().toISOString(),
        tiposCargo: response
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair tipos de cargo: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Extrai todas as informações relacionadas a lideranças
   */
  async extractAll(): Promise<ResultadoCompletoExtracao> {
    logger.info('Iniciando extração de dados de lideranças');
    
    try {
      // Extrair todos os dados em paralelo para eficiência
      const [liderancasData, tiposUnidadeData, tiposLiderancaData, tiposCargoData] = 
        await Promise.all([
          this.extractLiderancas(),
          this.extractTiposUnidade(),
          this.extractTiposLideranca(),
          this.extractTiposCargo()
        ]);
      
      logger.info('Extração de dados de lideranças concluída com sucesso');
      
      return {
        timestamp: new Date().toISOString(),
        liderancas: liderancasData.liderancas,
        referencias: {
          tiposUnidade: tiposUnidadeData.tiposUnidade,
          tiposLideranca: tiposLiderancaData.tiposLideranca,
          tiposCargo: tiposCargoData.tiposCargo
        }
      };
    } catch (error: any) {
      logger.error(`Erro na extração completa de lideranças: ${error.message}`, error);
      throw error;
    }
  }
}

// Exporta uma instância do extrator
export const liderancaExtractor = new LiderancaExtractor();

// Exemplo de uso:
if (require.main === module) {
  // Se executado diretamente (não importado como módulo)
  (async () => {
    try {
      logger.info('Iniciando extração de lideranças');
      const resultado = await liderancaExtractor.extractAll();
      logger.info('Extração concluída com sucesso');
      console.log('Tipos de liderança obtidos:', resultado.referencias.tiposLideranca ? 'Sim' : 'Não');
      console.log('Tipos de unidade obtidos:', resultado.referencias.tiposUnidade ? 'Sim' : 'Não');
      console.log('Tipos de cargo obtidos:', resultado.referencias.tiposCargo ? 'Sim' : 'Não');
    } catch (error) {
      logger.error('Erro ao executar o script', error);
      process.exit(1);
    }
  })();
}
