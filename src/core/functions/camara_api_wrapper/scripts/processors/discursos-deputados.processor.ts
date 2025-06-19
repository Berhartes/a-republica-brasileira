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
import { createBatchManager } from '../utils/storage';
import { etlConfig } from '../config/etl.config';
import { ProcessingStatus } from '../types/etl.types';
import { firebaseAdmin } from '../utils/storage/firestore'; // Importar firebaseAdmin
import { apiClient, get, replacePath } from '../utils/api';
import * as fs from 'fs/promises';
import * as path from 'path';
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
    let modoAtualizacao = this.context.options.atualizar || false;

    // Novas opções para varredura anual
    const periodosAnuaisParaVarredura = this.context.options.periodosAnuaisParaVarredura;
    const listaDeputadosPreBuscada = this.context.options.listaDeputadosPreBuscada;

    if (periodosAnuaisParaVarredura && periodosAnuaisParaVarredura.length > 0) {
      this.context.logger.info('🗓️ Modo de varredura anual ativado. O modo de atualização incremental será ignorado.');
      modoAtualizacao = false; // Varredura anual tem precedência sobre atualização incremental
    }

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Iniciando extração de dados');

    try {
      let deputadosParaProcessar: DeputadoBasico[];

      if (listaDeputadosPreBuscada && listaDeputadosPreBuscada.length > 0) {
        this.context.logger.info(`👥 Utilizando lista de ${listaDeputadosPreBuscada.length} deputados pré-buscada.`);
        const deputadosDeduplicados = this.deduplicateDeputados(listaDeputadosPreBuscada);
        if (listaDeputadosPreBuscada.length !== deputadosDeduplicados.length) {
          this.context.logger.info(`🔄 Deduplicação na lista pré-buscada: ${listaDeputadosPreBuscada.length} → ${deputadosDeduplicados.length} deputados (removidos ${listaDeputadosPreBuscada.length - deputadosDeduplicados.length} duplicados)`);
        }
        deputadosParaProcessar = deputadosDeduplicados;
        // Aplicar filtros e limite se necessário, mesmo na lista pré-buscada
        deputadosParaProcessar = this.applyFilters(deputadosParaProcessar);
        if (limite > 0 && deputadosParaProcessar.length > limite) {
          this.context.logger.info(`🔢 Aplicando limite: ${limite} de ${deputadosParaProcessar.length} deputados`);
          deputadosParaProcessar = deputadosParaProcessar.slice(0, limite);
        }
      } else if (deputadoEspecifico) {
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
        this.context.logger.warn('⚠️ Nenhum deputado encontrado com os filtros especificados ou na lista pré-buscada');
        return {
          deputados: [],
          discursosPorDeputado: [],
          totalProcessados: 0
        };
      }

      this.emitProgress(ProcessingStatus.EXTRAINDO, 30, `Extraindo discursos de ${deputadosParaProcessar.length} deputados`);

      // Extrair discursos de cada deputado
      const discursosPorDeputado = await this.extractDiscursosDeputados(
        deputadosParaProcessar,
        modoAtualizacao,
        periodosAnuaisParaVarredura // Passar os períodos anuais
      );

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
    modoAtualizacao = false,
    periodosAnuaisParaVarredura?: ETLOptions['periodosAnuaisParaVarredura']
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
          let discursosData;
          if (periodosAnuaisParaVarredura && periodosAnuaisParaVarredura.length > 0) {
            // Modo de varredura anual: chama extractDiscursosCompletos passando os períodos
            this.context.logger.info(`🗓️ Varrendo ${periodosAnuaisParaVarredura.length} períodos anuais para o deputado ${deputado.id}`);
            discursosData = await this.extractDiscursosCompletos(deputado.id, periodosAnuaisParaVarredura);
          } else if (modoAtualizacao) {
            // Modo de atualização incremental (últimos 60 dias)
            discursosData = await this.extractDiscursosIncremental(deputado.id);
          } else {
            // Modo completo padrão (usa dataInicio/dataFim das options)
            discursosData = await this.extractDiscursosCompletos(deputado.id);
          }

          this.incrementSucessos();
          return discursosData;
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
   * Extrai discursos completos de um deputado.
   * Se `periodosAnuais` for fornecido, itera sobre eles. Caso contrário, usa os filtros de data das opções.
   */
  private async extractDiscursosCompletos(
    deputadoId: string,
    periodosAnuais?: ETLOptions['periodosAnuaisParaVarredura']
  ): Promise<ExtractedData['discursosPorDeputado'][0]> {
    const legislatura = this.context.options.legislatura!;
    const endpointConfig = endpoints.DEPUTADOS.DISCURSOS;
    const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });

    let todosOsDiscursosDoDeputado: any[] = [];
    let totalPaginasAcumulado = 0;

    try {
      if (periodosAnuais && periodosAnuais.length > 0) {
        // Modo de varredura por múltiplos períodos anuais
        for (const periodo of periodosAnuais) {
          this.context.logger.debug(`Buscando discursos para deputado ${deputadoId} no período: ${periodo.dataInicio} a ${periodo.dataFim}`);
          const paramsPeriodo: Record<string, any> = {
            ...endpointConfig.PARAMS,
            idLegislatura: legislatura.toString(),
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim,
            ordenarPor: 'dataHoraInicio',
            ordem: 'DESC',
            itens: etlConfig.camara.itemsPerPage?.toString() || '100'
          };

          const discursosDoPeriodo = await apiClient.getAllPages(
            endpoint,
            paramsPeriodo,
            {
              context: `Discursos do deputado ${deputadoId} (período ${periodo.dataInicio}-${periodo.dataFim})`,
              maxPages: 100 // Limite de segurança por período
            }
          );
          todosOsDiscursosDoDeputado.push(...discursosDoPeriodo);
          totalPaginasAcumulado += Math.ceil(discursosDoPeriodo.length / (etlConfig.camara.itemsPerPage || 100));
        }
      } else {
        // Modo de busca com período único (dataInicio/dataFim das options ou sem filtro de data)
        const baseParams: Record<string, any> = {
          ...endpointConfig.PARAMS,
          idLegislatura: legislatura.toString(),
          ordenarPor: 'dataHoraInicio',
          ordem: 'DESC',
          itens: etlConfig.camara.itemsPerPage?.toString() || '100'
        };

        if (this.context.options.dataInicio) {
          baseParams.dataInicio = this.context.options.dataInicio;
        }
        if (this.context.options.dataFim) {
          baseParams.dataFim = this.context.options.dataFim;
        }

        todosOsDiscursosDoDeputado = await apiClient.getAllPages(
          endpoint,
          baseParams,
          {
            context: `Discursos do deputado ${deputadoId} (período global)`,
            maxPages: 100 // Limite de segurança
          }
        );
        totalPaginasAcumulado = Math.ceil(todosOsDiscursosDoDeputado.length / (etlConfig.camara.itemsPerPage || 100));
      }

      return {
        deputadoId,
        discursos: todosOsDiscursosDoDeputado,
        totalDiscursos: todosOsDiscursosDoDeputado.length,
        totalPaginas: totalPaginasAcumulado
      };

    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair discursos completos do deputado ${deputadoId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai discursos em modo incremental (últimos 60 dias)
   */
  private async extractDiscursosIncremental(deputadoId: string): Promise<ExtractedData['discursosPorDeputado'][0]> {
    const agora = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(agora.getDate() - 60); // 60 dias atrás

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
   * Carrega discursos existentes de um deputado, agrupados por ano, da nova estrutura.
   * @param deputadoId ID do deputado.
   * @returns Objeto com discursos existentes, agrupados por ano.
   */
  private async carregarDiscursosExistentesPorAno(deputadoId: string): Promise<Record<number, DiscursoDeputado[]>> {
    const discursosExistentesPorAno: Record<number, DiscursoDeputado[]> = {};
    // NOVO CAMINHO: congressoNacional/camaraDeputados/perfilComplementar/{deputadoId}/discursos/{ano}
    const discursosCollectionRef = firebaseAdmin().firestore()
      .collection(`congressoNacional/camaraDeputados/perfilComplementar/${deputadoId}/discursos`);

    try {
      const snapshot = await discursosCollectionRef.get();
      snapshot.docs.forEach(doc => {
        // Ignora o documento 'stats' se ele existir
        if (doc.id === 'stats') return; 
        
        const ano = parseInt(doc.id);
        const data = doc.data();
        if (!isNaN(ano) && data && Array.isArray(data.items)) {
          discursosExistentesPorAno[ano] = data.items as DiscursoDeputado[];
        }
      });
      this.context.logger.info(`Carregados ${Object.keys(discursosExistentesPorAno).length} documentos anuais de discursos existentes para deputado ${deputadoId} da nova estrutura.`);
    } catch (error: any) {
      this.context.logger.warn(`Erro ao carregar discursos existentes para deputado ${deputadoId} da nova estrutura: ${error.message}`);
    }
    return discursosExistentesPorAno;
  }

  /**
   * Limpa documentos anuais existentes para um deputado na nova estrutura.
   * @param deputadoId ID do deputado.
   */
  private async limparDocumentosAnuaisExistentes(deputadoId: string): Promise<void> {
    // NOVO CAMINHO: congressoNacional/camaraDeputados/perfilComplementar/{deputadoId}/discursos/{ano}
    const discursosCollectionRef = firebaseAdmin().firestore()
      .collection(`congressoNacional/camaraDeputados/perfilComplementar/${deputadoId}/discursos`);
    try {
      const snapshot = await discursosCollectionRef.get();
      const batch = firebaseAdmin().firestore().batch();
      snapshot.docs.forEach(doc => {
         // Não apaga o documento 'stats'
        if (doc.id !== 'stats') {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();
      this.context.logger.info(`Documentos anuais existentes (exceto 'stats') limpos para deputado ${deputadoId} na nova estrutura.`);
    } catch (error: any) {
      this.context.logger.warn(`Aviso na limpeza de documentos anuais para deputado ${deputadoId} na nova estrutura: ${error.message}`);
    }
  }

  /**
   * Carregamento dos dados transformados
   */
  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 10, 'Iniciando carregamento dos dados');
    const isUpdateMode = this.context.options.atualizar;
    const modoPc = this.context.options.pc || false;
    const basePathLocal = path.resolve(process.cwd(), 'src/core/BancoDadosLocal');
    
    let operacoesSucesso = 0;
    let operacoesFalha = 0;
    let batchResultsFirestore: BatchResult | undefined = undefined;
    let discursosPorDeputado: Record<string, DiscursoDeputado[]> = {}; // Mover para escopo mais alto

    try {
      if (modoPc) {
        this.context.logger.info('💻 Modo PC: Salvando dados localmente...');
      } else {
        this.context.logger.info('☁️ Modo Firestore: Salvando dados na nuvem...');
      }
      const batchManager = !modoPc ? createBatchManager() : null;
      
      this.emitProgress(ProcessingStatus.CARREGANDO, 30, 'Salvando discursos por deputado');
      discursosPorDeputado = this.groupDiscursosByDeputado(data.discursos); // Atribuir aqui

      for (const [deputadoId, novosDiscursos] of Object.entries(discursosPorDeputado)) {
        const firestorePathDeputadoDiscursos = `congressoNacional/camaraDeputados/perfilComplementar/${deputadoId}/discursos`;
        const localPathDeputadoDiscursos = path.join(basePathLocal, ...firestorePathDeputadoDiscursos.split('/'));
        let discursosFinaisPorAno: Record<number, DiscursoDeputado[]> = {};

        if (isUpdateMode) {
          this.context.logger.info(`Modo atualização: mesclando novos discursos para deputado ${deputadoId}`);
          let discursosExistentesPorAno: Record<number, DiscursoDeputado[]> = {};
          if (modoPc) {
            // Ler do PC
            try {
              const anosSalvos = await fs.readdir(localPathDeputadoDiscursos);
              for (const anoStr of anosSalvos) {
                if (anoStr.endsWith('.json') && anoStr !== 'stats.json') {
                  const ano = parseInt(anoStr.replace('.json', ''));
                  if (!isNaN(ano)) {
                    const filePath = path.join(localPathDeputadoDiscursos, anoStr);
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    const docData = JSON.parse(fileContent);
                    if (docData && Array.isArray(docData.items)) {
                      discursosExistentesPorAno[ano] = docData.items as DiscursoDeputado[];
                    }
                  }
                }
              }
            } catch (e: any) {
              if (e.code !== 'ENOENT') this.context.logger.warn(`[Load PC - Atualização] Erro ao listar/ler arquivos de discursos existentes para Dep. ${deputadoId}: ${e.message}`);
            }
          } else {
            discursosExistentesPorAno = await this.carregarDiscursosExistentesPorAno(deputadoId); // Firestore
          }
          
          discursosFinaisPorAno = { ...discursosExistentesPorAno };
          novosDiscursos.forEach(novoDiscurso => {
            const ano = novoDiscurso.anoDiscurso;
            if (!discursosFinaisPorAno[ano]) discursosFinaisPorAno[ano] = [];
            if (!discursosFinaisPorAno[ano].some(d => d.id === novoDiscurso.id)) {
              discursosFinaisPorAno[ano].push(novoDiscurso);
            }
          });
        } else { // Modo completo
          this.context.logger.info(`Modo completo: substituindo discursos para deputado ${deputadoId}`);
          if (modoPc) {
            try {
              await fs.rm(localPathDeputadoDiscursos, { recursive: true, force: true }); // Limpa diretório do deputado
            } catch (e: any) {
              if (e.code !== 'ENOENT') this.context.logger.warn(`[Load PC - Completo] Aviso ao limpar diretório ${localPathDeputadoDiscursos}: ${e.message}`);
            }
          } else {
            await this.limparDocumentosAnuaisExistentes(deputadoId); // Firestore
          }
          discursosFinaisPorAno = novosDiscursos.reduce((acc: Record<number, DiscursoDeputado[]>, discurso) => {
            const ano = discurso.anoDiscurso;
            if (!acc[ano]) acc[ano] = [];
            acc[ano].push(discurso);
            return acc;
          }, {});
        }

        const dadosEstatisticasDiscursos = {
          idDeputado: deputadoId,
          totalDiscursos: Object.values(discursosFinaisPorAno).flat().length,
          ultimaAtualizacao: new Date().toISOString(),
          estatisticas: this.calculateDeputadoStats(Object.values(discursosFinaisPorAno).flat())
        };
        const firestorePathStats = `${firestorePathDeputadoDiscursos}/stats`;
        const localFilePathStats = path.join(localPathDeputadoDiscursos, 'stats.json');

        if (modoPc) {
          try {
            await fs.mkdir(path.dirname(localFilePathStats), { recursive: true });
            await fs.writeFile(localFilePathStats, JSON.stringify(dadosEstatisticasDiscursos, null, 2));
            operacoesSucesso++;
          } catch (e: any) {
            this.context.logger.error(`[Load PC] Erro ao salvar arquivo de estatísticas ${localFilePathStats}: ${e.message}`);
            operacoesFalha++;
          }
        } else if (batchManager) {
          await batchManager.set(firestorePathStats, dadosEstatisticasDiscursos);
        }

        for (const [ano, discursosDoAno] of Object.entries(discursosFinaisPorAno)) {
          const firestoreDocPathAno = `${firestorePathDeputadoDiscursos}/${ano}`;
          const localFilePathAno = path.join(localPathDeputadoDiscursos, `${ano}.json`);
          const dataToSave = {
            ano: parseInt(ano),
            totalDiscursos: discursosDoAno.length,
            ultimaAtualizacao: new Date().toISOString(),
            items: discursosDoAno 
          };
          if (modoPc) {
            try {
              await fs.mkdir(path.dirname(localFilePathAno), { recursive: true });
              await fs.writeFile(localFilePathAno, JSON.stringify(dataToSave, null, 2));
              operacoesSucesso++;
            } catch (e: any) {
              this.context.logger.error(`[Load PC] Erro ao salvar arquivo ${localFilePathAno}: ${e.message}`);
              operacoesFalha++;
            }
          } else if (batchManager) {
            await batchManager.set(firestoreDocPathAno, dataToSave);
          }
        }
      }

      this.emitProgress(ProcessingStatus.CARREGANDO, 70, 'Salvando metadados');
      const firestoreMetadataPath = `congressoNacional/camaraDeputados/perfilComplementar/estatisticasGerais/discursos/legislatura_${this.context.options.legislatura}`;
      const localMetadataFilePath = path.join(basePathLocal, ...firestoreMetadataPath.split('/')) + '.json';
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

      if (modoPc) {
        try {
          await fs.mkdir(path.dirname(localMetadataFilePath), { recursive: true });
          await fs.writeFile(localMetadataFilePath, JSON.stringify(metadata, null, 2));
          operacoesSucesso++;
        } catch (e: any) {
          this.context.logger.error(`[Load PC] Erro ao salvar arquivo de metadados ${localMetadataFilePath}: ${e.message}`);
          operacoesFalha++;
        }
      } else if (batchManager) {
        await batchManager.set(firestoreMetadataPath, metadata);
      }
      
      if (!modoPc && batchManager) {
        this.emitProgress(ProcessingStatus.CARREGANDO, 90, 'Executando commit dos batches');
        batchResultsFirestore = await batchManager.commit();
        operacoesSucesso = batchResultsFirestore.sucessos;
        operacoesFalha = batchResultsFirestore.falhas;
      }

      const finalResult: BatchResult = {
        total: operacoesSucesso + operacoesFalha,
        processados: operacoesSucesso + operacoesFalha,
        sucessos: operacoesSucesso,
        falhas: operacoesFalha,
        tempoOperacao: batchResultsFirestore?.tempoOperacao || 0,
        detalhes: {
          discursosSalvos: data.discursos.length,
          deputadosProcessados: Object.keys(discursosPorDeputado).length,
          comTranscricao: data.estatisticas.discursosComTranscricao,
          metadadosSalvos: true, // Assumindo sucesso se não houver erro
          batchResults: batchResultsFirestore ? [batchResultsFirestore] : []
        } as DiscursosBatchResultDetails
      };

      this.context.logger.info(`✅ Carregamento concluído: ${finalResult.sucessos} sucessos, ${finalResult.falhas} falhas`);
      return finalResult;

    } catch (error: any) {
      this.context.logger.error(`❌ Erro no carregamento: ${error.message}`);
      // No modo PC, as falhas já foram contabilizadas. Para Firestore, o erro pode ser do commit.
      if (!modoPc && error && typeof error === 'object' && 'falhas' in error) {
         operacoesFalha = (error as BatchResult).falhas; // Atualiza falhas se o erro for do commit do Firestore
      } else if (!modoPc) {
         // Se discursosPorDeputado não foi inicializado, não podemos usá-lo aqui.
         // Usar um valor seguro ou reavaliar a contagem de falhas.
         const numDeputados = Object.keys(discursosPorDeputado || {}).length;
         operacoesFalha = data.discursos.length + numDeputados + 1; // Estimativa se erro genérico no Firestore
      }
      // Para modo PC, operacoesSucesso e operacoesFalha já refletem o estado.
      
      // O tipo BatchResult não tem 'erros'. Se for necessário, o tipo de retorno de load()
      // precisaria ser alterado para algo como ETLResult, ou o erro é simplesmente lançado.
      // Por ora, vamos construir um BatchResult que indica falha.
      this.context.logger.error(`❌ Erro fatal no carregamento: ${error.message}`);
      // Lançar o erro permite que o initiator o capture e trate como erro fatal.
      // Se quisermos retornar um BatchResult indicando falha, seria:
      return {
        total: operacoesSucesso + operacoesFalha,
        processados: operacoesSucesso + operacoesFalha,
        sucessos: operacoesSucesso,
        falhas: operacoesFalha,
        tempoOperacao: 0,
        detalhes: {
          discursosSalvos: 0, 
          deputadosProcessados: 0,
          comTranscricao: 0,
          metadadosSalvos: false,
          batchResults: []
        } as DiscursosBatchResultDetails
        // Não adicionar 'erros' aqui, pois não faz parte do tipo BatchResult
      };
      // Alternativamente, para propagar o erro: throw error;
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
