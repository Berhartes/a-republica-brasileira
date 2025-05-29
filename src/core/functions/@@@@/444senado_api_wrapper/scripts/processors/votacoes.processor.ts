/**
 * Processador especializado para votações de senadores
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de votações de senadores.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, ProcessingStatus } from '../types/etl.types';
import { perfilSenadoresExtractor } from '../extracao/perfilsenadores';
import { votacoesTransformer } from '../transformacao/votacoes';
import { exportToJson } from '../utils/common';
import * as api from '../utils/api';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  senadores: any[];
  votacoes: VotacaoExtraida[];
  legislatura: number;
}

/**
 * Estrutura de uma votação extraída
 */
interface VotacaoExtraida {
  codigo: string;
  dadosBasicos?: any;
  votacoes?: any;
  erro?: string;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  votacoesTransformadas: any[];
  estatisticas: {
    totalSenadores: number;
    totalVotacoes: number;
    votacoesPorResultado: Record<string, number>;
    votacoesPorTipoMateria: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de votações de senadores
 */
export class VotacoesProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Votações de Senadores';
  }

  async validate(): Promise<ValidationResult> {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Validar legislatura se especificada
    if (this.context.options.legislatura) {
      const leg = this.context.options.legislatura;
      
      if (leg < this.context.config.senado.legislatura.min || 
          leg > this.context.config.senado.legislatura.max) {
        erros.push(`Legislatura ${leg} fora do intervalo válido`);
      }

      // Avisar sobre legislaturas antigas
      if (leg < 53) {
        avisos.push(`Legislatura ${leg} é muito antiga e pode ter dados incompletos`);
      }
    }

    // Validar senador específico se fornecido
    if (this.context.options.senador && !/^\d+$/.test(this.context.options.senador)) {
      erros.push('Código do senador deve conter apenas números');
    }

    // Avisar sobre possíveis limitações
    if (!this.context.options.limite && !this.context.options.senador) {
      avisos.push('Processando votações de todos os senadores pode demorar muito. Considere usar --limite ou --senador');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Extraindo votações da legislatura ${legislatura}`);

    // Avisar sobre legislaturas antigas
    if (legislatura <= 52) {
      this.context.logger.warn(`⚠️ Legislatura ${legislatura} é antiga e pode ter dados incompletos`);
    }

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Extraindo lista de senadores...');

    // 1. Extrair lista de senadores da legislatura
    const senadoresExtraidos = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura);
    
    if (!senadoresExtraidos.senadores || senadoresExtraidos.senadores.length === 0) {
      throw new Error(`Nenhum senador encontrado para a legislatura ${legislatura}`);
    }

    // 2. Filtrar senadores de acordo com os parâmetros
    let codigosSenadores = senadoresExtraidos.senadores
      .filter(s => s && s.IdentificacaoParlamentar?.CodigoParlamentar)
      .map(s => s.IdentificacaoParlamentar.CodigoParlamentar);

    this.context.logger.info(`🔍 ${codigosSenadores.length} códigos de senadores válidos encontrados`);

    // Filtrar por senador específico se fornecido
    if (this.context.options.senador) {
      this.context.logger.info(`🎯 Filtrando apenas o senador com código ${this.context.options.senador}`);
      codigosSenadores = codigosSenadores.filter(codigo => codigo === this.context.options.senador);
    }

    // Aplicar limite se fornecido
    if (this.context.options.limite && this.context.options.limite > 0 && this.context.options.limite < codigosSenadores.length) {
      this.context.logger.info(`📊 Limitando processamento aos primeiros ${this.context.options.limite} senadores`);
      codigosSenadores = codigosSenadores.slice(0, this.context.options.limite);
    }

    this.context.logger.info(`🚀 Processando votações de ${codigosSenadores.length} senadores`);

    this.emitProgress(ProcessingStatus.EXTRAINDO, 30, 'Extraindo votações dos senadores...');

    // 3. Extrair votações dos senadores
    const votacoesExtraidas = await this.extrairVotacoesSenadores(codigosSenadores);

    this.updateExtractionStats(senadoresExtraidos.senadores.length, votacoesExtraidas.length, 0);

    return {
      senadores: senadoresExtraidos.senadores,
      votacoes: votacoesExtraidas,
      legislatura
    };
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando votações...');

    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados das votações...');

    const votacoesTransformadas: any[] = [];
    const estatisticas = {
      totalSenadores: data.senadores.length,
      totalVotacoes: 0,
      votacoesPorResultado: {} as Record<string, number>,
      votacoesPorTipoMateria: {} as Record<string, number>
    };

    // Transformar votações de cada senador
    for (const resultado of data.votacoes) {
      try {
        // Verificar se temos dados válidos
        if (!resultado || resultado.erro || !resultado.dadosBasicos || !resultado.votacoes) {
          this.context.logger.warn(`Dados inválidos para o senador ${resultado?.codigo || 'desconhecido'}, pulando...`);
          continue;
        }

        // Extrair informações básicas do senador
        const dadosBasicos = resultado.dadosBasicos;
        const parlamentar = dadosBasicos.DetalheParlamentar?.Parlamentar || {};
        const identificacao = parlamentar.IdentificacaoParlamentar || {};

        // Extrair votações
        const votacoesData = resultado.votacoes;
        const votacoesParlamentar = votacoesData.VotacaoParlamentar?.Parlamentar || {};
        const votacoesArray = votacoesParlamentar.Votacoes?.Votacao || [];

        // Garantir que votacoesArray seja sempre um array
        const votacoesNormalizadas = Array.isArray(votacoesArray) ? votacoesArray : [votacoesArray];

        // Transformar cada votação
        const votacoesTransformadasSenador = votacoesNormalizadas.map(votacao => {
          const materia = votacao.Materia || {};
          const sessao = votacao.Sessao || {};

          const votacaoTransformada = {
            id: votacao.SequencialVotacao || '',
            materia: {
              tipo: materia.SiglaMateria || '',
              numero: materia.NumeroMateria || '',
              ano: materia.AnoMateria || '',
              ementa: materia.DescricaoMateria || undefined
            },
            sessao: {
              codigo: sessao.CodigoSessao || '',
              data: sessao.DataSessao || '',
              legislatura: parseInt(sessao.NumeroLegislatura || '0', 10),
              sessaoLegislativa: parseInt(sessao.NumeroSessaoLegislativa || '0', 10)
            },
            voto: votacao.DescricaoVoto || '',
            orientacaoBancada: votacao.DescricaoOrientacaoBancada || undefined,
            resultado: votacao.DescricaoResultado || undefined
          };

          // Atualizar estatísticas
          estatisticas.totalVotacoes++;
          
          // Por resultado
          const resultado = votacaoTransformada.resultado || 'Sem resultado';
          estatisticas.votacoesPorResultado[resultado] = (estatisticas.votacoesPorResultado[resultado] || 0) + 1;
          
          // Por tipo de matéria
          const tipoMateria = votacaoTransformada.materia.tipo || 'Outros';
          estatisticas.votacoesPorTipoMateria[tipoMateria] = (estatisticas.votacoesPorTipoMateria[tipoMateria] || 0) + 1;

          return votacaoTransformada;
        });

        // Criar objeto consolidado do senador com suas votações
        const senadorVotacoes = {
          codigo: resultado.codigo,
          senador: {
            codigo: resultado.codigo,
            nome: identificacao.NomeParlamentar || 'Nome não disponível',
            partido: {
              sigla: identificacao.SiglaPartidoParlamentar || '',
              nome: identificacao.NomePartidoParlamentar || undefined
            },
            uf: identificacao.UfParlamentar || ''
          },
          votacoes: votacoesTransformadasSenador,
          timestamp: new Date().toISOString()
        };

        votacoesTransformadas.push(senadorVotacoes);

      } catch (error: any) {
        this.context.logger.warn(`Erro ao transformar votações do senador ${resultado?.codigo || 'desconhecido'}: ${error.message}`);
        this.incrementErrors();
      }
    }

    this.updateTransformationStats(data.votacoes.length, votacoesTransformadas.length, 0);

    this.context.logger.info(`✓ ${votacoesTransformadas.length} senadores com votações transformados`);
    this.context.logger.info(`📊 Estatísticas:`, estatisticas);

    return {
      votacoesTransformadas,
      estatisticas,
      legislatura: data.legislatura
    };
  }

  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 80, 'Salvando votações...');

    switch (this.context.options.destino) {
      case 'pc':
        return this.salvarNoPC(data);
      
      case 'emulator':
        process.env.FIRESTORE_EMULATOR_HOST = this.context.config.firestore.emulatorHost;
        return this.salvarNoFirestore(data);
        
      case 'firestore':
        return this.salvarNoFirestore(data);
        
      default:
        throw new Error(`Destino inválido: ${this.context.options.destino}`);
    }
  }

  /**
   * Métodos auxiliares privados
   */

  private async determinarLegislatura(): Promise<number> {
    if (this.context.options.legislatura) {
      return this.context.options.legislatura;
    }

    // Para votações, é melhor especificar uma legislatura
    throw new Error('Para votações, é necessário especificar uma legislatura com --legislatura ou --NN');
  }

  private async extrairVotacoesSenadores(codigosSenadores: string[]): Promise<VotacaoExtraida[]> {
    const votacoesExtraidas: VotacaoExtraida[] = [];
    const concurrency = 1; // Reduzir para não sobrecarregar a API
    const maxRetries = 5;

    // Processar em lotes para não sobrecarregar a API
    const chunks = [];
    for (let i = 0; i < codigosSenadores.length; i += concurrency) {
      chunks.push(codigosSenadores.slice(i, i + concurrency));
    }

    // Processar cada chunk
    for (const [index, chunk] of chunks.entries()) {
      this.context.logger.info(`Processando lote ${index + 1}/${chunks.length} (${chunk.length} senadores)`);

      // Extrair votações do chunk atual em paralelo
      const chunkVotacoes = await Promise.all(
        chunk.map(async (codigo) => {
          try {
            // Extrair votações do senador
            this.context.logger.debug(`Extraindo votações do senador ${codigo}`);

            // Extrair dados básicos do senador
            const dadosBasicosEndpoint = api.replacePath('/senador/{codigo}', { codigo: codigo.toString() });
            const dadosBasicos = await api.get(dadosBasicosEndpoint, { v: 6, format: 'json' });

            // Extrair votações do senador
            const votacoesEndpoint = api.replacePath('/senador/{codigo}/votacoes', { codigo: codigo.toString() });
            const votacoes = await api.get(votacoesEndpoint, { v: 7, format: 'json' });

            return {
              codigo,
              dadosBasicos,
              votacoes
            };
          } catch (error: any) {
            this.context.logger.error(`Erro ao extrair votações do senador ${codigo}: ${error.message}`);
            return {
              codigo,
              erro: error.message
            };
          }
        })
      );

      // Adicionar resultados do chunk à lista completa
      votacoesExtraidas.push(...chunkVotacoes);

      // Emitir progresso
      const progresso = Math.round((index + 1) / chunks.length * 50); // 50% da barra para extração
      this.emitProgress(
        ProcessingStatus.EXTRAINDO,
        30 + progresso,
        `Processados ${Math.min(votacoesExtraidas.length, codigosSenadores.length)}/${codigosSenadores.length} senadores`
      );

      // Pausa entre chunks para não sobrecarregar a API
      if (index < chunks.length - 1) {
        this.context.logger.debug(`Aguardando 3 segundos antes de processar o próximo lote...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    this.context.logger.info(`✅ Extração de votações concluída: ${votacoesExtraidas.length} senadores processados`);
    return votacoesExtraidas;
  }

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando votações no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `votacoes/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar todas as votações
      const votacoesPath = `${baseDir}/votacoes_completas_${timestamp}.json`;
      exportToJson(data.votacoesTransformadas, votacoesPath);
      detalhes.push({ id: 'votacoes_completas', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar por tipo de matéria
      const materiasDir = `${baseDir}/materias`;
      Object.entries(data.estatisticas.votacoesPorTipoMateria).forEach(([tipo, quantidade]) => {
        try {
          const votacoesMateriasTipo = data.votacoesTransformadas.filter(v => 
            v.votacoes?.some((vot: any) => vot.materia.tipo === tipo)
          );
          const materiaPath = `${materiasDir}/${tipo}_${timestamp}.json`;
          exportToJson(votacoesMateriasTipo, materiaPath);
          detalhes.push({ id: `materia_${tipo}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `materia_${tipo}`, 
            status: 'falha', 
            erro: error.message 
          });
        }
      });

      // Salvar por senador específico se aplicável
      if (this.context.options.senador) {
        const senadorDir = `${baseDir}/senador_${this.context.options.senador}`;
        const senadorPath = `${senadorDir}/votacoes_${timestamp}.json`;
        exportToJson(data.votacoesTransformadas, senadorPath);
        detalhes.push({ id: `senador_${this.context.options.senador}`, status: 'sucesso' });
      }
      
      const sucessos = detalhes.filter(d => d.status === 'sucesso').length;
      const falhas = detalhes.filter(d => d.status === 'falha').length;
      
      this.updateLoadStats(detalhes.length, sucessos, falhas);
      
      return {
        total: detalhes.length,
        processados: detalhes.length,
        sucessos,
        falhas,
        detalhes
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no PC: ${error.message}`);
      throw error;
    }
  }

  private async salvarNoFirestore(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('☁️ Salvando votações no Firestore...');
    
    try {
      // Usar sistema de batch do Firestore
      const { firestoreBatch } = require('../utils/storage');
      const batchManager = firestoreBatch.createBatchManager();
      let sucessos = 0;
      let falhas = 0;

      for (const votacao of data.votacoesTransformadas) {
        try {
          // Verificar se a votação é válida
          if (!votacao || !votacao.codigo) {
            this.context.logger.warn('Votação sem dados básicos completos, pulando...');
            falhas++;
            continue;
          }

          // Salvar na coleção de votações
          const votacaoRef = `congressoNacional/senadoFederal/votacoes/${votacao.codigo}`;
          batchManager.set(votacaoRef, {
            ...votacao,
            atualizadoEm: new Date().toISOString()
          });
          sucessos++;
        } catch (error: any) {
          this.context.logger.error(`Erro ao salvar votações do senador ${votacao?.codigo || 'desconhecido'}: ${error.message}`);
          falhas++;
        }
      }

      // Commit das operações
      await batchManager.commit();

      this.updateLoadStats(sucessos + falhas, sucessos, falhas);

      return {
        total: sucessos + falhas,
        processados: sucessos + falhas,
        sucessos,
        falhas,
        detalhes: [
          { id: 'votacoes', status: 'sucesso', quantidade: sucessos },
          ...(falhas > 0 ? [{ id: 'falhas', status: 'falha', quantidade: falhas }] : [])
        ]
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
