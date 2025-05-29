/**
 * Processador ETL para Despesas de Deputados da Câmara
 *
 * Implementa o fluxo ETL completo para extrair, transformar e carregar
 * despesas de deputados com suporte a paginação e modo incremental.
 */

import { ETLProcessor } from '../core/etl-processor';
import {
  ValidationResult,
  BatchResult,
  DespesaDeputado,
  DeputadoBasico,
  ETLOptions,
  ProcessingStatus, // Importar ProcessingStatus
  ETLResult, // Importar ETLResult
  ETLError // Importar ETLError
} from '../types/etl.types';
import { logger } from '../utils/logging';
import { createBatchManager } from '../utils/storage';
import { firestoreDb as getDb } from '../utils/storage/firestore'; // Importar getDb para leitura
import { etlConfig } from '../config/etl.config';
import { apiClient, get, replacePath } from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/logging/error-handler';

/**
 * Dados extraídos da API
 */
interface ExtractedData {
  deputados: DeputadoBasico[];
  despesasPorDeputado: Array<{
    deputadoId: string;
    despesas: any[];
    totalDespesas: number;
    totalPaginas: number;
    valorTotal: number;
    erro?: string;
  }>;
  totalProcessados: number;
}

/**
 * Dados transformados
 */
interface TransformedData {
  despesas: DespesaDeputado[];
  estatisticas: {
    totalDespesas: number;
    deputadosComDespesas: number;
    valorTotalGeral: number;
    despesasPorAno: Record<number, number>;
    despesasPorTipo: Record<string, number>;
  };
}

/**
 * Processador de Despesas de Deputados
 */
export class DespesasDeputadosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  constructor(options: ETLOptions) {
    super(options);
  }

  /**
   * Nome do processador
   */
  protected getProcessName(): string {
    return 'Processador de Despesas de Deputados';
  }

  /**
   * Validação específica do processador
   */
  async validate(): Promise<ValidationResult> {
    const baseValidation = this.validateCommonParams();
    const erros = [...baseValidation.erros];
    const avisos = [...baseValidation.avisos];

    // Validações específicas de despesas
    if (!this.context.options.legislatura) {
      erros.push('Legislatura é obrigatória para extrair despesas');
    }

    // Validar ano se especificado
    if (this.context.options.ano) {
      const ano = parseInt(this.context.options.ano);
      const anoAtual = new Date().getFullYear();

      if (isNaN(ano) || ano < 2000 || ano > anoAtual) {
        erros.push(`Ano inválido: ${this.context.options.ano}. Deve estar entre 2000 e ${anoAtual}.`);
      }
    }

    // Validar mês se especificado
    if (this.context.options.mes) {
      const mes = parseInt(this.context.options.mes);

      if (isNaN(mes) || mes < 1 || mes > 12) {
        erros.push(`Mês inválido: ${this.context.options.mes}. Deve estar entre 1 e 12.`);
      }
    }

    // Avisos sobre volume de dados
    if (!this.context.options.limite && !this.context.options.deputado) {
      avisos.push('Processamento sem limite pode ser muito demorado. Considere usar --limite ou --deputado específico.');
    }

    if (this.context.options.atualizar) {
      avisos.push('Modo atualização processará apenas despesas recentes (últimos 2 meses).');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Extração de dados da API da Câmara
   */
  async extract(): Promise<ExtractedData> {
    const legislatura = this.context.options.legislatura!;
    const limite = this.context.options.limite || 0;
    const deputadoEspecifico = this.context.options.deputado;
    const modoAtualizacao = this.context.options.atualizar || false;

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Iniciando extração de dados');

    try {
      let deputadosParaProcessar: DeputadoBasico[];

      if (deputadoEspecifico) {
        // Extrair apenas deputado específico
        this.context.logger.info(`🎯 Extraindo despesas do deputado específico: ${deputadoEspecifico}`);
        deputadosParaProcessar = await this.extractDeputadoEspecifico(deputadoEspecifico, legislatura);
      } else {
        // Extrair lista de deputados da legislatura
        this.context.logger.info(`📋 Extraindo lista de deputados da ${legislatura}ª Legislatura`);
        const listaCompleta = await this.extractDeputadosLegislatura(legislatura);

        // Aplicar filtros
        deputadosParaProcessar = this.applyFilters(listaCompleta);

        // Aplicar limite
        if (limite > 0 && deputadosParaProcessar.length > limite) {
          this.context.logger.info(`🔢 Aplicando limite: ${limite} de ${deputadosParaProcessar.length} deputados`);
          deputadosParaProcessar = deputadosParaProcessar.slice(0, limite);
        }
      }

      if (deputadosParaProcessar.length === 0) {
        this.context.logger.warn('⚠️ Nenhum deputado encontrado com os filtros especificados');
        return {
          deputados: [],
          despesasPorDeputado: [],
          totalProcessados: 0
        };
      }

      this.emitProgress(ProcessingStatus.EXTRAINDO, 30, `Extraindo despesas de ${deputadosParaProcessar.length} deputados`);

      // Extrair despesas de cada deputado
      const despesasPorDeputado = await this.extractDespesasDeputados(deputadosParaProcessar, modoAtualizacao);

      this.emitProgress(ProcessingStatus.EXTRAINDO, 90, 'Extração concluída');

      return {
        deputados: deputadosParaProcessar,
        despesasPorDeputado,
        totalProcessados: despesasPorDeputado.length
      };

    } catch (error: any) {
      this.context.logger.error(`❌ Erro na extração: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai deputado específico
   */
  private async extractDeputadoEspecifico(deputadoId: string, legislatura: number): Promise<DeputadoBasico[]> {
    try {
      const endpointConfig = endpoints.DEPUTADOS.PERFIL;
      const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });

      const response = await withRetry(
        () => get(endpoint, endpointConfig.PARAMS),
        etlConfig.camara.maxRetries,
        etlConfig.camara.pauseBetweenRequests,
        `Perfil do deputado ${deputadoId}`
      );

      if (!response || !response.dados) {
        throw new Error(`Deputado ${deputadoId} não encontrado`);
      }

      const deputado = response.dados;
      const deputadoBasico: DeputadoBasico = {
        id: deputado.id?.toString() || deputadoId,
        nome: deputado.nomeCivil || deputado.nome || '',
        nomeCivil: deputado.nomeCivil,
        siglaPartido: deputado.ultimoStatus?.siglaPartido || '',
        siglaUf: deputado.ultimoStatus?.siglaUf || '',
        idLegislatura: legislatura,
        urlFoto: deputado.ultimoStatus?.urlFoto
      };

      return [deputadoBasico];

    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair deputado ${deputadoId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai lista de deputados da legislatura
   */
  private async extractDeputadosLegislatura(legislatura: number): Promise<DeputadoBasico[]> {
    try {
      const endpointConfig = endpoints.DEPUTADOS.LISTA;
      let deputados: DeputadoBasico[] = [];
      let pagina = 1;
      let totalDeputados = 0;

      // Remove itens per page from base params and use REQUEST_CONFIG.DEFAULT_ITEMS_PER_PAGE
      const { itens, ...baseParams } = endpointConfig.PARAMS;

      do {
        const params = {
          ...baseParams,
          idLegislatura: legislatura.toString(),
          ordem: 'ASC',
          ordenarPor: 'nome',
          pagina: pagina.toString(),
          itens: String(etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE)
        };

        const response = await withRetry(
          () => get(endpointConfig.PATH, params),
          etlConfig.camara.maxRetries,
          etlConfig.camara.pauseBetweenRequests,
          `Lista de deputados da legislatura ${legislatura}, página ${pagina}`
        );

        if (!response || !response.dados || !Array.isArray(response.dados)) {
          // Se for a primeira página e não houver dados, é um erro.
          // Se for uma página subsequente, pode significar que não há mais dados.
          if (pagina === 1) {
            throw new Error(`Nenhum deputado encontrado para a legislatura ${legislatura}, página ${pagina}`);
          } else {
            this.context.logger.debug(`Nenhum deputado adicional encontrado na página ${pagina} para a legislatura ${legislatura}. Fim da lista.`);
            break; 
          }
        }
        
        const deputadosDaPagina: DeputadoBasico[] = response.dados.map((dep: any) => ({
          id: dep.id?.toString() || '',
          nome: dep.nome || '',
          nomeCivil: dep.nomeCivil,
          siglaPartido: dep.siglaPartido || '',
          siglaUf: dep.siglaUf || '',
          idLegislatura: legislatura,
          urlFoto: dep.urlFoto
        }));

        if (deputadosDaPagina.length === 0 && pagina > 1) {
            this.context.logger.debug(`Página ${pagina} vazia, encerrando busca para legislatura ${legislatura}.`);
            break;
        }

        deputados = deputados.concat(deputadosDaPagina);
        totalDeputados += deputadosDaPagina.length;
        pagina++;

        // Pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, etlConfig.camara.pauseBetweenRequests / 2));


      } while (deputados.length % (etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE) === 0 && deputados.length > 0);
      // A condição original de parada (response.links.find((link: any) => link.rel === 'next')) nem sempre é confiável ou presente.
      // A heurística de verificar se a quantidade de itens retornados é igual ao solicitado por página é mais robusta.
      // Adicionamos deputadosDaPagina.length > 0 para garantir que não continue se uma página vazia for retornada.

      this.context.logger.info(`✅ Encontrados ${totalDeputados} deputados na ${legislatura}ª Legislatura (após paginação completa)`);
      return deputados;

    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair lista de deputados: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aplica filtros aos deputados
   */
  private applyFilters(deputados: DeputadoBasico[]): DeputadoBasico[] {
    let filtrados = [...deputados];

    // 🔧 CORREÇÃO: Deduplicação de deputados duplicados da API
    const totalOriginal = filtrados.length;
    filtrados = this.deduplicateDeputados(filtrados);
    const totalAposDeduplicacao = filtrados.length;

    if (totalOriginal !== totalAposDeduplicacao) {
      this.context.logger.info(`🔄 Deduplicação: ${totalOriginal} → ${totalAposDeduplicacao} deputados (removidos ${totalOriginal - totalAposDeduplicacao} duplicados)`);
    }

    // Filtro por partido
    if (this.context.options.partido) {
      const partido = this.context.options.partido.toUpperCase();
      filtrados = filtrados.filter(dep => dep.siglaPartido === partido);
      this.context.logger.info(`🔍 Filtro por partido ${partido}: ${filtrados.length} deputados`);
    }

    // Filtro por UF
    if (this.context.options.uf) {
      const uf = this.context.options.uf.toUpperCase();
      filtrados = filtrados.filter(dep => dep.siglaUf === uf);
      this.context.logger.info(`🔍 Filtro por UF ${uf}: ${filtrados.length} deputados`);
    }

    return filtrados;
  }

  /**
   * Remove deputados duplicados baseado no ID
   *
   * A API da Câmara dos Deputados às vezes retorna o mesmo deputado múltiplas vezes
   * na mesma lista (geralmente devido a mudanças de partido). Esta função remove
   * as duplicatas mantendo apenas a primeira ocorrência de cada deputado.
   */
  private deduplicateDeputados(deputados: DeputadoBasico[]): DeputadoBasico[] {
    const deputadosUnicos = new Map<string, DeputadoBasico>();
    const duplicados: string[] = [];

    for (const deputado of deputados) {
      const id = deputado.id;

      if (deputadosUnicos.has(id)) {
        // Deputado duplicado encontrado
        duplicados.push(`${deputado.nome} (ID: ${id})`);

        // Manter o deputado com mais informações (priorizar o que tem nomeCivil)
        const existente = deputadosUnicos.get(id)!;
        if (deputado.nomeCivil && !existente.nomeCivil) {
          deputadosUnicos.set(id, deputado);
        }
      } else {
        // Primeiro registro deste deputado
        deputadosUnicos.set(id, deputado);
      }
    }

    // Log detalhado dos duplicados encontrados (apenas em modo verbose)
    if (duplicados.length > 0 && this.context.options.verbose) {
      this.context.logger.debug(`📋 Deputados duplicados removidos:`);
      duplicados.forEach(dup => this.context.logger.debug(`   - ${dup}`));
    }

    return Array.from(deputadosUnicos.values());
  }

  /**
   * Extrai despesas de múltiplos deputados
   */
  private async extractDespesasDeputados(
    deputados: DeputadoBasico[],
    modoAtualizacao = false
  ): Promise<ExtractedData['despesasPorDeputado']> {
    const resultados: ExtractedData['despesasPorDeputado'] = [];
    const concorrencia = this.context.options.concorrencia || 2; // Menor concorrência para despesas

    this.context.logger.info(`🔄 Extraindo despesas com concorrência: ${concorrencia}`);
    this.context.logger.info(`📋 Modo: ${modoAtualizacao ? 'ATUALIZAÇÃO INCREMENTAL' : 'COMPLETO'}`);

    // Processar em lotes para controlar concorrência
    for (let i = 0; i < deputados.length; i += concorrencia) {
      const lote = deputados.slice(i, i + concorrencia);

      this.context.logger.info(`📦 Processando lote ${Math.floor(i / concorrencia) + 1}: ${lote.length} deputados`);

      // Processar lote em paralelo
      const promessas = lote.map(async (deputado) => {
        try {
          const despesas = modoAtualizacao ?
            await this.extractDespesasIncremental(deputado.id) :
            await this.extractDespesasCompletas(deputado.id);

          this.incrementSucessos();
          return despesas;
        } catch (error: any) {
          this.context.logger.error(`❌ Erro ao extrair despesas do deputado ${deputado.id}: ${error.message}`);
          this.incrementFalhas();

          return {
            deputadoId: deputado.id,
            despesas: [],
            totalDespesas: 0,
            totalPaginas: 0,
            valorTotal: 0,
            erro: error.message
          };
        }
      });

      const resultadosLote = await Promise.allSettled(promessas);

      // Coletar resultados válidos
      resultadosLote.forEach((resultado) => {
        if (resultado.status === 'fulfilled') {
          resultados.push(resultado.value);
        }
      });

      // Progresso
      const progresso = Math.min(90, 30 + (i / deputados.length) * 60);
      const totalDespesas = resultados.reduce((sum, r) => sum + r.totalDespesas, 0);
      this.emitProgress(ProcessingStatus.EXTRAINDO, progresso, `${resultados.length}/${deputados.length} deputados processados (${totalDespesas} despesas)`);

      // Pausa entre lotes
      if (i + concorrencia < deputados.length) {
        await new Promise(resolve => setTimeout(resolve, etlConfig.camara.pauseBetweenRequests * 2));
      }
    }

    const totalDespesas = resultados.reduce((sum, r) => sum + r.totalDespesas, 0);
    const valorTotal = resultados.reduce((sum, r) => sum + r.valorTotal, 0);

    this.context.logger.info(`✅ Extração concluída: ${totalDespesas} despesas de ${resultados.length} deputados`);
    this.context.logger.info(`💰 Valor total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

    return resultados;
  }

  /**
   * Extrai despesas completas de um deputado
   */
  private async extractDespesasCompletas(deputadoId: string): Promise<ExtractedData['despesasPorDeputado'][0]> {
    const legislatura = this.context.options.legislatura!;
    const ano = this.context.options.ano;
    const mes = this.context.options.mes;

    try {
      const endpointConfig = endpoints.DEPUTADOS.DESPESAS;
      const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });

      // Parâmetros base
      const baseParams: Record<string, any> = { // Explicitly type to allow dynamic properties
        ...endpointConfig.PARAMS,
        idLegislatura: legislatura.toString(),
        itens: String(etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE) // Use etlConfig.camara.itemsPerPage
      };

      // Adicionar filtros de período se especificados
      if (ano) baseParams.ano = ano.toString(); // Ensure it's a string
      if (mes) baseParams.mes = mes.toString(); // Ensure it's a string

      // Usar getAllPages para extrair todas as páginas automaticamente
      const todasDespesas = await apiClient.getAllPages(
        endpoint,
        baseParams,
        {
          context: `Despesas do deputado ${deputadoId}`,
          maxPages: 100 // Limite de segurança
        }
      );

      const valorTotal = todasDespesas.reduce((sum: number, despesa: any) => {
        return sum + (parseFloat(despesa.valorLiquido) || 0);
      }, 0);

      return {
        deputadoId,
        despesas: todasDespesas,
        totalDespesas: todasDespesas.length,
        totalPaginas: Math.ceil(todasDespesas.length / (etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE)), // Use etlConfig.camara.itemsPerPage
        valorTotal
      };

    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair despesas do deputado ${deputadoId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai despesas em modo incremental (últimos 2 meses)
   */
  private async extractDespesasIncremental(deputadoId: string): Promise<ExtractedData['despesasPorDeputado'][0]> {
    const agora = new Date();
    const mesesParaVerificar: { ano: number; mes: number }[] = [];

    // Adiciona o mês atual
    mesesParaVerificar.push({ ano: agora.getFullYear(), mes: agora.getMonth() + 1 });

    // Adiciona o mês anterior
    const mesAnterior = new Date(agora);
    mesAnterior.setMonth(agora.getMonth() - 1);
    mesesParaVerificar.push({ ano: mesAnterior.getFullYear(), mes: mesAnterior.getMonth() + 1 });
    
    // Adiciona o mês retrasado (para cobrir "últimos 2 meses" completamente, 
    // considerando que "últimos 2 meses" pode abranger partes de 3 meses calendário)
    // Ex: Se hoje é 5 de Março, "últimos 2 meses" vai de 5 de Janeiro a 5 de Março.
    // Precisamos buscar despesas de Janeiro, Fevereiro e Março.
    const doisMesesAtras = new Date(agora);
    doisMesesAtras.setMonth(agora.getMonth() - 2);
    mesesParaVerificar.push({ ano: doisMesesAtras.getFullYear(), mes: doisMesesAtras.getMonth() + 1 });


    // Remover duplicatas (caso o período de 2 meses caia no mesmo ano/mês, embora raro com 3 meses)
    const mesesUnicos = mesesParaVerificar.filter((mes, index, array) =>
      array.findIndex(m => m.ano === mes.ano && m.mes === mes.mes) === index
    );
    
    this.context.logger.debug(`[Incremental] Meses a verificar para Dep. ${deputadoId}: ${JSON.stringify(mesesUnicos)}`);

    let todasDespesas: any[] = [];
    let totalPaginas = 0;
    const dataLimiteInferior = new Date();
    dataLimiteInferior.setMonth(dataLimiteInferior.getMonth() - 2);
    dataLimiteInferior.setDate(1); // Primeiro dia de dois meses atrás
    dataLimiteInferior.setHours(0, 0, 0, 0);


    for (const { ano, mes } of mesesUnicos) {
      try {
        this.context.logger.debug(`[Incremental] Extraindo ${ano}-${mes} para Dep. ${deputadoId}`);
        // Extrair despesas do mês específico
        const despesasMes = await this.extractDespesasPorMes(deputadoId, ano, mes);

        // Filtrar apenas despesas DENTRO do período de "últimos 2 meses"
        // (a API retorna o mês inteiro, precisamos filtrar o dia)
        const despesasRecentes = despesasMes.despesas.filter((despesa: any) => {
          if (!despesa.dataDocumento) return false;
          try {
            const dataDespesa = new Date(despesa.dataDocumento);
            return dataDespesa >= dataLimiteInferior && dataDespesa <= agora;
          } catch (e) {
            this.context.logger.warn(`[Incremental] Data inválida para despesa: ${despesa.idDocumento || 'ID não encontrado'}. Data: ${despesa.dataDocumento}`);
            return false;
          }
        });
        
        if (despesasRecentes.length > 0) {
            this.context.logger.debug(`[Incremental] Encontradas ${despesasRecentes.length} despesas recentes em ${ano}-${mes} para Dep. ${deputadoId}`);
        }

        todasDespesas.push(...despesasRecentes);
        totalPaginas += despesasMes.totalPaginas; // Isso pode não ser preciso para o total de páginas *filtradas*

      } catch (error: any) {
        this.context.logger.warn(`⚠️ Erro ao extrair mês ${ano}-${mes} do deputado ${deputadoId}: ${error.message}`);
      }
    }

    const valorTotal = todasDespesas.reduce((sum: number, despesa: any) => {
      return sum + (parseFloat(despesa.valorLiquido) || 0);
    }, 0);

    return {
      deputadoId,
      despesas: todasDespesas,
      totalDespesas: todasDespesas.length,
      totalPaginas,
      valorTotal
    };
  }

  /**
   * Extrai despesas de um mês específico
   */
  private async extractDespesasPorMes(
    deputadoId: string,
    ano: number,
    mes: number
  ): Promise<{ despesas: any[]; totalPaginas: number }> {
    const legislatura = this.context.options.legislatura!;

    const endpointConfig = endpoints.DEPUTADOS.DESPESAS;
    const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });

    const params: Record<string, any> = { // Explicitly type to allow dynamic properties
      ...endpointConfig.PARAMS,
      idLegislatura: legislatura.toString(),
      ano: ano.toString(),
      mes: mes.toString(),
      itens: String(etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE) // Use etlConfig.camara.itemsPerPage
    };

    const despesas = await apiClient.getAllPages(endpoint, params, {
      context: `Despesas ${ano}-${mes.toString().padStart(2, '0')} do deputado ${deputadoId}`,
      maxPages: 20
    });

    return {
      despesas,
      totalPaginas: Math.ceil(despesas.length / (etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE)) // Use etlConfig.camara.itemsPerPage
    };
  }

  /**
   * Transformação dos dados extraídos
   */
  async transform(data: ExtractedData): Promise<TransformedData> {
    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 10, 'Iniciando transformação dos dados');

    try {
      const despesasTransformadas: DespesaDeputado[] = [];
      const despesasPorAno: Record<number, number> = {};
      const despesasPorTipo: Record<string, number> = {};
      let valorTotalGeral = 0;
      let deputadosComDespesas = 0;

      for (const dadosDeputado of data.despesasPorDeputado) {
        if (dadosDeputado.erro || dadosDeputado.despesas.length === 0) {
          continue;
        }

        deputadosComDespesas++;

        for (const despesaBruta of dadosDeputado.despesas) {
          try {
            const despesaTransformada = this.transformDespesa(despesaBruta, dadosDeputado.deputadoId);
            despesasTransformadas.push(despesaTransformada);

            // Atualizar estatísticas
            valorTotalGeral += despesaTransformada.valorLiquido!; // Adicionar non-null assertion

            // Por ano
            despesasPorAno[despesaTransformada.ano] = (despesasPorAno[despesaTransformada.ano] || 0) + 1;

            // Por tipo
            const tipo = despesaTransformada.tipoDespesa || 'OUTROS';
            despesasPorTipo[tipo] = (despesasPorTipo[tipo] || 0) + 1;

          } catch (error: any) {
            this.context.logger.error(`❌ Erro ao transformar despesa: ${error.message}`);
            this.incrementFalhas();
          }
        }

        // Progresso
        const progresso = Math.round((data.despesasPorDeputado.indexOf(dadosDeputado) / data.despesasPorDeputado.length) * 100);
        this.emitProgress(ProcessingStatus.TRANSFORMANDO, progresso, `${despesasTransformadas.length} despesas transformadas`);
      }

      const estatisticas = {
        totalDespesas: despesasTransformadas.length,
        deputadosComDespesas,
        valorTotalGeral,
        despesasPorAno,
        despesasPorTipo
      };

      this.context.logger.info(`✅ Transformação concluída: ${despesasTransformadas.length} despesas`);
      this.context.logger.info(`💰 Valor total: R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      this.context.logger.info(`👥 Deputados com despesas: ${deputadosComDespesas}`);

      return {
        despesas: despesasTransformadas,
        estatisticas
      };

    } catch (error: any) {
      this.context.logger.error(`❌ Erro na transformação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transforma despesa individual
   */
  private transformDespesa(despesaBruta: any, deputadoId: string): DespesaDeputado {
    return {
      idDocumento: despesaBruta.idDocumento?.toString() || '', // Adicionado
      // Dados básicos
      ano: parseInt(despesaBruta.ano) || 0,
      mes: parseInt(despesaBruta.mes) || 0,
      tipoDespesa: despesaBruta.tipoDespesa || '',

      // Documento
      codDocumento: despesaBruta.codDocumento?.toString() || '',
      tipoDocumento: despesaBruta.tipoDocumento || '',
      codTipoDocumento: despesaBruta.codTipoDocumento?.toString() || '',
      dataDocumento: despesaBruta.dataDocumento || '',
      numDocumento: despesaBruta.numDocumento || '',
      urlDocumento: despesaBruta.urlDocumento || '',

      // Valores
      valorDocumento: parseFloat(despesaBruta.valorDocumento) || 0,
      valorLiquido: parseFloat(despesaBruta.valorLiquido) || 0,
      valorGlosa: parseFloat(despesaBruta.valorGlosa) || 0,

      // Fornecedor
      nomeFornecedor: despesaBruta.nomeFornecedor || '',
      cnpjCpfFornecedor: despesaBruta.cnpjCpfFornecedor || '',

      // Controle
      numRessarcimento: despesaBruta.numRessarcimento || '',
      codLote: despesaBruta.codLote?.toString() || '',
      parcela: parseInt(despesaBruta.parcela) || 0,

      // Metadados
      idDeputado: deputadoId,
      dataExtracao: new Date().toISOString()
    };
  }

  /**
   * Carregamento dos dados transformados
   */
  async load(data: TransformedData): Promise<ETLResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 10, 'Iniciando carregamento dos dados');

    let despesasPorDeputado: Record<string, DespesaDeputado[]> = {}; // Declarar fora do try
    let batchResults: BatchResult;
    const modoAtualizacao = this.context.options.atualizar || false;

    try {
      const batchManager = createBatchManager();

      this.emitProgress(ProcessingStatus.CARREGANDO, 30, 'Salvando despesas por deputado');

      despesasPorDeputado = this.groupDespesasByDeputado(data.despesas); // Atribuir aqui

      for (const [deputadoId, novasDespesasDoDeputado] of Object.entries(despesasPorDeputado)) {
        const basePathDeputado = `congressoNacional/camaraDeputados/despesas/${deputadoId}`;
        
        // Agrupar novas despesas por ano
        const novasDespesasAgrupadasPorAno: Record<string, DespesaDeputado[]> = {};
        for (const despesa of novasDespesasDoDeputado) {
          const ano = despesa.ano.toString();
          if (!novasDespesasAgrupadasPorAno[ano]) {
            novasDespesasAgrupadasPorAno[ano] = [];
          }
          novasDespesasAgrupadasPorAno[ano].push(despesa);
        }

        let todasAsDespesasDoDeputadoParaEstatisticas: DespesaDeputado[] = [];

        // Salvar/Atualizar despesas por ano na subcoleção 'dados'
        for (const [ano, novasDespesasDoAno] of Object.entries(novasDespesasAgrupadasPorAno)) {
          const pathDespesasAno = `${basePathDeputado}/dados/${ano}`;
          let despesasFinaisParaSalvar: DespesaDeputado[];

          if (modoAtualizacao) {
            this.context.logger.info(`[Load - Atualização] Verificando despesas existentes para Dep. ${deputadoId}, Ano ${ano}`);
            // Ler despesas existentes para este ano usando o cliente Firestore diretamente
              let despesasExistentes: DespesaDeputado[] = [];
            try {
              const docRef = getDb().doc(pathDespesasAno); // Correção: usar getDb()
              const docSnap = await docRef.get();
              if (docSnap.exists) {
                const docData = docSnap.data();
                if (docData && docData.despesas && Array.isArray(docData.despesas)) {
                  despesasExistentes = docData.despesas as DespesaDeputado[];
                }
              }
            } catch (e: any) {
              this.context.logger.warn(`[Load - Atualização] Erro ao ler documento existente ${pathDespesasAno}: ${e.message}`);
              // Continuar mesmo se a leitura falhar, tratando como se não houvesse dados existentes.
            }
            
            if (despesasExistentes.length > 0) {
              this.context.logger.info(`[Load - Atualização] Encontradas ${despesasExistentes.length} despesas existentes para Dep. ${deputadoId}, Ano ${ano}`);
            } else {
              this.context.logger.info(`[Load - Atualização] Nenhuma despesa existente encontrada para Dep. ${deputadoId}, Ano ${ano}. Criando novo documento.`);
            }
            
            // Mesclar e remover duplicatas (baseado no idDocumento, se disponível e único)
            const despesasCombinadas = [...despesasExistentes, ...novasDespesasDoAno];
            const mapDespesasUnicas = new Map<string, DespesaDeputado>();
            for (const d of despesasCombinadas) {
              // Usar idDocumento como chave para unicidade. Se não existir, gerar um ID temporário para evitar colisões improváveis,
              // mas o ideal é que idDocumento seja sempre presente e único.
              const chaveUnica = d.idDocumento || `${d.dataDocumento}-${d.valorLiquido}-${d.nomeFornecedor}-${Math.random()}`;
              if (!mapDespesasUnicas.has(chaveUnica)) {
                mapDespesasUnicas.set(chaveUnica, d);
              }
            }
            despesasFinaisParaSalvar = Array.from(mapDespesasUnicas.values());
            this.context.logger.info(`[Load - Atualização] Após mesclagem, ${despesasFinaisParaSalvar.length} despesas para Dep. ${deputadoId}, Ano ${ano}`);
          } else {
            // Modo completo: simplesmente sobrescreve com as novas despesas
            despesasFinaisParaSalvar = novasDespesasDoAno;
          }
          
          await batchManager.set(pathDespesasAno, { despesas: despesasFinaisParaSalvar });
          todasAsDespesasDoDeputadoParaEstatisticas.push(...despesasFinaisParaSalvar);
        }
        
        // Dados principais do deputado (estatísticas) - recalculadas com todas as despesas (existentes + novas)
        // Se não for modo atualização, todasAsDespesasDoDeputadoParaEstatisticas será igual a novasDespesasDoDeputado
        if (todasAsDespesasDoDeputadoParaEstatisticas.length > 0) {
            const dadosEstatisticasDeputado = {
              idDeputado: deputadoId,
              totalDespesas: todasAsDespesasDoDeputadoParaEstatisticas.length,
              valorTotal: todasAsDespesasDoDeputadoParaEstatisticas.reduce((sum, d) => sum + (d.valorLiquido || 0), 0),
              ultimaAtualizacao: new Date().toISOString(),
              estatisticasAnuais: this.calculateDeputadoStats(todasAsDespesasDoDeputadoParaEstatisticas)
            };
            await batchManager.set(basePathDeputado, dadosEstatisticasDeputado);
        } else if (!modoAtualizacao && novasDespesasDoDeputado.length === 0) {
            // Caso de modo completo e o deputado não tem despesas, ainda assim salvar um registro base.
            const dadosEstatisticasDeputado = {
              idDeputado: deputadoId,
              totalDespesas: 0,
              valorTotal: 0,
              ultimaAtualizacao: new Date().toISOString(),
              estatisticasAnuais: this.calculateDeputadoStats([])
            };
            await batchManager.set(basePathDeputado, dadosEstatisticasDeputado);
        } else if (modoAtualizacao && novasDespesasDoDeputado.length === 0) {
            this.context.logger.info(`[Load - Atualização] Nenhuma nova despesa para Dep. ${deputadoId}. Estatísticas não serão atualizadas a menos que haja despesas existentes recuperadas.`);
            // Se em modo de atualização e não há novas despesas, as estatísticas só seriam atualizadas
            // se tivéssemos lido e reprocessado todas as despesas existentes, o que não é o caso aqui
            // para otimizar. A `ultimaAtualizacao` no nó do deputado pode ficar defasada se apenas
            // despesas de um ano específico são atualizadas. Considerar atualizar `ultimaAtualizacao`
            // mesmo se apenas um subdocumento de ano for modificado.
            // Por ora, vamos atualizar se `todasAsDespesasDoDeputadoParaEstatisticas` tiver algo.
            // Se não, e se o documento principal do deputado já existir, ele não será tocado.
        }
      }

      // 2. Salvar metadados gerais (se necessário, ajustar o caminho)
      this.emitProgress(ProcessingStatus.CARREGANDO, 70, 'Salvando metadados');
      const metadataPath = `congressoNacional/camaraDeputados/despesas/metadata_legislatura_${this.context.options.legislatura}`;
      const metadata = {
        processamento: {
          dataExecucao: new Date().toISOString(),
          versaoETL: '2.0',
          legislatura: this.context.options.legislatura,
          opcoes: this.context.options,
          estatisticasGerais: data.estatisticas // Renomeado para clareza
        },
        indices: {
          totalDeputadosComDespesas: Object.keys(despesasPorDeputado).length,
          // Outros índices gerais podem ser adicionados aqui
        }
      };
      await batchManager.set(metadataPath, metadata);

      // 3. Executar todos os batches
      this.emitProgress(ProcessingStatus.CARREGANDO, 90, 'Executando commit dos batches');

      batchResults = await batchManager.commit(); // Usar commit() do BatchManager

      // Resultado consolidado
      const finalResult: ETLResult = {
        sucessos: batchResults.sucessos,
        falhas: batchResults.falhas,
        avisos: 0, // Não há avisos específicos no carregamento aqui
        tempoProcessamento: batchResults.tempoOperacao || 0,
        destino: this.context.options.destino,
        legislatura: this.context.options.legislatura,
        detalhes: {
          despesasSalvas: data.despesas.length,
          deputadosProcessados: Object.keys(despesasPorDeputado).length,
          metadadosSalvos: true,
          batchResults: batchResults.detalhes // Usar os detalhes do BatchResult
        }
      };

      this.context.logger.info(`✅ Carregamento concluído: ${finalResult.sucessos} sucessos, ${finalResult.falhas} falhas`);

      return finalResult;

    } catch (error: any) { // Capturar qualquer erro
      let finalFalhas = 0;
      let finalDetalhes: any = {};
      let finalErros: ETLError[] = [];

      // Se o erro for um BatchResult lançado pelo commit (em caso de falha)
      if (error && typeof error === 'object' && 'sucessos' in error && 'falhas' in error) {
        const failedBatchResult: BatchResult = error;
        finalFalhas = failedBatchResult.falhas;
        finalDetalhes = {
          despesasSalvas: data.despesas.length,
          deputadosProcessados: Object.keys(despesasPorDeputado).length,
          metadadosSalvos: false,
          batchResults: failedBatchResult.detalhes
        };
        finalErros.push({
          codigo: 'LOAD_BATCH_FAILED',
          mensagem: `Falha no commit do batch: ${failedBatchResult.falhas} operações falharam`,
          contexto: failedBatchResult.detalhes,
          timestamp: new Date().toISOString()
        });
        this.context.logger.error(`❌ Erro no carregamento (Batch): ${failedBatchResult.falhas} falhas`);
      } else {
        // Outros erros
        finalFalhas = data.despesas.length + Object.keys(despesasPorDeputado).length + 1; // Assumir todas as operações falharam
        finalDetalhes = {
          despesasSalvas: 0,
          deputadosProcessados: 0,
          metadadosSalvos: false,
          batchResults: []
        };
        finalErros.push({
          codigo: 'LOAD_FATAL_ERROR',
          mensagem: error.message || 'Erro desconhecido no carregamento',
          contexto: error,
          timestamp: new Date().toISOString()
        });
        this.context.logger.error(`❌ Erro fatal no carregamento: ${error.message}`);
      }

      return {
        sucessos: 0,
        falhas: finalFalhas,
        avisos: 0,
        tempoProcessamento: 0,
        destino: this.context.options.destino,
        legislatura: this.context.options.legislatura,
        detalhes: finalDetalhes,
        erros: finalErros
      };
    }
  }

  /**
   * Agrupa despesas por deputado
   */
  private groupDespesasByDeputado(despesas: DespesaDeputado[]): Record<string, DespesaDeputado[]> {
    return despesas.reduce((groups, despesa) => {
      const deputadoId = despesa.idDeputado;
      if (!groups[deputadoId]) {
        groups[deputadoId] = [];
      }
      groups[deputadoId].push(despesa);
      return groups;
    }, {} as Record<string, DespesaDeputado[]>);
  }

  /**
   * Calcula estatísticas específicas do deputado
   */
  private calculateDeputadoStats(despesas: DespesaDeputado[]): any {
    return {
      despesasPorAno: despesas.reduce((acc, d) => {
        acc[d.ano] = (acc[d.ano] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),

      despesasPorTipo: despesas.reduce((acc, d) => {
        const tipo = d.tipoDespesa || 'OUTROS';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      valorPorAno: despesas.reduce((acc, d) => {
        acc[d.ano] = (acc[d.ano] || 0) + d.valorLiquido!; // Adicionar non-null assertion
        return acc;
      }, {} as Record<number, number>)
    };
  }
}
