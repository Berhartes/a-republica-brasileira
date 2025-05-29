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
  ETLOptions,
  DiscursosBatchResultDetails // Adicionado
} from '../types/etl.types';
import { logger } from '../utils/logging';
import { createBatchManager } from '../utils/storage';
import { etlConfig } from '../config/etl.config';
import { ProcessingStatus } from '../types/etl.types';
import { firebaseAdmin } from '../utils/storage/firestore'; // Importar firebaseAdmin
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
  private storageManager = createBatchManager();

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

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Iniciando extração de dados');

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

      this.emitProgress(ProcessingStatus.EXTRAINDO, 30, `Extraindo discursos de ${deputadosParaProcessar.length} deputados`);

      // Extrair discursos de cada deputado
      const discursosPorDeputado = await this.extractDiscursosDeputados(deputadosParaProcessar, modoAtualizacao);

      this.emitProgress(ProcessingStatus.EXTRAINDO, 90, 'Extração concluída');

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

      // Usar getAllPages para extrair todas as páginas de deputados
      const todosDeputados = await apiClient.getAllPages(
        endpointConfig.PATH,
        params,
        {
          context: `Lista de deputados da legislatura ${legislatura}`,
          maxPages: 10 // Limite de segurança para evitar loops infinitos em APIs problemáticas
        }
      );

      if (!todosDeputados || !Array.isArray(todosDeputados)) {
        throw new Error(`Nenhum deputado encontrado para a legislatura ${legislatura}`);
      }

      const deputados: DeputadoBasico[] = todosDeputados.map((dep: any) => ({
        id: dep.id?.toString() || '',
        nome: dep.nome || '',
        nomeCivil: dep.nomeCivil,
        siglaPartido: dep.siglaPartido || '',
        siglaUf: dep.siglaUf || '',
        idLegislatura: legislatura,
        urlFoto: dep.urlFoto
      }));

      // Adicionar deduplicação
      const deputadosDeduplicados = this.deduplicateDeputados(deputados);

      this.context.logger.info(`✅ Encontrados ${deputadosDeduplicados.length} deputados na ${legislatura}ª Legislatura (original: ${deputados.length})`);
      return deputadosDeduplicados;

    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair lista de deputados: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove deputados duplicados baseado no ID
   */
  private deduplicateDeputados(deputados: DeputadoBasico[]): DeputadoBasico[] {
    const deputadosUnicos = new Map<string, DeputadoBasico>();
    for (const deputado of deputados) {
      const id = deputado.id;
      if (!deputadosUnicos.has(id)) {
        deputadosUnicos.set(id, deputado);
      }
    }
    return Array.from(deputadosUnicos.values());
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
      this.emitProgress(ProcessingStatus.EXTRAINDO, progresso, `${resultados.length}/${deputados.length} deputados processados (${totalDiscursos} discursos)`);

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
      const baseParams: Record<string, any> = { // Adicionado tipo explícito
        ...endpointConfig.PARAMS,
        idLegislatura: legislatura.toString(),
        ordenarPor: 'dataHoraInicio',
        ordem: 'DESC',
        itens: etlConfig.camara.itemsPerPage?.toString() || '100'
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
        totalPaginas: Math.ceil(todosDiscursos.length / (etlConfig.camara.itemsPerPage || 100))
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
        itens: etlConfig.camara.itemsPerPage?.toString() || '100'
      };

      const discursosRecentes = await apiClient.getAllPages(endpoint, params, {
        context: `Discursos recentes do deputado ${deputadoId}`,
        maxPages: 20
      });

      return {
        deputadoId,
        discursos: discursosRecentes,
        totalDiscursos: discursosRecentes.length,
        totalPaginas: Math.ceil(discursosRecentes.length / (etlConfig.camara.itemsPerPage || 100))
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
    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 10, 'Iniciando transformação dos dados');

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
        this.emitProgress(ProcessingStatus.TRANSFORMANDO, progresso, `${discursosTransformados.length} discursos transformados`);
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
   * Carrega discursos existentes de um deputado, agrupados por ano.
   * @param deputadoId ID do deputado.
   * @returns Objeto com discursos existentes, agrupados por ano.
   */
  private async carregarDiscursosExistentesPorAno(deputadoId: string): Promise<Record<number, DiscursoDeputado[]>> {
    const discursosExistentesPorAno: Record<number, DiscursoDeputado[]> = {};
    const dadosCollectionRef = firebaseAdmin().firestore().collection(`congressoNacional/camaraDeputados/discursos/${deputadoId}/dados`);

    try {
      const snapshot = await dadosCollectionRef.get();
      snapshot.docs.forEach(doc => {
        const ano = parseInt(doc.id);
        const data = doc.data();
        if (!isNaN(ano) && data && Array.isArray(data.items)) {
          discursosExistentesPorAno[ano] = data.items as DiscursoDeputado[];
        }
      });
      this.context.logger.info(`Carregados ${Object.keys(discursosExistentesPorAno).length} documentos anuais de discursos existentes para deputado ${deputadoId}`);
    } catch (error: any) {
      this.context.logger.warn(`Erro ao carregar discursos existentes para deputado ${deputadoId}: ${error.message}`);
    }
    return discursosExistentesPorAno;
  }

  /**
   * Limpa documentos anuais existentes para um deputado.
   * @param deputadoId ID do deputado.
   */
  private async limparDocumentosAnuaisExistentes(deputadoId: string): Promise<void> {
    const dadosCollectionRef = firebaseAdmin().firestore().collection(`congressoNacional/camaraDeputados/discursos/${deputadoId}/dados`);
    try {
      const snapshot = await dadosCollectionRef.get();
      const batch = firebaseAdmin().firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      this.context.logger.info(`Documentos anuais existentes limpos para deputado ${deputadoId}`);
    } catch (error: any) {
      this.context.logger.warn(`Aviso na limpeza de documentos anuais para deputado ${deputadoId}: ${error.message}`);
    }
  }

  /**
   * Carregamento dos dados transformados
   */
  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 10, 'Iniciando carregamento dos dados');
    const isUpdateMode = this.context.options.atualizar;
    let totalDocumentsSaved = 0;

    try {
      const multiBatchManager = createBatchManager();
      const results: BatchResult[] = [];

      // 1. Salvar discursos por deputado
      this.emitProgress(ProcessingStatus.CARREGANDO, 30, 'Salvando discursos por deputado');

      const discursosPorDeputado = this.groupDiscursosByDeputado(data.discursos);

      for (const [deputadoId, novosDiscursos] of Object.entries(discursosPorDeputado)) {
        const deputadoDocPath = `congressoNacional/camaraDeputados/discursos/${deputadoId}`;
        let discursosFinaisPorAno: Record<number, DiscursoDeputado[]> = {};

        if (isUpdateMode) {
          // Modo atualização: carregar existentes e mesclar
          this.context.logger.info(`Modo atualização: mesclando novos discursos para deputado ${deputadoId}`);
          const discursosExistentesPorAno = await this.carregarDiscursosExistentesPorAno(deputadoId);
          
          // Combinar discursos existentes com os novos
          discursosFinaisPorAno = { ...discursosExistentesPorAno };
          
          novosDiscursos.forEach(novoDiscurso => {
            const ano = novoDiscurso.anoDiscurso;
            if (!discursosFinaisPorAno[ano]) {
              discursosFinaisPorAno[ano] = [];
            }
            // Adicionar apenas se não for duplicata (baseado no ID do discurso)
            if (!discursosFinaisPorAno[ano].some(d => d.id === novoDiscurso.id)) {
              discursosFinaisPorAno[ano].push(novoDiscurso);
            }
          });
        } else {
          // Modo completo: apenas os novos discursos
          this.context.logger.info(`Modo completo: substituindo discursos para deputado ${deputadoId}`);
          // Limpar documentos anuais existentes antes de salvar os novos em modo completo
          await this.limparDocumentosAnuaisExistentes(deputadoId);
          discursosFinaisPorAno = novosDiscursos.reduce((acc: Record<number, DiscursoDeputado[]>, discurso) => {
            const ano = discurso.anoDiscurso;
            if (!acc[ano]) {
              acc[ano] = [];
            }
            acc[ano].push(discurso);
            return acc;
          }, {});
        }

        // Salvar dados principais do deputado
        const dadosDeputado = {
          idDeputado: deputadoId,
          totalDiscursos: Object.values(discursosFinaisPorAno).flat().length, // Total de discursos após mesclagem
          ultimaAtualizacao: new Date().toISOString(),
          estatisticas: this.calculateDeputadoStats(Object.values(discursosFinaisPorAno).flat())
        };
        await multiBatchManager.set(deputadoDocPath, dadosDeputado);
        totalDocumentsSaved++; // Conta o documento principal

        // Salvar discursos em subcoleção, agrupados por ano
        for (const [ano, discursosDoAno] of Object.entries(discursosFinaisPorAno)) {
          const anoDocPath = `${deputadoDocPath}/dados/${ano}`;
          await multiBatchManager.set(anoDocPath, {
            ano: parseInt(ano),
            totalDiscursos: discursosDoAno.length,
            ultimaAtualizacao: new Date().toISOString(),
            items: discursosDoAno // Array de discursos para o ano
          });
          totalDocumentsSaved++; // Conta cada documento anual
        }
      }

      // 2. Salvar metadados gerais
      this.emitProgress(ProcessingStatus.CARREGANDO, 70, 'Salvando metadados');

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

      // Caminho para o documento de metadados da legislatura
      await multiBatchManager.set(
        `congressoNacional/camaraDeputados/metadados/discursos_legislatura_${this.context.options.legislatura}`,
        metadata
      );
      totalDocumentsSaved++; // Conta o documento de metadados

      // 3. Executar todos os batches
      this.emitProgress(ProcessingStatus.CARREGANDO, 90, 'Executando commit dos batches');

      const batchResult = await multiBatchManager.commit();
      results.push(batchResult);

      // Resultado consolidado
      const finalResult: BatchResult = {
        total: totalDocumentsSaved, // Usar o total de documentos que tentamos salvar
        processados: batchResult.sucessos + batchResult.falhas, // Total de operações processadas pelo batch
        sucessos: batchResult.sucessos,
        falhas: batchResult.falhas,
        tempoOperacao: batchResult.tempoOperacao,
        detalhes: {
          discursosSalvos: data.discursos.length, // Total de discursos transformados
          deputadosProcessados: Object.keys(discursosPorDeputado).length,
          metadadosSalvos: true,
          batchResults: results
        } as DiscursosBatchResultDetails
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
