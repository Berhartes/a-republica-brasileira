/**
 * Processador especializado para lideranças parlamentares
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de lideranças parlamentares.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, ProcessingStatus } from '../types/etl.types';
import { liderancaExtractor } from '../extracao/liderancas';
import { liderancaTransformer } from '../transformacao/liderancas';
import { liderancaLoader } from '../carregamento/liderancas';
import { obterNumeroLegislaturaAtual } from '../utils/date';
import { exportToJson } from '../utils/common';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  liderancas: any;
  referencias: {
    tiposLideranca: any[];
    tiposUnidade: any[];
    tiposCargo: any[];
  };
  legislatura: number;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  liderancasTransformadas: any;
  referenciasTransformadas: {
    tiposLideranca: any[];
    tiposUnidade: any[];
    tiposCargo: any[];
  };
  estatisticas: {
    totalLiderancas: number;
    totalMembros: number;
    liderancasPorTipo: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de lideranças parlamentares
 */
export class LiderancasProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Lideranças Parlamentares';
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
      avisos.push('Processando todas as lideranças pode demorar. Considere usar --limite para testes');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Extraindo lideranças da legislatura ${legislatura}`);

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Extraindo dados de lideranças...');

    // Extrair todos os dados de lideranças
    const dadosExtraidos = await liderancaExtractor.extractAll();
    
    if (!dadosExtraidos.liderancas) {
      throw new Error('Nenhuma liderança encontrada');
    }

    // Verificar dados extraídos
    this.context.logger.debug('Dados de lideranças extraídos:', JSON.stringify(dadosExtraidos.liderancas).substring(0, 200) + '...');
    this.context.logger.debug('Tipos de liderança:', JSON.stringify(dadosExtraidos.referencias.tiposLideranca).substring(0, 200) + '...');

    const totalLiderancas = Array.isArray(dadosExtraidos.liderancas) ? 
      dadosExtraidos.liderancas.length : 
      (dadosExtraidos.liderancas.itens?.length || 0);

    this.context.logger.info(`✓ ${totalLiderancas} lideranças encontradas`);

    this.updateExtractionStats(totalLiderancas, totalLiderancas, 0);

    return {
      liderancas: dadosExtraidos.liderancas,
      referencias: dadosExtraidos.referencias,
      legislatura
    };
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando lideranças...');

    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados de lideranças...');

    // Transformar lideranças
    const dadosTransformados = liderancaTransformer.transformLiderancas(data);

    // Calcular estatísticas
    const liderancas = dadosTransformados.liderancas.itens || [];
    const totalMembros = liderancas.reduce(
      (total: number, lideranca: any) => total + (lideranca.membros?.length || 0), 0
    );

    const estatisticas = {
      totalLiderancas: liderancas.length,
      totalMembros,
      liderancasPorTipo: {} as Record<string, number>
    };

    // Contar lideranças por tipo
    liderancas.forEach((lideranca: any) => {
      const tipo = lideranca.tipo || 'Outros';
      estatisticas.liderancasPorTipo[tipo] = (estatisticas.liderancasPorTipo[tipo] || 0) + 1;
    });

    this.updateTransformationStats(
      liderancas.length, 
      dadosTransformados.liderancas.itens.length, 
      0
    );

    this.context.logger.info(`✓ ${dadosTransformados.liderancas.itens.length} lideranças transformadas`);
    this.context.logger.info(`✓ ${totalMembros} membros transformados`);

    return {
      liderancasTransformadas: dadosTransformados.liderancas,
      referenciasTransformadas: dadosTransformados.referencias,
      estatisticas,
      legislatura: data.legislatura
    };
  }

  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 80, 'Salvando lideranças...');

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

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando lideranças no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `liderancas/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar lideranças
      const liderancasPath = `${baseDir}/liderancas_${timestamp}.json`;
      exportToJson(data.liderancasTransformadas, liderancasPath);
      detalhes.push({ id: 'liderancas', status: 'sucesso' });
      
      // Salvar referências
      const referenciasPath = `${baseDir}/referencias_${timestamp}.json`;
      exportToJson(data.referenciasTransformadas, referenciasPath);
      detalhes.push({ id: 'referencias', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar por tipo de liderança
      const tiposDir = `${baseDir}/tipos`;
      data.liderancasTransformadas.itens?.forEach((lideranca: any, index: number) => {
        try {
          const tipo = lideranca.tipo || 'outros';
          const tipoPath = `${tiposDir}/${tipo}_${index}_${timestamp}.json`;
          exportToJson(lideranca, tipoPath);
          detalhes.push({ id: `tipo_${tipo}_${index}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `tipo_${index}`, 
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
    this.context.logger.info('☁️ Salvando lideranças no Firestore...');
    
    try {
      // Reconstituir dados no formato esperado pelo loader
      const dadosParaCarregamento = {
        liderancas: data.liderancasTransformadas,
        referencias: data.referenciasTransformadas,
        timestamp: new Date().toISOString()
      };

      // Salvar lideranças
      const resultadoLiderancas = await liderancaLoader.saveLiderancas(
        dadosParaCarregamento,
        data.legislatura
      );
      
      // Salvar histórico
      await liderancaLoader.saveLiderancasHistorico(
        dadosParaCarregamento,
        data.legislatura
      );
      
      this.updateLoadStats(
        resultadoLiderancas.totalLiderancas,
        resultadoLiderancas.totalLiderancas,
        0
      );
      
      return {
        total: resultadoLiderancas.totalLiderancas,
        processados: resultadoLiderancas.totalLiderancas,
        sucessos: resultadoLiderancas.totalLiderancas,
        falhas: 0,
        detalhes: [
          { id: 'liderancas', status: 'sucesso', quantidade: resultadoLiderancas.totalLiderancas },
          { id: 'historico', status: 'sucesso' }
        ]
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
