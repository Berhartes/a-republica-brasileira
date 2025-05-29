/**
 * Processador especializado para comissões do Senado
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de comissões parlamentares.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, ProcessingStatus } from '../types/etl.types';
import { comissaoExtractor } from '../extracao/comissoes';
import { comissoesTransformer } from '../transformacao/comissoes';
import { comissaoLoader } from '../carregamento/comissoes';
import { obterNumeroLegislaturaAtual } from '../utils/date';
import { exportToJson } from '../utils/common';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  lista: any;
  detalhes: any[];
  composicoes: Map<string, any[]>;
  tipos: any[];
  legislatura: number;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  comissoesTransformadas: any[];
  composicoesTransformadas: Map<string, any[]>;
  tiposTransformados: any[];
  estatisticas: {
    totalComissoes: number;
    totalMembros: number;
    comissoesPorTipo: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de comissões parlamentares
 */
export class ComissoesProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Comissões Parlamentares';
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
    }

    // Avisar sobre possíveis limitações
    if (!this.context.options.limite) {
      avisos.push('Processando todas as comissões pode demorar. Considere usar --limite para testes');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Extraindo comissões da legislatura ${legislatura}`);

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Extraindo lista de comissões...');

    // Extrair todos os dados
    const dadosExtraidos = await comissaoExtractor.extractAll();
    
    if (!dadosExtraidos.lista || !dadosExtraidos.lista.total) {
      throw new Error('Nenhuma comissão encontrada');
    }

    this.context.logger.info(`✓ ${dadosExtraidos.lista.total} comissões encontradas`);

    // Aplicar limite se especificado
    let comissoes = dadosExtraidos.detalhes || [];
    if (this.context.options.limite && this.context.options.limite > 0) {
      comissoes = comissoes.slice(0, this.context.options.limite);
      this.context.logger.info(`🔍 Limitado a ${comissoes.length} comissões`);
    }

    this.emitProgress(ProcessingStatus.EXTRAINDO, 50, 'Extraindo composições das comissões...');

    // Extrair composições
    const composicoes = await this.extrairComposicoes(comissoes);

    this.updateExtractionStats(dadosExtraidos.lista.total, comissoes.length, 0);

    return {
      lista: dadosExtraidos.lista,
      detalhes: comissoes,
      composicoes,
      tipos: dadosExtraidos.tipos || [],
      legislatura
    };
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando comissões...');

    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados das comissões...');

    // Adaptar os dados para o formato esperado pelo transformador
    const dadosParaTransformar = {
      timestamp: new Date().toISOString(),
      lista: data.lista,
      detalhes: data.detalhes,
      composicoes: Object.fromEntries(data.composicoes),
      tipos: data.tipos
    };

    const dadosTransformados = comissoesTransformer.transformComissoes(dadosParaTransformar);

    // Preparar composições transformadas
    const composicoesTransformadas = new Map<string, any[]>();
    for (const [comissaoId, membros] of data.composicoes) {
      const membrosTransformados = membros.map(membro => 
        comissoesTransformer.transformMembroComissao?.(membro, comissaoId) || membro
      ).filter(Boolean);
      composicoesTransformadas.set(comissaoId, membrosTransformados);
    }

    // Calcular estatísticas
    const estatisticas = {
      totalComissoes: dadosTransformados.total,
      totalMembros: Array.from(composicoesTransformadas.values()).reduce((total, membros) => total + membros.length, 0),
      comissoesPorTipo: {} as Record<string, number>
    };

    // Contar comissões por tipo
    dadosTransformados.comissoes.forEach(comissao => {
      const tipo = comissao.tipo || 'Outros';
      estatisticas.comissoesPorTipo[tipo] = (estatisticas.comissoesPorTipo[tipo] || 0) + 1;
    });

    this.updateTransformationStats(
      data.detalhes.length, 
      dadosTransformados.total, 
      data.detalhes.length - dadosTransformados.total
    );

    this.context.logger.info(`✓ ${dadosTransformados.total} comissões transformadas`);
    this.context.logger.info(`✓ ${estatisticas.totalMembros} membros transformados`);

    return {
      comissoesTransformadas: dadosTransformados.comissoes,
      composicoesTransformadas,
      tiposTransformados: data.tipos,
      estatisticas,
      legislatura: data.legislatura
    };
  }

  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 80, 'Salvando comissões...');

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

    const legislaturaAtual = await obterNumeroLegislaturaAtual();
    if (!legislaturaAtual) {
      throw new Error('Não foi possível obter a legislatura atual');
    }

    return legislaturaAtual;
  }

  private async extrairComposicoes(comissoes: any[]): Promise<Map<string, any[]>> {
    const composicoes = new Map<string, any[]>();
    let processados = 0;

    for (const comissao of comissoes) {
      try {
        const codigoComissao = comissao.Codigo || comissao.CodigoComissao;
        this.context.logger.debug(`Extraindo composição da comissão ${comissao.Nome || comissao.NomeComissao}`);
        
        const resultadoComposicao = await comissaoExtractor.extractComposicaoComissao?.(codigoComissao);
        
        if (resultadoComposicao && resultadoComposicao.membros) {
          composicoes.set(codigoComissao, resultadoComposicao.membros);
        }
        
        processados++;
        
        // Emitir progresso
        const progresso = Math.round((processados / comissoes.length) * 40); // 40% da barra para composições
        this.emitProgress(
          ProcessingStatus.EXTRAINDO,
          50 + progresso,
          `Extraídas composições de ${processados}/${comissoes.length} comissões`
        );

        // Pausa entre requisições
        if (processados < comissoes.length) {
          await new Promise(resolve => 
            setTimeout(resolve, this.context.config.senado.pauseBetweenRequests)
          );
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao extrair composição da comissão: ${error.message}`);
        this.incrementWarnings();
      }
    }

    return composicoes;
  }

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando comissões no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `comissoes/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar lista de comissões
      const comissoesPath = `${baseDir}/comissoes_${timestamp}.json`;
      exportToJson(data.comissoesTransformadas, comissoesPath);
      detalhes.push({ id: 'comissoes', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar composições por comissão
      const composicoesDir = `${baseDir}/composicoes`;
      data.composicoesTransformadas.forEach((membros, comissaoId) => {
        try {
          const membrosPath = `${composicoesDir}/comissao_${comissaoId}_${timestamp}.json`;
          exportToJson(membros, membrosPath);
          detalhes.push({ id: `composicao_${comissaoId}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `composicao_${comissaoId}`, 
            status: 'falha', 
            erro: error.message 
          });
        }
      });
      
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
    this.context.logger.info('☁️ Salvando comissões no Firestore...');
    
    try {
      // Transformar de volta para o formato esperado pelo loader
      const dadosParaCarregamento = {
        total: data.estatisticas.totalComissoes,
        comissoes: data.comissoesTransformadas,
        tipos: data.tiposTransformados,
        timestamp: new Date().toISOString()
      };

      // Salvar comissões
      const resultadoComissoes = await comissaoLoader.saveComissoes(
        dadosParaCarregamento,
        data.legislatura
      );
      
      // Salvar histórico
      await comissaoLoader.saveComissoesHistorico(
        dadosParaCarregamento,
        data.legislatura
      );
      
      this.updateLoadStats(
        resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados,
        resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados,
        0
      );
      
      return {
        total: resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados,
        processados: resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados,
        sucessos: resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados,
        falhas: 0,
        detalhes: [
          { id: 'comissoes', status: 'sucesso', quantidade: resultadoComissoes.totalSalvos },
          { id: 'atualizacoes', status: 'sucesso', quantidade: resultadoComissoes.totalAtualizados }
        ]
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
