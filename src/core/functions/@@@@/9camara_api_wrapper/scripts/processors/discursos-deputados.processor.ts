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
  ProcessingStatus // Adicionar se não estiver presente
} from '../types/etl.types';
import { logger } from '../utils/logging';
import { FirestoreBatchManager, db } from '../utils/storage/firestore/config'; // Importar FirestoreBatchManager e db
import { parseFirestorePath } from '../utils/storage/firestore/helpers'; // Importar parseFirestorePath
import { etlConfig } from '../config/etl.config'; // Usar etlConfig
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
      avisos.push('Modo atualização processará apenas discursos dos últimos 2 meses');
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
      let deputados: DeputadoBasico[] = [];
      let pagina = 1;
      let totalDeputados = 0;

      const { itens, ...baseParams } = endpointConfig.PARAMS; // Usar etlConfig.camara.itemsPerPage

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
        
        await new Promise(resolve => setTimeout(resolve, etlConfig.camara.pauseBetweenRequests / 2));

      } while (deputados.length % (etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE) === 0 && deputados.length > 0);

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

    // Deduplicação
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
   */
  private deduplicateDeputados(deputados: DeputadoBasico[]): DeputadoBasico[] {
    const deputadosUnicos = new Map<string, DeputadoBasico>();
    const duplicados: string[] = [];

    for (const deputado of deputados) {
      const id = deputado.id;

      if (deputadosUnicos.has(id)) {
        duplicados.push(`${deputado.nome} (ID: ${id})`);
        const existente = deputadosUnicos.get(id)!;
        if (deputado.nomeCivil && !existente.nomeCivil) {
          deputadosUnicos.set(id, deputado);
        }
      } else {
        deputadosUnicos.set(id, deputado);
      }
    }

    if (duplicados.length > 0 && this.context.options.verbose) {
      this.context.logger.debug(`📋 Deputados duplicados removidos:`);
      duplicados.forEach(dup => this.context.logger.debug(`   - ${dup}`));
    }
    return Array.from(deputadosUnicos.values());
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
    this.context.logger.info(`📋 Modo: ${modoAtualizacao ? 'ATUALIZAÇÃO INCREMENTAL (últimos 2 meses)' : 'COMPLETO'}`);

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
      const baseParams: Record<string, any> = { // Tipagem explícita para adicionar propriedades dinâmicas
        // ...endpointConfig.PARAMS, // Não incluir PARAMS globais que podem ter dataInicio/dataFim vazios
        idLegislatura: legislatura.toString(),
        ordenarPor: 'dataHoraInicio',
        ordem: 'DESC',
        itens: String(etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE)
      };

      // Adicionar filtros de período se especificados e válidos
      if (this.context.options.dataInicio && typeof this.context.options.dataInicio === 'string' && this.context.options.dataInicio.trim() !== '') {
        baseParams['dataInicio'] = this.context.options.dataInicio;
      }
      if (this.context.options.dataFim && typeof this.context.options.dataFim === 'string' && this.context.options.dataFim.trim() !== '') {
        baseParams['dataFim'] = this.context.options.dataFim;
      }
      
      // Adicionar filtro por palavras chave se especificadas
      if (this.context.options.palavrasChave && Array.isArray(this.context.options.palavrasChave) && this.context.options.palavrasChave.length > 0) {
        baseParams['keywords'] = this.context.options.palavrasChave.join(',');
      }

      // Adicionar filtro por tipo de discurso se especificado
      if (this.context.options.tipo && typeof this.context.options.tipo === 'string' && this.context.options.tipo.trim() !== '') {
        baseParams['siglaTipoDiscurso'] = this.context.options.tipo;
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
        totalPaginas: Math.ceil(todosDiscursos.length / (etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE)) // Usar etlConfig
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
    // Ajustar para buscar os últimos 2 meses corretamente
    dataLimite.setMonth(agora.getMonth() - 2);
    dataLimite.setDate(1); // Primeiro dia de dois meses atrás para garantir cobertura
    dataLimite.setHours(0,0,0,0);


    const legislatura = this.context.options.legislatura!;
    this.context.logger.info(`[Incremental] Buscando discursos para Dep. ${deputadoId} de ${dataLimite.toISOString().split('T')[0]} até ${agora.toISOString().split('T')[0]}`);

    try {
      const endpointConfig = endpoints.DEPUTADOS.DISCURSOS;
      const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });

      const params: Record<string, any> = { // Tipagem explícita
        ...endpointConfig.PARAMS,
        idLegislatura: legislatura.toString(),
        dataInicio: dataLimite.toISOString().split('T')[0], // YYYY-MM-DD
        dataFim: agora.toISOString().split('T')[0], // YYYY-MM-DD
        ordenarPor: 'dataHoraInicio',
        ordem: 'DESC',
        itens: String(etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE) // Usar etlConfig
      };
      
      // Adicionar filtro por palavras chave se especificadas (também no incremental)
      if (this.context.options.palavrasChave && this.context.options.palavrasChave.length > 0) {
        params['keywords'] = this.context.options.palavrasChave.join(',');
      }

      // Adicionar filtro por tipo de discurso se especificado (também no incremental)
      if (this.context.options.tipo) {
        params['siglaTipoDiscurso'] = this.context.options.tipo;
      }

      const discursosRecentes = await apiClient.getAllPages(endpoint, params, {
        context: `Discursos recentes do deputado ${deputadoId}`,
        maxPages: 20 // Limite de páginas para incremental, usando valor fixo
      });

      return {
        deputadoId,
        discursos: discursosRecentes,
        totalDiscursos: discursosRecentes.length,
        totalPaginas: Math.ceil(discursosRecentes.length / (etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE)) // Usar etlConfig
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
   * Carregamento dos dados transformados
   */
  async load(data: TransformedData): Promise<any> { // Alterado para Promise<any> para acomodar retorno customizado
    const inicioCarregamento = Date.now(); // Registrar timestamp de início do carregamento
    this.emitProgress(ProcessingStatus.CARREGANDO, 10, 'Iniciando carregamento dos dados');
    const modoAtualizacao = this.context.options.atualizar || false;
    const batchManager = new FirestoreBatchManager(); // Usar diretamente
    let totalDiscursosSalvosNoBatch = 0;

    try {
      this.emitProgress(ProcessingStatus.CARREGANDO, 30, 'Salvando discursos por deputado');
      const discursosAgrupados = this.groupDiscursosByDeputado(data.discursos);

      for (const [deputadoId, novosDiscursos] of Object.entries(discursosAgrupados)) {
        const basePathDeputado = `congressoNacional/CamaraDeputados/discursos/${deputadoId}`;
        const subcolecaoPath = `${basePathDeputado}/dados`;
        let discursosParaSalvarNoDeputado: DiscursoDeputado[] = novosDiscursos;

        if (modoAtualizacao && novosDiscursos.length > 0) {
          this.context.logger.info(`[Load - Atualização] Verificando discursos existentes para Dep. ${deputadoId}`);
          const discursosExistentes: DiscursoDeputado[] = [];
          try {
            const snapshot = await db.collection(subcolecaoPath).get();
            snapshot.forEach(doc => {
              discursosExistentes.push(doc.data() as DiscursoDeputado);
            });
            this.context.logger.info(`[Load - Atualização] Encontrados ${discursosExistentes.length} discursos existentes para Dep. ${deputadoId}`);
          } catch (e: any) {
            this.context.logger.warn(`[Load - Atualização] Erro ao ler discursos existentes para Dep. ${deputadoId}: ${e.message}`);
          }

          const discursosCombinados = [...discursosExistentes, ...novosDiscursos];
          const mapDiscursosUnicos = new Map<string, DiscursoDeputado>();
          for (const d of discursosCombinados) {
            if (d.id && !mapDiscursosUnicos.has(d.id)) { // Usar ID do discurso para unicidade
              mapDiscursosUnicos.set(d.id, d);
            } else if (!d.id) {
                // Se não houver ID, adicionar de qualquer maneira (pode ser um novo discurso sem ID ainda)
                // ou logar um aviso. Por ora, vamos adicionar, mas idealmente todos teriam ID.
                const chaveFallback = `${d.dataHoraInicio}-${d.tipoDiscurso}-${Math.random()}`;
                mapDiscursosUnicos.set(chaveFallback, d);
                this.context.logger.warn(`Discurso sem ID para Dep. ${deputadoId}, Data: ${d.dataHoraInicio}. Usando chave fallback para batch.`);
            }
          }
          discursosParaSalvarNoDeputado = Array.from(mapDiscursosUnicos.values());
          this.context.logger.info(`[Load - Atualização] Após mesclagem, ${discursosParaSalvarNoDeputado.length} discursos para Dep. ${deputadoId}`);
        }
        
        // Salvar cada discurso individualmente na subcoleção 'dados'
        for (const discurso of discursosParaSalvarNoDeputado) {
          // Garantir que cada discurso tenha um ID para ser usado como ID do documento no Firestore
          let discursoId = discurso.id || `discurso_${new Date(discurso.dataHoraInicio).getTime()}_${Math.random().toString(36).substring(2,9)}`;
          if (!discurso.id) {
            this.context.logger.warn(`Discurso para Dep. ${deputadoId} em ${discurso.dataHoraInicio} não tinha ID. Gerado: ${discursoId}`);
            // Atribuir o ID gerado de volta ao objeto para consistência, se necessário
            // discurso.id = discursoId; 
          }
          // Validar e normalizar o caminho da subcoleção e o ID do discurso
          const { collectionPath: parsedSubcolecaoPath, documentId: parsedDiscursoId } = parseFirestorePath(subcolecaoPath, discursoId);
          await batchManager.set(parsedSubcolecaoPath, parsedDiscursoId, { ...discurso, id: parsedDiscursoId }); // Garantir que o ID está no doc
          totalDiscursosSalvosNoBatch++;
        }

        // Atualizar/Salvar o documento principal do deputado com estatísticas
        if (discursosParaSalvarNoDeputado.length > 0 || !modoAtualizacao) { // Atualizar sempre se não for modo atualização ou se houver discursos
            const dadosDeputadoDoc = {
              idDeputado: deputadoId,
              totalDiscursos: discursosParaSalvarNoDeputado.length,
              ultimaAtualizacao: new Date().toISOString(),
              estatisticas: this.calculateDeputadoStats(discursosParaSalvarNoDeputado)
            };
            const { collectionPath: basePathCol, documentId: basePathDocId } = parseFirestorePath(`congressoNacional/CamaraDeputados/discursos`, deputadoId);
            await batchManager.set(basePathCol, basePathDocId, dadosDeputadoDoc);
        }
      }

      this.emitProgress(ProcessingStatus.CARREGANDO, 70, 'Salvando metadados');
      const metadataCollectionPath = `congressoNacional/CamaraDeputados/discursos`;
      const metadataDocumentId = `metadata_legislatura_${this.context.options.legislatura}`;
      const metadata = {
        processamento: {
          dataExecucao: new Date().toISOString(),
          versaoETL: '2.0', // Manter a versão consistente
          legislatura: this.context.options.legislatura,
          opcoes: this.context.options,
          estatisticasGerais: data.estatisticas
        },
        indices: {
          totalDeputadosComDiscursos: Object.keys(discursosAgrupados).length,
        }
      };
      const { collectionPath: metaColPath, documentId: metaDocId } = parseFirestorePath(metadataCollectionPath, metadataDocumentId);
      await batchManager.set(metaColPath, metaDocId, metadata);

      this.emitProgress(ProcessingStatus.CARREGANDO, 90, 'Executando commit dos batches');
      await batchManager.commit(); // O commit do FirestoreBatchManager não retorna BatchResult diretamente

      // Construir o resultado com base nas estatísticas do processador
      // O BatchManager já loga erros de commit.
      const sucessosEstimados = totalDiscursosSalvosNoBatch + Object.keys(discursosAgrupados).length + 1; // discursos + deputados + metadata
      
      const loadResultDetails = {
        // batchInfo não é mais retornado diretamente pelo commit do FirestoreBatchManager
        // As estatísticas de sucesso/falha do batch são gerenciadas internamente e logadas.
        // O ETLResult do processador refletirá o sucesso geral.
        sucessos: this.context.stats.carregamento.sucesso || sucessosEstimados,
        falhas: this.context.stats.carregamento.falha || 0,
        avisos: this.context.stats.avisos,
        tempoTotalProcessador: Date.now() - this.context.stats.inicio,
        tempoCarregamento: Date.now() - inicioCarregamento,
        discursosSalvos: totalDiscursosSalvosNoBatch,
        deputadosProcessados: Object.keys(discursosAgrupados).length,
        metadadosSalvos: true, // Assumindo que o set do metadata foi para o batch
        comTranscricao: data.estatisticas.discursosComTranscricao,
        comPalavrasChave: data.estatisticas.discursosComPalavrasChave
      };

      this.context.logger.info(`✅ Carregamento concluído: Aproximadamente ${sucessosEstimados} operações no batch.`);
      return loadResultDetails;

    } catch (error: any) {
      this.context.logger.error(`❌ Erro no carregamento: ${error.message}`);
      const numOperacoesEstimadas = totalDiscursosSalvosNoBatch + (data.discursos ? Object.keys(this.groupDiscursosByDeputado(data.discursos)).length : 0) + 1;
      
      return {
        batchInfo: {
          total: numOperacoesEstimadas,
          processados: 0,
          sucessos: 0,
          falhas: numOperacoesEstimadas,
          tempoOperacao: 0,
          detalhes: [{ id: 'geral', status: 'falha', erro: error.message }]
        },
        discursosSalvos: 0,
        deputadosProcessados: 0,
        metadadosSalvos: false,
        comTranscricao: 0,
        comPalavrasChave: 0
      };
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
