/**
 * Processador ETL para Discursos de Deputados da Câmara
 *
 * Implementa o fluxo ETL completo para extrair, transformar e carregar
 * discursos de deputados com suporte a paginação e modo incremental.
 */

import { ETLProcessor } from '../core/etl-processor';
import {
  ValidationResult,
  BatchResult,
  DiscursoDeputado,
  DeputadoBasico,
  ETLOptions
} from '../types/etl.types';
import { logger } from '../utils/logging';
import { createBatchManager, createMultiBatchManager } from '../utils/storage';
import { etlConfig, processadorConfigs } from '../config/etl.config';
import { apiClient, get, replacePath } from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/logging/error-handler';

/**
 * Dados extraídos da API
 */
interface ExtractedData {
  deputados: DeputadoBasico[];
  discursosPorDeputado: Array<{
    deputadoId: string;
    discursos: any[];
    totalDiscursos: number;
    totalPaginas: number;
    erro?: string;
  }>;
  totalProcessados: number;
}

/**
 * Dados transformados
 */
interface TransformedData {
  discursos: DiscursoDeputado[];
  estatisticas: {
    totalDiscursos: number;
    deputadosComDiscursos: number;
    discursosPorAno: Record<number, number>;
    discursosPorTipo: Record<string, number>;
    discursosComTranscricao: number;
    discursosComPalavrasChave: number;
  };
}

/**
 * Processador de Discursos de Deputados
 */
export class DiscursosDeputadosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  private storageManager = createStorageManager(this.context.options);

  constructor(options: ETLOptions) {
    super(options);
  }

  /**
   * Nome do processador
   */
  protected getProcessName(): string {
    return 'Processador de Discursos de Deputados';
  }

  /**
   * Validação específica do processador
   */
  async validate(): Promise<ValidationResult> {
    const baseValidation = this.validateCommonParams();
    const erros = [...baseValidation.erros];
    const avisos = [...baseValidation.avisos];

    // Validações específicas de discursos
    if (!this.context.options.legislatura) {
      erros.push('Legislatura é obrigatória para extrair discursos');
    }

    // Validar datas se especificadas
    if (this.context.options.dataInicio) {
      if (!this.isValidDate(this.context.options.dataInicio)) {
        erros.push(`Data início inválida: ${this.context.options.dataInicio}. Use formato YYYY-MM-DD.`);
      }
    }

    if (this.context.options.dataFim) {
      if (!this.isValidDate(this.context.options.dataFim)) {
        erros.push(`Data fim inválida: ${this.context.options.dataFim}. Use formato YYYY-MM-DD.`);
      }
    }

    // Validar período se ambas as datas forem especificadas
    if (this.context.options.dataInicio && this.context.options.dataFim) {
      const inicio = new Date(this.context.options.dataInicio);
      const fim = new Date(this.context.options.dataFim);

      if (inicio > fim) {
        erros.push('Data início deve ser anterior à data fim');
      }

      // Avisar sobre períodos muito longos
      const diffDays = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        avisos.push('Período muito longo (> 1 ano) pode resultar em muito dados. Considere períodos menores.');
      }
    }

    // Validar palavras-chave
    if (this.context.options.palavrasChave && this.context.options.palavrasChave.length > 10) {
      avisos.push('Muitas palavras-chave podem tornar a busca muito restritiva');
    }

    // Avisos sobre volume de dados
    if (!this.context.options.limite && !this.context.options.deputado && !this.context.options.dataInicio) {
      avisos.push('Processamento sem limite ou filtro de período pode ser muito demorado');
    }

    if (this.context.options.atualizar) {
      avisos.push('Modo atualização processará apenas discursos dos últimos 60 dias');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Valida formato de data
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Extração de dados da API da Câmara
   */
  async extract(): Promise<ExtractedData> {
    const legislatura = this.context.options.legislatura!;
    const limite = this.context.options.limite || 0;
    const deputadoEspecifico = this.context.options.deputado;
    const modoAtualizacao = this.context.options.atualizar || false;

    this.emitProgress('EXTRAINDO', 10, 'Iniciando extração de dados');

    try {
      let deputadosParaProcessar: DeputadoBasico[];

      if (deputadoEspecifico) {
        // Extrair apenas deputado específico
        this.context.logger.info(`🎯 Extraindo discursos do deputado específico: ${deputadoEspecifico}`);
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
          discursosPorDeputado: [],
          totalProcessados: 0
        };
      }

      this.emitProgress('EXTRAINDO', 30, `Extraindo discursos de ${deputadosParaProcessar.length} deputados`);

      // Extrair discursos de cada deputado
      const discursosPorDeputado = await this.extractDiscursosDeputados(deputadosParaProcessar, modoAtualizacao);

      this.emitProgress('EXTRAINDO', 90, 'Extração concluída');

      return {
        deputados: deputadosParaProcessar,
        discursosPorDeputado,
        totalProcessados: discursosPorDeputado.length
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
      const params = {
        ...endpointConfig.PARAMS,
        idLegislatura: legislatura.toString(),
        ordem: 'ASC',
        ordenarPor: 'nome'
      };

      const response = await withRetry(
        () => get(endpointConfig.PATH, params),
        etlConfig.camara.maxRetries,
        etlConfig.camara.pauseBetweenRequests,
        `Lista de deputados da legislatura ${legislatura}`
      );

      if (!response || !response.dados || !Array.isArray(response.dados)) {
        throw new Error(`Nenhum deputado encontrado para a legislatura ${legislatura}`);
      }

      const deputados: DeputadoBasico[] = response.dados.map((dep: any) => ({
        id: dep.id?.toString() || '',
        nome: dep.nome || '',
        nomeCivil: dep.nomeCivil,
        siglaPartido: dep.siglaPartido || '',
        siglaUf: dep.siglaUf || '',
        idLegislatura: legislatura,
        urlFoto: dep.urlFoto
      }));

      this.context.logger.info(`✅ Encontrados ${deputados.length} deputados na ${legislatura}ª Legislatura`);
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
   * Extrai discursos de múltiplos deputados
   */
  private async extractDiscursosDeputados(
    deputados: DeputadoBasico[],
    modoAtualizacao = false
  ): Promise<ExtractedData['discursosPorDeputado']> {
    const resultados: ExtractedData['discursosPorDeputado'] = [];
    const concorrencia = this.context.options.concorrencia || 2; // Menor concorrência para discursos

    this.context.logger.info(`🔄 Extraindo discursos com concorrência: ${concorrencia}`);
    this.context.logger.info(`📋 Modo: ${modoAtualizacao ? 'ATUALIZAÇÃO INCREMENTAL (60 dias)' : 'COMPLETO'}`);

    // Processar em lotes para controlar concorrência
    for (let i = 0; i < deputados.length; i += concorrencia) {
      const lote = deputados.slice(i, i + concorrencia);

      this.context.logger.info(`📦 Processando lote ${Math.floor(i / concorrencia) + 1}: ${lote.length} deputados`);

      // Processar lote em paralelo
      const promessas = lote.map(async (deputado) => {
        try {
          const discursos = modoAtualizacao ?
            await this.extractDiscursosIncremental(deputado.id) :
            await this.extractDiscursosCompletos(deputado.id);

          this.incrementSucessos();
          return discursos;
        } catch (error: any) {
          this.context.logger.error(`❌ Erro ao extrair discursos do deputado ${deputado.id}: ${error.message}`);
          this.incrementFalhas();

          return {
            deputadoId: deputado.id,
            discursos: [],
            totalDiscursos: 0,
            totalPaginas: 0,
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
      const totalDiscursos = resultados.reduce((sum, r) => sum + r.totalDiscursos, 0);
      this.emitProgress('EXTRAINDO', progresso, `${resultados.length}/${deputados.length} deputados processados (${totalDiscursos} discursos)`);

      // Pausa entre lotes
      if (i + concorrencia < deputados.length) {
        await new Promise(resolve => setTimeout(resolve, etlConfig.camara.pauseBetweenRequests * 2));
      }
    }

    const totalDiscursos = resultados.reduce((sum, r) => sum + r.totalDiscursos, 0);

    this.context.logger.info(`✅ Extração concluída: ${totalDiscursos} discursos de ${resultados.length} deputados`);

    return resultados;
  }

  /**
   * Extrai discursos completos de um deputado
   */
  private async extractDiscursosCompletos(deputadoId: string): Promise<ExtractedData['discursosPorDeputado'][0]> {
    const legislatura = this.context.options.legislatura!;

    try {
      const endpointConfig = endpoints.DEPUTADOS.DISCURSOS;
      const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });

      // Parâmetros base
      const baseParams = {
        ...endpointConfig.PARAMS,
        idLegislatura: legislatura.toString(),
        ordenarPor: 'dataHoraInicio',
        ordem: 'DESC',
        itens: processadorConfigs.discursosDeputados.itensPorPagina.toString()
      };

      // Adicionar filtros de período se especificados
      if (this.context.options.dataInicio) {
        baseParams.dataInicio = this.context.options.dataInicio;
      }
      if (this.context.options.dataFim) {
        baseParams.dataFim = this.context.options.dataFim;
      }

      // Usar getAllPages para extrair todas as páginas automaticamente
      const todosDiscursos = await apiClient.getAllPages(
        endpoint,
        baseParams,
        {
          context: `Discursos do deputado ${deputadoId}`,
          maxPages: 100 // Limite de segurança
        }
      );

      return {
        deputadoId,
        discursos: todosDiscursos,
        totalDiscursos: todosDiscursos.length,
        totalPaginas: Math.ceil(todosDiscursos.length / processadorConfigs.discursosDeputados.itensPorPagina)
      };

    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair discursos do deputado ${deputadoId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai discursos em modo incremental (últimos 60 dias)
   */
  private async extractDiscursosIncremental(deputadoId: string): Promise<ExtractedData['discursosPorDeputado'][0]> {
    const agora = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 60); // 60 dias atrás

    const legislatura = this.context.options.legislatura!;

    try {
      const endpointConfig = endpoints.DEPUTADOS.DISCURSOS;
      const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });

      const params = {
        ...endpointConfig.PARAMS,
        idLegislatura: legislatura.toString(),
        dataInicio: dataLimite.toISOString().split('T')[0], // YYYY-MM-DD
        dataFim: agora.toISOString().split('T')[0], // YYYY-MM-DD
        ordenarPor: 'dataHoraInicio',
        ordem: 'DESC',
        itens: processadorConfigs.discursosDeputados.itensPorPagina.toString()
      };

      const discursosRecentes = await apiClient.getAllPages(endpoint, params, {
        context: `Discursos recentes do deputado ${deputadoId}`,
        maxPages: 20
      });

      return {
        deputadoId,
        discursos: discursosRecentes,
        totalDiscursos: discursosRecentes.length,
        totalPaginas: Math.ceil(discursosRecentes.length / processadorConfigs.discursosDeputados.itensPorPagina)
      };

    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair discursos incrementais do deputado ${deputadoId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transformação dos dados extraídos
   */
  async transform(data: ExtractedData): Promise<TransformedData> {
    this.emitProgress('TRANSFORMANDO', 10, 'Iniciando transformação dos dados');

    try {
      const discursosTransformados: DiscursoDeputado[] = [];
      const discursosPorAno: Record<number, number> = {};
      const discursosPorTipo: Record<string, number> = {};
      let deputadosComDiscursos = 0;
      let discursosComTranscricao = 0;
      let discursosComPalavrasChave = 0;

      for (const dadosDeputado of data.discursosPorDeputado) {
        if (dadosDeputado.erro || dadosDeputado.discursos.length === 0) {
          continue;
        }

        deputadosComDiscursos++;

        for (const discursoBruto of dadosDeputado.discursos) {
          try {
            const discursoTransformado = this.transformDiscurso(discursoBruto, dadosDeputado.deputadoId);
            discursosTransformados.push(discursoTransformado);

            // Atualizar estatísticas
            // Por ano
            discursosPorAno[discursoTransformado.anoDiscurso] = (discursosPorAno[discursoTransformado.anoDiscurso] || 0) + 1;

            // Por tipo
            const tipo = discursoTransformado.tipoDiscurso || 'OUTROS';
            discursosPorTipo[tipo] = (discursosPorTipo[tipo] || 0) + 1;

            // Contadores de conteúdo
            if (discursoTransformado.transcricao) {
              discursosComTranscricao++;
            }
            if (discursoTransformado.palavrasChave && discursoTransformado.palavrasChave.length > 0) {
              discursosComPalavrasChave++;
            }

          } catch (error: any) {
            this.context.logger.error(`❌ Erro ao transformar discurso: ${error.message}`);
            this.incrementFalhas();
          }
        }

        // Progresso
        const progresso = Math.round((data.discursosPorDeputado.indexOf(dadosDeputado) / data.discursosPorDeputado.length) * 100);
        this.emitProgress('TRANSFORMANDO', progresso, `${discursosTransformados.length} discursos transformados`);
      }

      const estatisticas = {
        totalDiscursos: discursosTransformados.length,
        deputadosComDiscursos,
        discursosPorAno,
        discursosPorTipo,
        discursosComTranscricao,
        discursosComPalavrasChave
      };

      this.context.logger.info(`✅ Transformação concluída: ${discursosTransformados.length} discursos`);
      this.context.logger.info(`👥 Deputados com discursos: ${deputadosComDiscursos}`);
      this.context.logger.info(`📝 Com transcrição: ${discursosComTranscricao}`);
      this.context.logger.info(`🏷️ Com palavras-chave: ${discursosComPalavrasChave}`);

      return {
        discursos: discursosTransformados,
        estatisticas
      };

    } catch (error: any) {
      this.context.logger.error(`❌ Erro na transformação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transforma discurso individual
   */
  private transformDiscurso(discursoBruto: any, deputadoId: string): DiscursoDeputado {
    // Extrair ano e mês da data do discurso
    const dataDiscurso = new Date(discursoBruto.dataHoraInicio || discursoBruto.dataHora || '');
    const anoDiscurso = dataDiscurso.getFullYear() || 0;
    const mesDiscurso = dataDiscurso.getMonth() + 1 || 0;

    return {
      // Dados básicos
      id: discursoBruto.id?.toString() || '',
      dataHoraInicio: discursoBruto.dataHoraInicio || discursoBruto.dataHora || '',
      dataHoraFim: discursoBruto.dataHoraFim || '',
      tipoDiscurso: discursoBruto.tipoDiscurso || discursoBruto.tipo || '',

      // Conteúdo
      sumario: discursoBruto.sumario || discursoBruto.descricao || '',
      transcricao: discursoBruto.transcricao || discursoBruto.textoDiscurso || '',
      palavrasChave: this.extractPalavrasChave(discursoBruto.palavrasChave || discursoBruto.keywords),

      // Evento/Contexto
      faseEvento: discursoBruto.faseEvento?.nome || discursoBruto.faseEvento || '',
      tipoEvento: discursoBruto.tipoEvento || '',
      codEvento: discursoBruto.codEvento?.toString() || discursoBruto.evento?.id?.toString() || '',

      // URLs e recursos
      urlAudio: discursoBruto.urlAudio || '',
      urlTexto: discursoBruto.urlTexto || discursoBruto.uriTexto || '',

      // Metadados
      idDeputado: deputadoId,
      dataExtracao: new Date().toISOString(),
      anoDiscurso,
      mesDiscurso
    };
  }

  /**
   * Extrai palavras-chave do formato da API
   */
  private extractPalavrasChave(palavrasChave: any): string[] {
    if (!palavrasChave) return [];

    if (Array.isArray(palavrasChave)) {
      return palavrasChave.filter(p => p && typeof p === 'string');
    }

    if (typeof palavrasChave === 'string') {
      return palavrasChave.split(',').map(p => p.trim()).filter(p => p.length > 0);
    }

    return [];
  }

  /**
   * Carregamento dos dados transformados
   */
  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress('CARREGANDO', 10, 'Iniciando carregamento dos dados');

    try {
      await this.storageManager.initialize();

      // Usar multi-batch manager para grandes volumes
      const multiBatchManager = createMultiBatchManager(this.context.options);
      const results: BatchResult[] = [];

      // 1. Salvar discursos por deputado
      this.emitProgress('CARREGANDO', 30, 'Salvando discursos por deputado');

      const discursosPorDeputado = this.groupDiscursosByDeputado(data.discursos);

      for (const [deputadoId, discursos] of Object.entries(discursosPorDeputado)) {
        // Dados principais do deputado
        const dadosDeputado = {
          idDeputado: deputadoId,
          totalDiscursos: discursos.length,
          ultimaAtualizacao: new Date().toISOString(),
          estatisticas: this.calculateDeputadoStats(discursos)
        };

        await multiBatchManager.set('discursos', deputadoId, dadosDeputado);

        // Salvar discursos em subcoleção
        const discursosDocuments = discursos.map((discurso) => ({
          id: discurso.id || `discurso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          data: discurso
        }));

        for (const doc of discursosDocuments) {
          await multiBatchManager.setSubcollection(
            'discursos',
            deputadoId,
            'dados',
            doc.id,
            doc.data
          );
        }
      }

      // 2. Salvar metadados gerais
      this.emitProgress('CARREGANDO', 70, 'Salvando metadados');

      const metadata = {
        processamento: {
          dataExecucao: new Date().toISOString(),
          versaoETL: '2.0',
          legislatura: this.context.options.legislatura,
          opcoes: this.context.options,
          estatisticas: data.estatisticas
        },
        indices: {
          porDeputado: Object.keys(discursosPorDeputado).length,
          porAno: data.estatisticas.discursosPorAno,
          porTipo: data.estatisticas.discursosPorTipo
        }
      };

      await multiBatchManager.set(
        'metadados',
        `discursos_legislatura_${this.context.options.legislatura}`,
        metadata
      );

      // 3. Executar todos os batches
      this.emitProgress('CARREGANDO', 90, 'Executando commit dos batches');

      const batchResult = await multiBatchManager.commitAll();
      results.push(batchResult);

      // Resultado consolidado
      const finalResult: BatchResult = {
        sucessos: results.reduce((sum, r) => sum + r.sucessos, 0),
        falhas: results.reduce((sum, r) => sum + r.falhas, 0),
        tempoOperacao: results.reduce((sum, r) => sum + r.tempoOperacao, 0),
        detalhes: {
          discursosSalvos: data.discursos.length,
          deputadosProcessados: Object.keys(discursosPorDeputado).length,
          metadadosSalvos: true,
          batchResults: results
        }
      };

      this.context.logger.info(`✅ Carregamento concluído: ${finalResult.sucessos} sucessos, ${finalResult.falhas} falhas`);

      return finalResult;

    } catch (error: any) {
      this.context.logger.error(`❌ Erro no carregamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agrupa discursos por deputado
   */
  private groupDiscursosByDeputado(discursos: DiscursoDeputado[]): Record<string, DiscursoDeputado[]> {
    return discursos.reduce((groups, discurso) => {
      const deputadoId = discurso.idDeputado;
      if (!groups[deputadoId]) {
        groups[deputadoId] = [];
      }
      groups[deputadoId].push(discurso);
      return groups;
    }, {} as Record<string, DiscursoDeputado[]>);
  }

  /**
   * Calcula estatísticas específicas do deputado
   */
  private calculateDeputadoStats(discursos: DiscursoDeputado[]): any {
    return {
      discursosPorAno: discursos.reduce((acc, d) => {
        acc[d.anoDiscurso] = (acc[d.anoDiscurso] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),

      discursosPorTipo: discursos.reduce((acc, d) => {
        const tipo = d.tipoDiscurso || 'OUTROS';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      comTranscricao: discursos.filter(d => d.transcricao).length,
      comPalavrasChave: discursos.filter(d => d.palavrasChave && d.palavrasChave.length > 0).length
    };
  }
}
