/**
 * Extrator para Legislatura
 */
import { logger } from '../utils/logger';
import * as api from '../utils/api';
import { endpoints } from '../config/endpoints';

// Interface para Sessão Legislativa
interface SessaoLegislativa {
  NumeroSessaoLegislativa: string;
  TipoSessaoLegislativa: string;
  DataInicio: string;
  DataFim: string;
  DataInicioIntervalo?: string;
  DataFimIntervalo?: string;
}

// Interface para Legislatura
interface Legislatura {
  NumeroLegislatura: string;
  DataInicio: string;
  DataFim: string;
  DataEleicao: string;
  SessoesLegislativas: {
    SessaoLegislativa: SessaoLegislativa[] | SessaoLegislativa;
  };
}

// Interface para o resultado da extração
interface ResultadoExtracao {
  timestamp: string;
  legislaturaAtual: number;
  legislatura: Legislatura;
}

/**
 * Classe para extração de dados de legislatura
 */
export class LegislaturaExtractor {
  /**
   * Obtém a legislatura atual com base na data fornecida
   * @param data - Data no formato YYYYMMDD, se omitida usa a data atual
   */
  async obterLegislaturaAtual(data?: string): Promise<ResultadoExtracao> {
    // Se não foi fornecida data, usa a data atual no formato YYYYMMDD
    if (!data) {
      const hoje = new Date();
      data = hoje.getFullYear().toString() +
             (hoje.getMonth() + 1).toString().padStart(2, '0') +
             hoje.getDate().toString().padStart(2, '0');
    }
    
    logger.info(`Extraindo dados da legislatura para a data ${data}`);
    
    try {
      // Substituir {data} no endpoint
      const endpoint = api.replacePath(endpoints.LEGISLATURA.POR_DATA.PATH, { data });
      
      // Fazer a requisição
      const response = await api.get(endpoint, endpoints.LEGISLATURA.POR_DATA.PARAMS);
      
      // Extrair a legislatura da resposta
      const legislaturas = response?.ListaLegislatura?.Legislaturas?.Legislatura;
      
      if (!legislaturas || (Array.isArray(legislaturas) && legislaturas.length === 0)) {
        throw new Error('Nenhuma legislatura encontrada para a data informada');
      }
      
      // Se for um array, pega a primeira (mas normalmente é só uma)
      const legislatura = Array.isArray(legislaturas) ? legislaturas[0] : legislaturas;
      
      // Converte o número da legislatura para número
      const numeroLegislatura = parseInt(legislatura.NumeroLegislatura, 10);
      
      logger.info(`Legislatura atual: ${numeroLegislatura} (${legislatura.DataInicio} a ${legislatura.DataFim})`);
      
      return {
        timestamp: new Date().toISOString(),
        legislaturaAtual: numeroLegislatura,
        legislatura: legislatura
      };
    } catch (error) {
      logger.error('Erro ao extrair dados da legislatura atual', error);
      throw error;
    }
  }
}

// Exporta uma instância do extrator
export const legislaturaExtractor = new LegislaturaExtractor();

// Exemplo de uso:
if (require.main === module) {
  // Se executado diretamente (não importado como módulo)
  (async () => {
    try {
      logger.info('Iniciando extração da legislatura atual');
      const resultado = await legislaturaExtractor.obterLegislaturaAtual();
      logger.info(`Extração concluída: Legislatura ${resultado.legislaturaAtual}`);
      console.log(`Detalhes da legislatura: ${JSON.stringify(resultado.legislatura, null, 2)}`);
    } catch (error) {
      logger.error('Erro ao executar o script', error);
      process.exit(1);
    }
  })();
}
