/**
 * Utilitário para obter informações sobre a legislatura atual
 */
import * as api from '../api';
import { endpoints } from '../api';
import { logger } from '../logging';
import { withRetry } from '../logging';

/**
 * Interface para a estrutura de uma Legislatura
 */
export interface Legislatura {
  NumeroLegislatura: string;
  DataInicio: string;
  DataFim: string;
  DataEleicao?: string;
  SessoesLegislativas?: {
    SessaoLegislativa: Array<{
      NumeroSessaoLegislativa: string;
      TipoSessaoLegislativa: string;
      DataInicio: string;
      DataFim: string;
      DataInicioIntervalo?: string;
      DataFimIntervalo?: string;
    }> | {
      NumeroSessaoLegislativa: string;
      TipoSessaoLegislativa: string;
      DataInicio: string;
      DataFim: string;
      DataInicioIntervalo?: string;
      DataFimIntervalo?: string;
    };
  };
}

/**
 * Obtém a legislatura atual baseada na data informada
 * @param data - Data no formato YYYYMMDD. Se não informada, usa a data atual
 */
export async function obterLegislaturaAtual(data?: string): Promise<Legislatura | null> {
  // Se não informou a data, usa a data atual no formato YYYYMMDD
  if (!data) {
    const hoje = new Date();
    data = hoje.getFullYear().toString() +
          (hoje.getMonth() + 1).toString().padStart(2, '0') +
          hoje.getDate().toString().padStart(2, '0');
  }
  
  logger.info(`Obtendo legislatura para a data ${data}`);
  
  try {
    // Substituir o parâmetro {data} no caminho
    const endpoint = api.replacePath(endpoints.LEGISLATURA.POR_DATA.PATH, { data });
    
    // Fazer a requisição usando o utilitário de API
    const response = await withRetry(
      async () => api.get(endpoint, endpoints.LEGISLATURA.POR_DATA.PARAMS),
      endpoints.REQUEST.RETRY_ATTEMPTS,
      endpoints.REQUEST.RETRY_DELAY,
      `Obter legislatura ${data}`
    );
    
    // Extrair a legislatura da resposta
    const legislaturas = response?.ListaLegislatura?.Legislaturas?.Legislatura || [];
    
    if (legislaturas.length > 0) {
      // Pega a primeira legislatura da lista (geralmente é só uma)
      const legislatura = Array.isArray(legislaturas) ? legislaturas[0] : legislaturas;
      
      logger.info(`Legislatura atual: ${legislatura.NumeroLegislatura} (${legislatura.DataInicio} a ${legislatura.DataFim})`);
      
      return legislatura;
    } else {
      logger.warn(`Nenhuma legislatura encontrada para a data ${data}`);
      return null;
    }
  } catch (error) {
    logger.error(`Erro ao obter legislatura para a data ${data}`, error);
    throw error;
  }
}

/**
 * Obtém o número da legislatura atual
 */
export async function obterNumeroLegislaturaAtual(data?: string): Promise<number | null> {
  const legislatura = await obterLegislaturaAtual(data);
  
  if (legislatura) {
    return parseInt(legislatura.NumeroLegislatura, 10);
  }
  
  return null;
}
