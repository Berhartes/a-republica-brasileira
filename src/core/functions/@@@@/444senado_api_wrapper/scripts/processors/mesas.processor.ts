/**
 * Processador especializado para mesas diretoras
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de mesas diretoras.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, ProcessingStatus } from '../types/etl.types';
import { mesaExtractor } from '../extracao/mesas';
import { mesaTransformer } from '../transformacao/mesas';
import { mesaLoader } from '../carregamento/mesas';
import { obterNumeroLegislaturaAtual } from '../utils/date';
import { exportToJson } from '../utils/common';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  mesas: any[];
  composicoes: Map<string, any[]>;
  legislatura: number;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  mesasTransformadas: any[];
  composicoesTransformadas: Map<string, any[]>;
  estatisticas: {
    totalMesas: number;
    totalMembros: number;
    mesasPorPeriodo: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de mesas diretoras
 */
export class MesasProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Mesas Diretoras';
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
      avisos.push('Processando todas as mesas pode demorar. Considere usar --limite para testes');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Extraindo mesas diretoras da legislatura ${legislatura}`);

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Extraindo dados de mesas diretoras...');

    // Extrair dados das mesas
    const dadosExtraidos = await mesaExtractor.extractAll();
    
    if (!dadosExtraidos || !dadosExtraidos.mesas) {
      throw new Error('Nenhuma mesa diretora encontrada');
    }

    let mesas = Array.isArray(dadosExtraidos.mesas) ? dadosExtraidos.mesas : [dadosExtraidos.mesas];
    
    this.context.logger.info(`✓ ${mesas.length} mesas encontradas`);

    // Aplicar limite se especificado
    if (this.context.options.limite && this.context.options.limite > 0) {
      mesas = mesas.slice(0, this.context.options.limite);
      this.context.logger.info(`🔍 Limitado a ${mesas.length} mesas`);
    }

    this.emitProgress(ProcessingStatus.EXTRAINDO, 50, 'Extraindo composições das mesas...');

    // Extrair composições das mesas
    const composicoes = await this.extrairComposicoes(mesas);

    this.updateExtractionStats(mesas.length, mesas.length, 0);

    return {
      mesas,
      composicoes,
      legislatura
    };
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando mesas diretoras...');

    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados das mesas...');

    // Preparar dados para transformação
    const dadosParaTransformar = {
      timestamp: new Date().toISOString(),
      mesas: data.mesas,
      composicoes: Object.fromEntries(data.composicoes)
    };

    // Transformar mesas
    const dadosTransformados = mesaTransformer.transformMesas(dadosParaTransformar);

    // Preparar composições transformadas
    const composicoesTransformadas = new Map<string, any[]>();
    for (const [mesaId, membros] of data.composicoes) {
      const membrosTransformados = membros.map(membro => 
        mesaTransformer.transformMembroMesa?.(membro, mesaId) || membro
      ).filter(Boolean);
      composicoesTransformadas.set(mesaId, membrosTransformados);
    }

    // Calcular estatísticas
    const estatisticas = {
      totalMesas: dadosTransformados.total,
      totalMembros: Array.from(composicoesTransformadas.values()).reduce((total, membros) => total + membros.length, 0),
      mesasPorPeriodo: {} as Record<string, number>
    };

    // Contar mesas por período
    dadosTransformados.mesas?.forEach((mesa: any) => {
      const periodo = mesa.periodo || 'Sem período';
      estatisticas.mesasPorPeriodo[periodo] = (estatisticas.mesasPorPeriodo[periodo] || 0) + 1;
    });

    this.updateTransformationStats(
      data.mesas.length, 
      dadosTransformados.total, 
      data.mesas.length - dadosTransformados.total
    );

    this.context.logger.info(`✓ ${dadosTransformados.total} mesas transformadas`);
    this.context.logger.info(`✓ ${estatisticas.totalMembros} membros transformados`);

    return {
      mesasTransformadas: dadosTransformados.mesas || [],
      composicoesTransformadas,
      estatisticas,
      legislatura: data.legislatura
    };
  }

  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 80, 'Salvando mesas diretoras...');

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

  private async extrairComposicoes(mesas: any[]): Promise<Map<string, any[]>> {
    const composicoes = new Map<string, any[]>();
    let processados = 0;

    for (const mesa of mesas) {
      try {
        const codigoMesa = mesa.Codigo || mesa.CodigoMesa || mesa.id;
        this.context.logger.debug(`Extraindo composição da mesa ${mesa.Nome || mesa.NomeMesa || codigoMesa}`);
        
        // Verificar se a mesa já tem membros incluídos
        if (mesa.membros && Array.isArray(mesa.membros)) {
          composicoes.set(codigoMesa, mesa.membros);
        } else if (mesa.Membros && Array.isArray(mesa.Membros)) {
          composicoes.set(codigoMesa, mesa.Membros);
        } else {
          // Tentar extrair composição específica se houver método
          const resultadoComposicao = await mesaExtractor.extractComposicaoMesa?.(codigoMesa);
          
          if (resultadoComposicao && resultadoComposicao.membros) {
            composicoes.set(codigoMesa, resultadoComposicao.membros);
          }
        }
        
        processados++;
        
        // Emitir progresso
        const progresso = Math.round((processados / mesas.length) * 40); // 40% da barra para composições
        this.emitProgress(
          ProcessingStatus.EXTRAINDO,
          50 + progresso,
          `Extraídas composições de ${processados}/${mesas.length} mesas`
        );

        // Pausa entre requisições se necessário
        if (processados < mesas.length) {
          await new Promise(resolve => 
            setTimeout(resolve, this.context.config.senado.pauseBetweenRequests)
          );
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao extrair composição da mesa: ${error.message}`);
        this.incrementWarnings();
      }
    }

    return composicoes;
  }

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando mesas diretoras no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `mesas/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar lista de mesas
      const mesasPath = `${baseDir}/mesas_${timestamp}.json`;
      exportToJson(data.mesasTransformadas, mesasPath);
      detalhes.push({ id: 'mesas', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar composições por mesa
      const composicoesDir = `${baseDir}/composicoes`;
      data.composicoesTransformadas.forEach((membros, mesaId) => {
        try {
          const membrosPath = `${composicoesDir}/mesa_${mesaId}_${timestamp}.json`;
          exportToJson(membros, membrosPath);
          detalhes.push({ id: `composicao_${mesaId}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `composicao_${mesaId}`, 
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
    this.context.logger.info('☁️ Salvando mesas diretoras no Firestore...');
    
    try {
      // Reconstituir dados no formato esperado pelo loader
      const dadosParaCarregamento = {
        total: data.estatisticas.totalMesas,
        mesas: data.mesasTransformadas,
        timestamp: new Date().toISOString()
      };

      // Salvar mesas
      const resultadoMesas = await mesaLoader.saveMesas(
        dadosParaCarregamento,
        data.legislatura
      );
      
      // Salvar histórico
      await mesaLoader.saveMesasHistorico(
        dadosParaCarregamento,
        data.legislatura
      );
      
      this.updateLoadStats(
        resultadoMesas.totalSalvos,
        resultadoMesas.totalSalvos,
        0
      );
      
      return {
        total: resultadoMesas.totalSalvos,
        processados: resultadoMesas.totalSalvos,
        sucessos: resultadoMesas.totalSalvos,
        falhas: 0,
        detalhes: [
          { id: 'mesas', status: 'sucesso', quantidade: resultadoMesas.totalSalvos },
          { id: 'historico', status: 'sucesso' }
        ]
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
