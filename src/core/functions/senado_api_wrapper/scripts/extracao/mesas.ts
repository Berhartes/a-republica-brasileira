/**
 * Extrator para Mesas Diretoras
 */
import { logger } from '../utils/logger';
import * as api from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/error_handler';

// Interfaces para tipagem dos dados
interface MesaDiretora {
  Colegiado?: {
    CodigoColegiado?: string | number;
    NomeColegiado?: string;
    SiglaColegiado?: string;
  };
  Cargos?: {
    Cargo: Array<{
      CodigoCargo?: string | number;
      DescricaoCargo?: string;
      Parlamentar?: {
        IdentificacaoParlamentar?: {
          CodigoParlamentar?: string | number;
          NomeParlamentar?: string;
          SiglaPartidoParlamentar?: string;
          UfParlamentar?: string;
        };
      };
    }> | {
      CodigoCargo?: string | number;
      DescricaoCargo?: string;
      Parlamentar?: {
        IdentificacaoParlamentar?: {
          CodigoParlamentar?: string | number;
          NomeParlamentar?: string;
          SiglaPartidoParlamentar?: string;
          UfParlamentar?: string;
        };
      };
    };
  };
}

interface ResultadoExtracao {
  timestamp: string;
  tipo: 'senado' | 'congresso';
  dados: any;
}

export interface ResultadoCompletoExtracao {
  timestamp: string;
  mesas: {
    senado: ResultadoExtracao;
    congresso: ResultadoExtracao;
  };
}

/**
 * Classe para extração de dados de mesas diretoras
 */
export class MesaExtractor {
  /**
   * Extrai informações da Mesa do Senado Federal
   */
  async extractMesaSenado(): Promise<ResultadoExtracao> {
    logger.info('Extraindo informações da Mesa do Senado Federal');
    
    try {
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoints.COMPOSICAO.MESAS.SENADO.PATH, endpoints.COMPOSICAO.MESAS.SENADO.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        'Extração da Mesa do Senado'
      );
      
      logger.info('Extração da Mesa do Senado concluída com sucesso');
      
      // Preserva a estrutura completa do JSON para processamento posterior
      return {
        timestamp: new Date().toISOString(),
        tipo: 'senado',
        dados: response // Mantém o objeto response completo
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair Mesa do Senado: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Extrai informações da Mesa do Congresso Nacional
   */
  async extractMesaCongresso(): Promise<ResultadoExtracao> {
    logger.info('Extraindo informações da Mesa do Congresso Nacional');
    
    try {
      // Fazer a requisição usando o utilitário de API
      const response = await withRetry(
        async () => api.get(endpoints.COMPOSICAO.MESAS.CONGRESSO.PATH, endpoints.COMPOSICAO.MESAS.CONGRESSO.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        'Extração da Mesa do Congresso'
      );
      
      logger.info('Extração da Mesa do Congresso concluída com sucesso');
      
      // Preserva a estrutura completa do JSON para processamento posterior
      return {
        timestamp: new Date().toISOString(),
        tipo: 'congresso',
        dados: response // Mantém o objeto response completo
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair Mesa do Congresso: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Extrai informações de todas as mesas diretoras
   */
  async extractAll(): Promise<ResultadoCompletoExtracao> {
    logger.info('Iniciando extração de todas as mesas diretoras');
    
    try {
      // Executar as extrações em paralelo para maior eficiência
      const [mesaSenado, mesaCongresso] = await Promise.all([
        this.extractMesaSenado(),
        this.extractMesaCongresso()
      ]);
      
      logger.info('Extração de todas as mesas diretoras concluída com sucesso');
      
      return {
        timestamp: new Date().toISOString(),
        mesas: {
          senado: mesaSenado,
          congresso: mesaCongresso
        }
      };
    } catch (error: any) {
      logger.error(`Erro na extração das mesas diretoras: ${error.message}`, error);
      throw error;
    }
  }
}

// Exporta uma instância do extrator
export const mesaExtractor = new MesaExtractor();

// Exemplo de uso:
if (require.main === module) {
  // Se executado diretamente (não importado como módulo)
  (async () => {
    try {
      logger.info('Iniciando extração de mesas diretoras');
      const resultado = await mesaExtractor.extractAll();
      logger.info('Extração concluída com sucesso');
      logger.info(`Mesa do Senado extraída em: ${resultado.mesas.senado.timestamp}`);
      logger.info(`Mesa do Congresso extraída em: ${resultado.mesas.congresso.timestamp}`);
    } catch (error) {
      logger.error('Erro ao executar o script', error);
      process.exit(1);
    }
  })();
}
