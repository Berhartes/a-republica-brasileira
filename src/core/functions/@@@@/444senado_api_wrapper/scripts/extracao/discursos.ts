/**
 * Módulo para extração de dados de discursos de senadores
 *
 * Este módulo implementa funções para extrair dados de discursos
 * da API do Senado Federal.
 */
import { logger } from '../utils/logging/logger';
import * as api from '../utils/api';
import { endpoints } from '../utils/api/endpoints';
import { withRetry } from '../utils/logging/error-handler';

/**
 * Interface para resultado de extração de discursos
 */
export interface DiscursoResult {
  timestamp: string;
  codigo: string | number;
  dadosBasicos?: any;
  discursos?: any;
  erro?: string;
}

/**
 * Interface para dados de um discurso
 */
interface Discurso {
  CodigoTexto: string | number;
  TipoTexto: string;
  DataTexto: string;
  UrlTexto?: string;
  AutorTexto?: {
    IdentificacaoParlamentar?: {
      CodigoParlamentar: string | number;
      NomeParlamentar: string;
      SiglaPartidoParlamentar?: string;
      UfParlamentar?: string;
    };
  };
  Assunto?: string;
  Indexacao?: string;
  Sumario?: string;
}

/**
 * Interface para resultado de extração de discursos de legislatura
 */
interface ResultadoDiscursosLegislatura {
  timestamp: string;
  legislatura: number;
  discursos: Discurso[];
  total: number;
}

/**
 * Classe para extração de dados de discursos de senadores
 */
export class DiscursosExtractor {
  /**
   * Extrai discursos de um senador específico
   * @param codigoSenador - Código do senador na API
   * @param dataInicio - Data de início no formato YYYY-MM-DD (opcional)
   * @param dataFim - Data de fim no formato YYYY-MM-DD (opcional)
   * @returns Discursos do senador
   */
  async extractDiscursosSenador(
    codigoSenador: string | number,
    dataInicio?: string,
    dataFim?: string
  ): Promise<DiscursoResult> {
    try {
      logger.info(`Extraindo discursos do senador código ${codigoSenador}`);

      // 1. Extrair dados básicos
      const dadosBasicos = await this.extractDadosBasicos(codigoSenador);

      // Verificar se os dados básicos foram obtidos com sucesso
      if (!dadosBasicos || !dadosBasicos.dados) {
        logger.warn(`Dados básicos não obtidos para o senador ${codigoSenador}, abortando extração de discursos`);
        return {
          timestamp: new Date().toISOString(),
          codigo: codigoSenador,
          dadosBasicos: dadosBasicos,
          erro: "Dados básicos não obtidos, extração incompleta"
        };
      }

      // 2. Extrair discursos
      const discursos = await this.extractDiscursosDetalhados(codigoSenador, dataInicio, dataFim);

      // 3. Consolidar todos os dados
      const discursosCompletos: DiscursoResult = {
        timestamp: new Date().toISOString(),
        codigo: codigoSenador,
        dadosBasicos: dadosBasicos,
        discursos: discursos
      };

      return discursosCompletos;
    } catch (error: any) {
      logger.error(`Erro ao extrair discursos do senador ${codigoSenador}: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        codigo: codigoSenador,
        erro: error.message
      };
    }
  }

  /**
   * Extrai dados básicos de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Dados básicos do senador
   */
  async extractDadosBasicos(codigoSenador: string | number): Promise<any> {
    try {
      logger.info(`Extraindo dados básicos do senador código ${codigoSenador}`);

      const endpointConfig = endpoints.SENADORES.PERFIL;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração dados básicos do senador ${codigoSenador}`
      );

      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response,
        metadados: {}
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair dados básicos do senador ${codigoSenador}: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        origem: api.replacePath(endpoints.SENADORES.PERFIL.PATH, { codigo: codigoSenador.toString() }),
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }

  /**
   * Extrai discursos detalhados de um senador
   * @param codigoSenador - Código do senador na API
   * @param dataInicio - Data de início no formato YYYY-MM-DD (opcional)
   * @param dataFim - Data de fim no formato YYYY-MM-DD (opcional)
   * @returns Discursos detalhados do senador
   */
  async extractDiscursosDetalhados(
    codigoSenador: string | number,
    dataInicio?: string,
    dataFim?: string
  ): Promise<any> {
    try {
      if (dataInicio && dataFim) {
        logger.info(`Extraindo discursos do senador código ${codigoSenador} no período de ${dataInicio} a ${dataFim}`);
      } else {
        logger.info(`Extraindo discursos do senador código ${codigoSenador} (sem período específico)`);
      }

      // Construir parâmetros da requisição
      const params: Record<string, any> = { ...endpoints.SENADORES.DISCURSOS.PARAMS };

      // Adicionar parâmetros de data se fornecidos
      if (dataInicio) {
        params.dataInicio = dataInicio;
      }
      if (dataFim) {
        params.dataFim = dataFim;
      }

      // Adicionar código do senador
      params.codigoParlamentar = codigoSenador.toString();

      logger.info(`Fazendo requisição para discursos com parâmetros: ${JSON.stringify(params)}`);

      // Fazer a requisição
      const endpoint = api.replacePath(endpoints.SENADORES.DISCURSOS.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, params),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração discursos do senador ${codigoSenador}`
      );

      // Log para depuração da estrutura de dados retornada
      if (response) {
        logger.info(`Resposta recebida da API. Estrutura de dados: ${JSON.stringify(Object.keys(response), null, 2)}`);
      }

      return {
        timestamp: new Date().toISOString(),
        origem: `${endpoint}?codigoParlamentar=${codigoSenador}${dataInicio ? `&dataInicio=${dataInicio}` : ''}${dataFim ? `&dataFim=${dataFim}` : ''}`,
        dados: response,
        metadados: {
          senadorCodigo: codigoSenador.toString()
        }
      };
    } catch (error: any) {
      logger.error(`Erro ao extrair discursos do senador ${codigoSenador}: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        origem: `discursos?codigoParlamentar=${codigoSenador}${dataInicio ? `&dataInicio=${dataInicio}` : ''}${dataFim ? `&dataFim=${dataFim}` : ''}`,
        dados: null,
        metadados: {
          senadorCodigo: codigoSenador.toString()
        },
        erro: error.message
      };
    }
  }

  /**
   * Extrai discursos de uma legislatura específica
   * @param legislatura - Número da legislatura
   * @param dataInicio - Data de início no formato YYYY-MM-DD (opcional)
   * @param dataFim - Data de fim no formato YYYY-MM-DD (opcional)
   * @returns Discursos da legislatura
   */
  async extractDiscursosLegislatura(
    legislatura: number,
    dataInicio?: string,
    dataFim?: string
  ): Promise<DiscursoResult[]> {
    try {
      logger.info(`Extraindo discursos da legislatura ${legislatura}`);

      // Importar o extrator de perfis para buscar senadores
      const { perfilSenadoresExtractor } = await import('./perfilsenadores');
      
      // 1. Buscar lista de senadores da legislatura
      const senadoresExtraidos = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura);
      
      if (!senadoresExtraidos.senadores || senadoresExtraidos.senadores.length === 0) {
        logger.warn(`Nenhum senador encontrado para a legislatura ${legislatura}`);
        return [];
      }

      // 2. Extrair códigos dos senadores
      const codigosSenadores = senadoresExtraidos.senadores
        .map(s => s.IdentificacaoParlamentar?.CodigoParlamentar)
        .filter(Boolean) as string[];

      logger.info(`🔍 ${codigosSenadores.length} senadores encontrados na legislatura ${legislatura}`);
      
      // 3. Para cada senador, buscar discursos
      const discursosLegislatura: DiscursoResult[] = [];
      
      for (const [index, codigoSenador] of codigosSenadores.entries()) {
        try {
          logger.info(`👤 Processando discursos do senador ${index + 1}/${codigosSenadores.length}: código ${codigoSenador}`);
          
          // Extrair discursos do senador no período especificado
          const discursosSenador = await this.extractDiscursosSenador(
            codigoSenador,
            dataInicio,
            dataFim
          );
          
          discursosLegislatura.push(discursosSenador);
          
          // Pausa entre requisições para não sobrecarregar a API
          if (index < codigosSenadores.length - 1) {
            logger.debug(`⏱️ Aguardando 2 segundos antes do próximo senador...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error: any) {
          logger.error(`Erro ao extrair discursos do senador ${codigoSenador}: ${error.message}`);
          
          // Adicionar resultado de erro
          discursosLegislatura.push({
            timestamp: new Date().toISOString(),
            codigo: codigoSenador,
            erro: error.message
          });
        }
      }
      
      logger.info(`✅ Extração concluída: ${discursosLegislatura.length} senadores processados`);
      return discursosLegislatura;
      
    } catch (error: any) {
      logger.error(`Erro ao extrair discursos da legislatura ${legislatura}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai discursos por período de mandato
   * @param codigoSenador - Código do senador na API
   * @param dataInicioMandato - Data de início do mandato (formato YYYY-MM-DD)
   * @param dataFimMandato - Data de fim do mandato (formato YYYY-MM-DD)
   * @returns Discursos do senador durante o período de mandato
   */
  async extractDiscursosPorPeriodoMandato(
    codigoSenador: string | number,
    dataInicioMandato: string,
    dataFimMandato: string
  ): Promise<any[]> {
    try {
      logger.info(`Extraindo discursos do senador ${codigoSenador} durante o mandato (${dataInicioMandato} a ${dataFimMandato})`);

      // Converter datas para objetos Date
      const dataInicio = new Date(dataInicioMandato);
      // Se a data de fim for futura, usar a data atual
      const hoje = new Date();
      const dataFim = new Date(dataFimMandato);
      const dataFimEfetiva = dataFim > hoje ? hoje : dataFim;

      // Dividir o período em intervalos de 180 dias (6 meses)
      const intervalos = this.gerarIntervalos180Dias(dataInicio, dataFimEfetiva);
      logger.info(`Período dividido em ${intervalos.length} intervalos de 180 dias para discursos`);

      // Extrair discursos para cada intervalo
      const resultados: any[] = [];

      for (const [index, intervalo] of intervalos.entries()) {
        logger.info(`Processando intervalo de discursos ${index + 1}/${intervalos.length}: ${intervalo.inicio.toISOString().slice(0, 10)} a ${intervalo.fim.toISOString().slice(0, 10)}`);

        // Formatar datas para o formato esperado pela API (YYYY-MM-DD)
        const dataInicioFormatada = this.formatarDataParaAPI(intervalo.inicio);
        const dataFimFormatada = this.formatarDataParaAPI(intervalo.fim);

        // Extrair discursos do intervalo
        const resultado = await this.extractDiscursosDetalhados(
          codigoSenador,
          dataInicioFormatada,
          dataFimFormatada
        );

        // Adicionar ao resultado apenas se houver dados
        if (resultado && resultado.dados) {
          resultados.push(resultado);
        }

        // Pausa entre requisições para não sobrecarregar a API
        if (index < intervalos.length - 1) {
          logger.debug(`Aguardando 1 segundo antes da próxima requisição de discursos...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info(`Extração de discursos por período concluída: ${resultados.length} intervalos com dados`);
      return resultados;
    } catch (error: any) {
      logger.error(`Erro ao extrair discursos por período do senador ${codigoSenador}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai discursos de um senador com tratamento de mandatos
   * Este método usa os mandatos do senador para otimizar as consultas
   * @param codigoSenador - Código do senador na API
   * @param legislatura - Número da legislatura
   * @returns Discursos do senador com base nos mandatos
   */
  async extractDiscursosComMandatos(
    codigoSenador: string | number,
    legislatura: number
  ): Promise<DiscursoResult> {
    try {
      logger.info(`Extraindo discursos com base em mandatos do senador ${codigoSenador}`);

      // 1. Extrair dados básicos
      const dadosBasicos = await this.extractDadosBasicos(codigoSenador);

      // Verificar se os dados básicos foram obtidos com sucesso
      if (!dadosBasicos || !dadosBasicos.dados) {
        logger.warn(`Dados básicos não obtidos para o senador ${codigoSenador}, abortando extração de discursos`);
        return {
          timestamp: new Date().toISOString(),
          codigo: codigoSenador,
          dadosBasicos: dadosBasicos,
          erro: "Dados básicos não obtidos, extração incompleta"
        };
      }

      // 2. Extrair mandatos (importar dinamicamente para evitar dependência circular)
      const { perfilSenadoresExtractor } = await import('./perfilsenadores');
      const mandatosSenador = await perfilSenadoresExtractor.extractMandatos(codigoSenador);

      if (!mandatosSenador || !mandatosSenador.dados) {
        logger.warn(`⚠️ Não foi possível obter mandatos para o senador ${codigoSenador}. Usando método padrão.`);
        
        // Usar método padrão se não conseguir obter mandatos
        return await this.extractDiscursosSenador(codigoSenador);
      }

      // 3. Processar mandatos
      const mandatosObj = mandatosSenador.dados;
      const mandatosArray = Array.isArray(mandatosObj.Mandato) ? mandatosObj.Mandato : [mandatosObj.Mandato];

      // Array para armazenar resultados por período
      let discursosPorPeriodo: any[] = [];

      // Processar cada mandato
      for (const [idxMandato, mandato] of mandatosArray.entries()) {
        // Extrair datas de início e fim do mandato
        let dataInicio = mandato?.DataInicio;
        let dataFim = mandato?.DataFim;

        // Se não encontrar datas, tentar obter da legislatura
        if (!dataInicio) {
          const { obterPeriodoLegislatura } = await import('../utils/date');
          const periodoLegislatura = await obterPeriodoLegislatura(legislatura);
          
          if (periodoLegislatura) {
            dataInicio = periodoLegislatura.DataInicio;
            dataFim = periodoLegislatura.DataFim;
            logger.debug(`📅 Período da legislatura ${legislatura} extraído: ${dataInicio} a ${dataFim}`);
          } else {
            const hoje = new Date();
            const quatroAnosAtras = new Date();
            quatroAnosAtras.setFullYear(hoje.getFullYear() - 4);

            dataInicio = quatroAnosAtras.toISOString().slice(0, 10);
            dataFim = hoje.toISOString().slice(0, 10);
            logger.warn(`⚠️ Usando período padrão de 4 anos: ${dataInicio} a ${dataFim}`);
          }
        }

        logger.debug(`📅 Processando mandato ${idxMandato + 1}/${mandatosArray.length}: ${dataInicio} a ${dataFim}`);

        // Extrair discursos por período de mandato
        const discursosMandato = await this.extractDiscursosPorPeriodoMandato(
          codigoSenador,
          dataInicio,
          dataFim
        );

        // Adicionar resultados ao array
        discursosPorPeriodo = [...discursosPorPeriodo, ...discursosMandato];
      }

      // 4. Consolidar resultados
      logger.debug(`🔄 Consolidando resultados de discursos para o senador ${codigoSenador}`);
      
      const discursosConsolidados = discursosPorPeriodo.length > 0
        ? this.consolidarResultadosDiscursos(discursosPorPeriodo)
        : null;

      // 5. Retornar resultado consolidado
      return {
        timestamp: new Date().toISOString(),
        codigo: codigoSenador,
        dadosBasicos: dadosBasicos,
        discursos: discursosConsolidados ? {
          timestamp: new Date().toISOString(),
          origem: `Consolidação de ${discursosPorPeriodo.length} períodos`,
          dados: discursosConsolidados,
          metadados: {
            senadorCodigo: codigoSenador.toString()
          }
        } : undefined
      };

    } catch (error: any) {
      logger.error(`Erro ao extrair discursos com mandatos do senador ${codigoSenador}: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        codigo: codigoSenador,
        erro: error.message
      };
    }
  }

  /**
   * Consolida resultados de discursos de múltiplos períodos
   * @param resultados - Array de resultados de discursos
   * @returns Dados consolidados
   */
  consolidarResultadosDiscursos(resultados: any[]): any {
    try {
      logger.info(`Consolidando ${resultados.length} resultados de discursos`);

      // Verificar se há resultados para consolidar
      if (!resultados || resultados.length === 0) {
        logger.warn('Nenhum resultado de discursos para consolidar');
        return null;
      }

      // Extrair todos os discursos de todos os períodos
      const todosDiscursos: any[] = [];

      for (const resultado of resultados) {
        if (!resultado || !resultado.dados) continue;

        // Log para depuração
        logger.debug(`Estrutura de dados do resultado: ${JSON.stringify(Object.keys(resultado.dados), null, 2)}`);

        // Verificar diferentes caminhos possíveis para os discursos
        let discursos = null;

        // Caminho 1: DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento
        if (resultado.dados.DiscursosParlamentar?.Parlamentar?.Pronunciamentos?.Pronunciamento) {
          discursos = resultado.dados.DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento;
          logger.info('Discursos encontrados no caminho DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento');
        }
        // Caminho 2: ListaTextos.Textos.Texto
        else if (resultado.dados.ListaTextos?.Textos?.Texto) {
          discursos = resultado.dados.ListaTextos.Textos.Texto;
          logger.info('Discursos encontrados no caminho ListaTextos.Textos.Texto');
        }
        // Caminho 3: discursos
        else if (resultado.dados.discursos) {
          discursos = resultado.dados.discursos;
          logger.info('Discursos encontrados no caminho discursos');
        }
        // Caminho 4: Array direto
        else if (Array.isArray(resultado.dados)) {
          discursos = resultado.dados;
          logger.info('Discursos encontrados como array direto');
        }
        // Caminho 5: Objeto com array
        else if (typeof resultado.dados === 'object' && resultado.dados !== null) {
          // Verificar se o objeto tem alguma propriedade que é um array
          for (const key in resultado.dados) {
            if (Array.isArray(resultado.dados[key])) {
              discursos = resultado.dados[key];
              logger.info(`Discursos encontrados na propriedade ${key}`);
              break;
            }
          }
        }

        if (!discursos) {
          logger.warn('Nenhum discurso encontrado nos dados. Estrutura completa:', resultado.dados);
          continue;
        }

        // Garantir que discursos seja um array
        const discursosArray = Array.isArray(discursos) ? discursos : [discursos];
        logger.info(`Adicionando ${discursosArray.length} discursos ao consolidado`);
        todosDiscursos.push(...discursosArray);
      }

      logger.info(`Consolidação concluída: ${todosDiscursos.length} discursos encontrados`);

      // Retornar objeto consolidado
      return {
        discursos: todosDiscursos
      };
    } catch (error: any) {
      logger.error(`Erro ao consolidar resultados de discursos: ${error.message}`);
      return null;
    }
  }

  /**
   * Gera intervalos de 180 dias entre duas datas
   * @param dataInicio - Data de início
   * @param dataFim - Data de fim
   * @returns Array de intervalos de 180 dias
   */
  private gerarIntervalos180Dias(dataInicio: Date, dataFim: Date): Array<{inicio: Date, fim: Date}> {
    const intervalos: Array<{inicio: Date, fim: Date}> = [];

    let dataAtual = new Date(dataInicio);

    while (dataAtual < dataFim) {
      // Calcular data de fim do intervalo (dataAtual + 180 dias)
      const dataFimIntervalo = new Date(dataAtual);
      dataFimIntervalo.setDate(dataFimIntervalo.getDate() + 180);

      // Se a data de fim do intervalo for posterior à data de fim total,
      // usar a data de fim total como limite
      const dataFimEfetiva = dataFimIntervalo > dataFim ? dataFim : dataFimIntervalo;

      // Adicionar intervalo à lista
      intervalos.push({
        inicio: new Date(dataAtual),
        fim: new Date(dataFimEfetiva)
      });

      // Avançar para o próximo intervalo
      dataAtual = new Date(dataFimIntervalo);
    }

    return intervalos;
  }

  /**
   * Formata uma data para o formato esperado pela API (YYYY-MM-DD)
   * @param data - Data a ser formatada
   * @returns Data formatada como string YYYY-MM-DD
   */
  private formatarDataParaAPI(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}

// Instância singleton para uso em toda a aplicação
export const discursosExtractor = new DiscursosExtractor();

// Interface para compatibilidade com o sistema
export type DiscursoExtractorResult = DiscursoResult;
