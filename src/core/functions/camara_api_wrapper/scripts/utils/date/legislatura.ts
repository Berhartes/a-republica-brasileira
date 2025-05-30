/**
 * Utilitário para obter informações sobre a legislatura atual
 */
import * as api from '../api';
import { endpoints } from '../api';
import { logger } from '../logging';
import { withRetry } from '../logging';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';

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
  const dataParaComparacao = data || new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  logger.info(`Obtendo legislatura para a data ${dataParaComparacao}`);

  try {
    // O endpoint /legislaturas não aceita o parâmetro 'data' para filtrar
    const endpoint = endpoints.LEGISLATURAS.LISTA.PATH;

    // Fazer a requisição usando o utilitário de API, removendo o parâmetro 'data' dos PARAMS
    const { data: _, ...paramsSemData } = endpoints.LEGISLATURAS.LISTA.PARAMS;
    const response = await withRetry(
      async () => api.get(endpoint, paramsSemData),
      endpoints.REQUEST.RETRY_ATTEMPTS,
      endpoints.REQUEST.RETRY_DELAY,
      `Obter lista de legislaturas`
    );

    const legislaturas = response?.dados || []; // A API da Câmara retorna 'dados'

    if (legislaturas.length > 0) {
      // Encontrar a legislatura que engloba a data atual
      const dataAtualObj = new Date(
        parseInt(dataParaComparacao.slice(0, 4)),
        parseInt(dataParaComparacao.slice(4, 6)) - 1,
        parseInt(dataParaComparacao.slice(6, 8))
      );

      const legislaturaEncontrada = legislaturas.find((leg: any) => {
        const inicio = new Date(leg.dataInicio);
        const fim = new Date(leg.dataFim);
        return dataAtualObj >= inicio && dataAtualObj <= fim;
      });

      if (legislaturaEncontrada) {
        logger.info(`Legislatura atual: ${legislaturaEncontrada.id} (${legislaturaEncontrada.dataInicio} a ${legislaturaEncontrada.dataFim})`);
        // Mapear para a interface Legislatura
        return {
          NumeroLegislatura: legislaturaEncontrada.id.toString(),
          DataInicio: legislaturaEncontrada.dataInicio,
          DataFim: legislaturaEncontrada.dataFim,
        };
      } else {
        logger.warn(`Nenhuma legislatura encontrada para a data ${dataParaComparacao}`);
        return null;
      }
    } else {
      logger.warn(`Nenhuma legislatura retornada pela API.`);
      return null;
    }
  } catch (error) {
    logger.error(`Erro ao obter legislatura para a data ${dataParaComparacao}`, error);
    throw error;
  }
}

/**
 * Obtém o período (DataInicio e DataFim) de uma legislatura a partir do arquivo XML.
 * @param numeroLegislatura - O número da legislatura desejada.
 * @returns Um objeto contendo DataInicio e DataFim, ou null se a legislatura não for encontrada.
 */
export async function obterPeriodoLegislatura(numeroLegislatura: number): Promise<{ DataInicio: string; DataFim: string } | null> {
  try {
    const xmlData = fs.readFileSync('src/core/functions/senado_api_wrapper/scripts/ListaLegislatura.xml', 'utf-8');
    const parser = new XMLParser({ ignoreAttributes: false });
    const jsonData = parser.parse(xmlData);

    const legislaturas = jsonData?.ListaLegislatura?.Legislaturas?.Legislatura;

    if (legislaturas) {
      const legislaturaEncontrada = legislaturas.find((legislatura: any) => {
        return parseInt(legislatura.NumeroLegislatura, 10) === numeroLegislatura;
      });

      if (legislaturaEncontrada) {
        return {
          DataInicio: legislaturaEncontrada.DataInicio,
          DataFim: legislaturaEncontrada.DataFim,
        };
      }
    }

    logger.warn(`Legislatura ${numeroLegislatura} não encontrada no arquivo XML.`);
    return null;
  } catch (error) {
    logger.error(`Erro ao ler ou analisar o arquivo XML:`, error);
    return null;
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
