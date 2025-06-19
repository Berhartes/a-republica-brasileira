/**
 * Processador ETL para Partidos Políticos da Câmara
 */

import { ETLProcessor } from '../core/etl-processor';
import {
  ValidationResult,
  BatchResult, // Adicionado BatchResult
  ETLOptions,
  ProcessingStatus,
  ETLResult,
  PartidoBasico,
  DetalhesPartidoAPI,
  LiderPartidoAPI,
  MembroPartidoAPI,
  PartidoCompleto,
  PartidoExtractedData,
  PartidoTransformedData,
} from '../types/etl.types';
import { createBatchManager } from '../utils/storage';
import { etlConfig } from '../config/etl.config';
import { apiClient, get, replacePath } from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/logging/error-handler';

/**
 * Processador de Partidos Políticos
 */
export class PartidosProcessor extends ETLProcessor<PartidoExtractedData, PartidoTransformedData> {
  constructor(options: ETLOptions) {
    super(options);
  }

  protected getProcessName(): string {
    return 'Processador de Partidos Políticos';
  }

  async validate(): Promise<ValidationResult> {
    const baseValidation = this.validateCommonParams();
    const erros = [...baseValidation.erros];
    const avisos = [...baseValidation.avisos];

    if (!this.context.options.legislatura) {
      erros.push('Legislatura é obrigatória para extrair partidos.');
    }

    if (this.context.options.limite && this.context.options.limite > 50) {
      // A API de partidos retorna no máximo 100 por página, mas o limite aqui é para o número total a processar.
      avisos.push('Limite alto de partidos para processamento detalhado pode ser demorado.');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos,
    };
  }

  async extract(): Promise<PartidoExtractedData> {
    const legislatura = this.context.options.legislatura!;
    const limite = this.context.options.limite || 0;

    this.emitProgress(ProcessingStatus.EXTRAINDO, 5, 'Iniciando extração de partidos');

    try {
      // 1. Extrair lista de partidos da legislatura
      this.context.logger.info(`📋 Extraindo lista de partidos da ${legislatura}ª Legislatura`);
      const partidosBasicos = await this.extractPartidosLegislatura(legislatura);

      if (partidosBasicos.length === 0) {
        this.context.logger.warn('⚠️ Nenhum partido encontrado para a legislatura especificada.');
        return {
          partidosBasicos: [],
          partidosCompletos: [],
          totalProcessados: 0,
        };
      }

      let partidosParaProcessar = partidosBasicos;
      if (limite > 0 && partidosBasicos.length > limite) {
        this.context.logger.info(`🔢 Aplicando limite: ${limite} de ${partidosBasicos.length} partidos`);
        partidosParaProcessar = partidosBasicos.slice(0, limite);
      }

      this.emitProgress(ProcessingStatus.EXTRAINDO, 20, `Extraindo detalhes de ${partidosParaProcessar.length} partidos`);

      // 2. Extrair detalhes completos de cada partido (detalhes, líderes, membros)
      const partidosCompletos = await this.extractPartidosCompletos(partidosParaProcessar, legislatura);

      this.emitProgress(ProcessingStatus.EXTRAINDO, 90, 'Extração de partidos concluída');

      return {
        partidosBasicos,
        partidosCompletos,
        totalProcessados: partidosCompletos.length,
      };
    } catch (error: any) {
      this.context.logger.error(`❌ Erro na extração de partidos: ${error.message}`);
      throw error;
    }
  }

  private async extractPartidosLegislatura(legislatura: number): Promise<PartidoBasico[]> {
    try {
      const endpointConfig = endpoints.PARTIDOS.LISTA;
      const params = {
        ...endpointConfig.PARAMS,
        idLegislatura: legislatura.toString(),
        itens: '100', // Máximo permitido pela API
      };

      const todosPartidosAPI = await apiClient.getAllPages(
        endpointConfig.PATH,
        params,
        {
          context: `Lista de partidos da legislatura ${legislatura}`,
          maxPages: 10, // Ajustar se necessário (improvável ter mais de 1000 partidos)
        },
      );

      if (!todosPartidosAPI || !Array.isArray(todosPartidosAPI)) {
        this.context.logger.warn(`Nenhum dado de partido retornado pela API para a legislatura ${legislatura}`);
        return [];
      }

      const partidos: PartidoBasico[] = todosPartidosAPI.map((partido: any) => ({
        id: partido.id?.toString() || '',
        sigla: partido.sigla || '',
        nome: partido.nome || '',
        uri: partido.uri || '',
        idLegislatura: legislatura,
      }));

      this.context.logger.info(`✅ Encontrados ${partidos.length} partidos na ${legislatura}ª Legislatura`);
      return partidos;
    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair lista de partidos: ${error.message}`);
      throw error;
    }
  }

  private async extractPartidosCompletos(partidos: PartidoBasico[], legislatura: number): Promise<PartidoCompleto[]> {
    const partidosCompletos: PartidoCompleto[] = [];
    const concorrencia = this.context.options.concorrencia || 3;

    this.context.logger.info(`🔄 Extraindo detalhes, líderes e membros com concorrência: ${concorrencia}`);

    for (let i = 0; i < partidos.length; i += concorrencia) {
      const lote = partidos.slice(i, i + concorrencia);
      this.context.logger.info(`📦 Processando lote de partidos ${Math.floor(i / concorrencia) + 1}: ${lote.length} partidos`);

      const promessas = lote.map(async (partidoBasico) => {
        try {
          const detalhes = await this.extractDetalhesPartido(partidoBasico.id);
          const lideres = await this.extractLideresPartido(partidoBasico.id);
          const membros = await this.extractMembrosPartido(partidoBasico.id, legislatura);

          this.incrementSucessos();
          return {
            ...partidoBasico,
            detalhes,
            lideres,
            membros,
            dataExtracao: new Date().toISOString(),
          };
        } catch (error: any) {
          this.context.logger.error(`❌ Erro ao extrair dados completos do partido ${partidoBasico.id}: ${error.message}`);
          this.incrementFalhas();
          return null;
        }
      });

      const resultados = await Promise.allSettled(promessas);
      resultados.forEach((resultado) => {
        if (resultado.status === 'fulfilled' && resultado.value) {
          partidosCompletos.push(resultado.value);
        }
      });

      const progresso = Math.min(90, 20 + ((i + lote.length) / partidos.length) * 70);
      this.emitProgress(ProcessingStatus.EXTRAINDO, progresso, `${partidosCompletos.length}/${partidos.length} partidos com detalhes`);

      if (i + concorrencia < partidos.length) {
        await new Promise(resolve => setTimeout(resolve, etlConfig.camara.pauseBetweenRequests));
      }
    }
    this.context.logger.info(`✅ Extração de detalhes concluída: ${partidosCompletos.length} de ${partidos.length} partidos`);
    return partidosCompletos;
  }

  private async extractDetalhesPartido(partidoId: string): Promise<DetalhesPartidoAPI | null> {
    const endpointConfig = endpoints.PARTIDOS.DETALHES;
    const path = replacePath(endpointConfig.PATH, { codigo: partidoId });
    try {
      const response = await withRetry(
        () => get(path, endpointConfig.PARAMS),
        etlConfig.camara.maxRetries,
        etlConfig.camara.pauseBetweenRequests,
        `Detalhes do partido ${partidoId}`,
      );
      return response?.dados || null;
    } catch (error: any) {
      this.context.logger.warn(`⚠️ Erro ao buscar detalhes do partido ${partidoId}: ${error.message}. Detalhes não serão incluídos.`);
      return null; // Não interrompe o fluxo, apenas não adiciona detalhes
    }
  }

  private async extractLideresPartido(partidoId: string): Promise<LiderPartidoAPI[]> {
    const endpointConfig = endpoints.PARTIDOS.LIDERES;
    const path = replacePath(endpointConfig.PATH, { codigo: partidoId });
    try {
      const response = await withRetry(
        () => get(path, endpointConfig.PARAMS),
        etlConfig.camara.maxRetries,
        etlConfig.camara.pauseBetweenRequests,
        `Líderes do partido ${partidoId}`,
      );
      return response?.dados || [];
    } catch (error: any) {
      this.context.logger.warn(`⚠️ Erro ao buscar líderes do partido ${partidoId}: ${error.message}. Líderes não serão incluídos.`);
      return [];
    }
  }

  private async extractMembrosPartido(partidoId: string, legislatura: number): Promise<MembroPartidoAPI[]> {
    const endpointConfig = endpoints.PARTIDOS.MEMBROS;
    const path = replacePath(endpointConfig.PATH, { codigo: partidoId });
    const params = { ...endpointConfig.PARAMS, idLegislatura: legislatura.toString() };
    try {
      // A API de membros pode ser paginada, mas o getAllPages já está no extractPartidosLegislatura.
      // Aqui, assumimos que a chamada direta já traz todos ou que o getAllPages seria usado se necessário.
      // Para simplificar, vamos fazer uma chamada direta. Se for paginado, precisaria de getAllPages aqui também.
      const response = await withRetry(
        () => get(path, params),
        etlConfig.camara.maxRetries,
        etlConfig.camara.pauseBetweenRequests,
        `Membros do partido ${partidoId} na legislatura ${legislatura}`,
      );
      return response?.dados || [];
    } catch (error: any) {
      this.context.logger.warn(`⚠️ Erro ao buscar membros do partido ${partidoId} (leg ${legislatura}): ${error.message}. Membros não serão incluídos.`);
      return [];
    }
  }

  async transform(data: PartidoExtractedData): Promise<PartidoTransformedData> {
    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 10, 'Iniciando transformação dos dados de partidos');
    const partidosTransformados: PartidoCompleto[] = [];
    const partidosPorLegislatura: Record<number, number> = {};
    let totalLideresConsultados = 0;
    let totalMembrosConsultados = 0;

    for (let i = 0; i < data.partidosCompletos.length; i++) {
      const partido = data.partidosCompletos[i];
      // Simples transformação por enquanto, poderia haver mais lógica aqui
      partidosTransformados.push(partido);

      partidosPorLegislatura[partido.idLegislatura] = (partidosPorLegislatura[partido.idLegislatura] || 0) + 1;
      if (partido.lideres.length > 0) totalLideresConsultados++;
      if (partido.membros.length > 0) totalMembrosConsultados++;


      const progresso = Math.round(((i + 1) / data.partidosCompletos.length) * 100);
      this.emitProgress(ProcessingStatus.TRANSFORMANDO, progresso, `${i + 1}/${data.partidosCompletos.length} partidos transformados`);
    }

    this.context.logger.info(`✅ Transformação concluída: ${partidosTransformados.length} partidos transformados`);
    return {
      partidos: partidosTransformados,
      estatisticas: {
        totalPartidos: partidosTransformados.length,
        totalLideresConsultados,
        totalMembrosConsultados,
        partidosPorLegislatura,
      },
    };
  }

  async load(data: PartidoTransformedData): Promise<ETLResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 5, 'Iniciando carregamento dos dados de partidos');
    const startTime = Date.now();
    const legislaturaAtual = this.context.options.legislatura!;
    const destinos = Array.isArray(this.context.options.destino)
      ? this.context.options.destino
      : [this.context.options.destino];

    let totalSucessos = 0;
    let totalFalhas = 0;

    const fs = require('fs');
    const path = require('path');
    const { getPCSaveDirectory } = require('../utils/storage/firestore');

    // Lógica de salvamento para PC
    if (destinos.includes('pc')) {
      this.emitProgress(ProcessingStatus.CARREGANDO, 10, 'Salvando dados de partidos no PC');
      const rootSaveDir = getPCSaveDirectory() || './output_pc_partidos';
      const baseSaveDir = path.join(rootSaveDir, 'bancoDados_local', 'congressoNacional', 'camaraDeputados');
      
      const pcSavePathPartidos = path.join(baseSaveDir, 'partidos');
      const pcSavePathLegPartidos = path.join(baseSaveDir, 'legislaturas', `${legislaturaAtual}`, 'partidos'); // Ajustado para 'legislaturas'
      const pcSavePathMetadata = path.join(baseSaveDir, 'partidos'); // Metadados gerais de partidos

      try {
        fs.mkdirSync(pcSavePathPartidos, { recursive: true });
        fs.mkdirSync(pcSavePathLegPartidos, { recursive: true });

        // 1. Salvar partidos individuais
        for (const partido of data.partidos) {
          const filePath = path.join(pcSavePathPartidos, `${partido.id}.json`);
          fs.writeFileSync(filePath, JSON.stringify(partido, null, 2));
          totalSucessos++;
        }
        this.emitProgress(ProcessingStatus.CARREGANDO, 25, 'Partidos individuais salvos no PC');

        // 2. Salvar referência de partidos na legislatura
        const listaPartidosParaMetadataPC = data.partidos.map(p => ({
          id: p.id,
          sigla: p.sigla,
          nome: p.nome,
          totalMembros: p.membros.length,
        }));
        const legislaturaPartidosFilePath = path.join(pcSavePathLegPartidos, `todos.json`);
        fs.writeFileSync(legislaturaPartidosFilePath, JSON.stringify({
          legislatura: legislaturaAtual,
          totalPartidos: data.partidos.length,
          partidos: listaPartidosParaMetadataPC,
          ultimaAtualizacao: new Date().toISOString()
        }, null, 2));
        totalSucessos++;
        this.emitProgress(ProcessingStatus.CARREGANDO, 40, 'Partidos da legislatura salvos no PC');
        
        // 3. Salvar metadados gerais de partidos (para esta legislatura)
        const metadataPC = {
          legislatura: legislaturaAtual,
          totalPartidosProcessados: data.partidos.length,
          estatisticasGerais: data.estatisticas,
          ultimaAtualizacao: new Date().toISOString(),
          processamento: {
            dataExecucao: new Date().toISOString(),
            versaoETL: '2.0',
            opcoes: this.context.options,
          }
        };
        const metadataFilePath = path.join(pcSavePathMetadata, `metadata_legislatura_${legislaturaAtual}.json`);
        fs.writeFileSync(metadataFilePath, JSON.stringify(metadataPC, null, 2));
        totalSucessos++;
        this.emitProgress(ProcessingStatus.CARREGANDO, 50, 'Metadados de partidos salvos no PC');
        this.context.logger.info(`✅ Dados de partidos salvos no PC em: ${rootSaveDir}`);

      } catch (error: any) {
        this.context.logger.error(`❌ Erro ao salvar dados de partidos no PC: ${error.message}`);
        totalFalhas += data.partidos.length + 2; // Estimativa
      }
    }

    // Lógica de salvamento para Firestore
    if (destinos.includes('firestore') || destinos.includes('emulator')) {
      this.emitProgress(ProcessingStatus.CARREGANDO, 60, 'Iniciando salvamento de partidos no Firestore');
      const batchManager = createBatchManager();
      let firestoreDocumentosSalvos = 0;
      let firestoreFalhas = 0;

      try {
        // 1. Salvar partidos individuais diretamente na coleção da legislatura
        this.emitProgress(ProcessingStatus.CARREGANDO, 70, 'Salvando partidos na legislatura no Firestore');
        for (const partido of data.partidos) {
          // Cada partido (com todos os seus detalhes, membros, líderes) será um documento aqui
          const firestorePath = `congressoNacional/camaraDeputados/legislatura/${legislaturaAtual}/partidos/${partido.id}`;
          await batchManager.set(firestorePath, partido);
        }

        // 2. Salvar metadados da coleção de partidos da legislatura (agora como 'informacoes')
        this.emitProgress(ProcessingStatus.CARREGANDO, 90, 'Salvando informações gerais da legislatura no Firestore');
        const metadataPathFirestore = `congressoNacional/camaraDeputados/legislatura/${legislaturaAtual}/partidos/informacoes`;
        await batchManager.set(metadataPathFirestore, {
          legislatura: legislaturaAtual,
          totalPartidosProcessados: data.partidos.length,
          estatisticasGerais: data.estatisticas,
          ultimaAtualizacao: new Date().toISOString(),
          processamento: {
            dataExecucao: new Date().toISOString(),
            versaoETL: '2.0', 
            opcoes: this.context.options,
          },
        });

        this.emitProgress(ProcessingStatus.CARREGANDO, 95, 'Commit das operações de partidos no Firestore');
        const batchResult = await batchManager.commit();
        firestoreDocumentosSalvos = batchResult.sucessos;
        firestoreFalhas = batchResult.falhas;

        this.updateLoadStats(batchResult.total, firestoreDocumentosSalvos, firestoreFalhas);
        this.context.logger.info(`✅ Carregamento de partidos no Firestore concluído: ${firestoreDocumentosSalvos} documentos salvos.`);
        totalSucessos += firestoreDocumentosSalvos;
        totalFalhas += firestoreFalhas;

      } catch (error: any) {
        this.context.logger.error(`❌ Erro no carregamento de partidos para Firestore: ${error.message}`);
        if (error && typeof error === 'object' && 'sucessos' in error && 'falhas' in error) {
          const failedBatchResult = error as BatchResult;
          firestoreFalhas += failedBatchResult.falhas;
          firestoreDocumentosSalvos += failedBatchResult.sucessos;
        } else {
          firestoreFalhas += data.partidos.length + 2; // Estimativa
        }
        totalSucessos += firestoreDocumentosSalvos;
        totalFalhas += firestoreFalhas;
        this.updateLoadStats(data.partidos.length + 2, firestoreDocumentosSalvos, firestoreFalhas);
      }
    }
    
    const duration = Date.now() - startTime;
    this.emitProgress(ProcessingStatus.CARREGANDO, 100, 'Carregamento de partidos finalizado');

    return {
      sucessos: totalSucessos,
      falhas: totalFalhas,
      avisos: this.context.stats.avisos,
      tempoProcessamento: duration / 1000,
      destino: destinos.join(', '),
      legislatura: legislaturaAtual,
      detalhes: {
        partidosProcessados: data.partidos.length,
        lideresEncontrados: data.estatisticas.totalLideresConsultados,
        membrosEncontrados: data.partidos.reduce((acc, p) => acc + p.membros.length, 0),
        metadadosSalvos: totalSucessos > 0,
      },
    };
  }
}
