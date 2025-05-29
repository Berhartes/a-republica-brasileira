/**
 * Template de processador ETL
 * 
 * Use este template como base para criar novos processadores.
 * Copie este arquivo e ajuste conforme necessário.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult } from '../types/etl.types';
import { logger } from '../utils/logging';

/**
 * Interface para os dados extraídos
 * Ajuste conforme a estrutura dos seus dados
 */
interface ExtractedData {
  items: any[];
  metadata: {
    total: number;
    source: string;
    timestamp: string;
  };
}

/**
 * Interface para os dados transformados
 * Ajuste conforme a estrutura desejada
 */
interface TransformedData {
  processedItems: any[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Template de processador ETL
 * 
 * Renomeie esta classe para refletir o que ela processa
 * Exemplo: VotacoesProcessor, DiscursosProcessor, etc.
 */
export class TemplateProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  /**
   * Nome do processo para logs e identificação
   */
  protected getProcessName(): string {
    return 'Template Processor';
  }

  /**
   * Valida as opções e configurações antes do processamento
   */
  async validate(): Promise<ValidationResult> {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Exemplo de validação de legislatura
    if (this.context.options.legislatura) {
      const leg = this.context.options.legislatura;
      if (leg < 1 || leg > 58) {
        erros.push(`Legislatura inválida: ${leg}`);
      }
    }

    // Exemplo de validação de limite
    if (this.context.options.limite !== undefined && this.context.options.limite <= 0) {
      erros.push('Limite deve ser maior que zero');
    }

    // Exemplo de aviso
    if (this.context.config.senado.concurrency > 5) {
      avisos.push('Concorrência alta pode causar throttling');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Extrai os dados da fonte
   */
  async extract(): Promise<ExtractedData> {
    this.context.logger.info('Iniciando extração de dados...');

    // Simular extração de dados
    // Na prática, aqui você faria chamadas à API, leitura de arquivos, etc.
    const items: any[] = [];
    
    // Exemplo: extrair com limite
    const limite = this.context.options.limite || 100;
    
    for (let i = 0; i < limite; i++) {
      // Simular item extraído
      items.push({
        id: i + 1,
        nome: `Item ${i + 1}`,
        dados: {
          campo1: `Valor ${i + 1}`,
          campo2: Math.random() * 100
        }
      });

      // Atualizar progresso
      if ((i + 1) % 10 === 0) {
        const progresso = Math.round(((i + 1) / limite) * 25); // 0-25% para extração
        this.emitProgress(
          ProcessingStatus.EXTRAINDO,
          progresso,
          `Extraídos ${i + 1}/${limite} itens`
        );
      }
    }

    // Atualizar estatísticas
    this.updateExtractionStats(items.length, items.length, 0);

    return {
      items,
      metadata: {
        total: items.length,
        source: 'template-source',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Transforma os dados extraídos
   */
  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('Transformando dados...');

    const processedItems: any[] = [];
    let successful = 0;
    let failed = 0;

    // Processar cada item
    for (const [index, item] of data.items.entries()) {
      try {
        // Simular transformação
        const transformed = {
          ...item,
          processado: true,
          timestamp: new Date().toISOString(),
          // Adicionar campos calculados
          campoCalculado: item.dados.campo2 * 2
        };

        processedItems.push(transformed);
        successful++;

        // Atualizar progresso
        if ((index + 1) % 10 === 0) {
          const progresso = 25 + Math.round(((index + 1) / data.items.length) * 25); // 25-50%
          this.emitProgress(
            ProcessingStatus.TRANSFORMANDO,
            progresso,
            `Transformados ${index + 1}/${data.items.length} itens`
          );
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao transformar item ${item.id}: ${error.message}`);
        failed++;
        this.incrementErrors();
      }
    }

    // Atualizar estatísticas
    this.updateTransformationStats(data.items.length, successful, failed);

    return {
      processedItems,
      summary: {
        total: data.items.length,
        successful,
        failed
      }
    };
  }

  /**
   * Carrega os dados no destino configurado
   */
  async load(data: TransformedData): Promise<BatchResult> {
    switch (this.context.options.destino) {
      case 'pc':
        return this.salvarNoPC(data);
      
      case 'emulator':
        this.configurarEmulator();
        return this.salvarNoFirestore(data);
        
      case 'firestore':
        return this.salvarNoFirestore(data);
        
      default:
        throw new Error(`Destino inválido: ${this.context.options.destino}`);
    }
  }

  /**
   * Configura o emulador do Firestore
   */
  private configurarEmulator(): void {
    process.env.FIRESTORE_EMULATOR_HOST = this.context.config.firestore.emulatorHost;
    this.context.logger.info(`Configurado Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  /**
   * Salva dados localmente no PC
   */
  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('Salvando dados no PC local...');
    
    // Importar função de exportação
    const { exportToJson } = await import('../utils/common');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = 'template_data';
    
    try {
      // Salvar arquivo principal
      const mainFile = `${baseDir}/processed_${timestamp}.json`;
      exportToJson(data.processedItems, mainFile);
      
      // Salvar resumo
      const summaryFile = `${baseDir}/summary_${timestamp}.json`;
      exportToJson(data.summary, summaryFile);
      
      // Atualizar estatísticas
      this.updateLoadStats(data.processedItems.length, data.summary.successful, data.summary.failed);
      
      return {
        total: data.processedItems.length,
        processados: data.processedItems.length,
        sucessos: data.summary.successful,
        falhas: data.summary.failed,
        detalhes: [
          { id: 'main', status: 'sucesso' },
          { id: 'summary', status: 'sucesso' }
        ]
      };
    } catch (error: any) {
      throw new Error(`Erro ao salvar no PC: ${error.message}`);
    }
  }

  /**
   * Salva dados no Firestore
   */
  private async salvarNoFirestore(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('Salvando dados no Firestore...');
    
    // Importar gerenciador de batch
    const { createBatchManager } = await import('../utils/storage');
    
    const batchManager = createBatchManager();
    const detalhes: any[] = [];
    
    try {
      // Salvar cada item
      for (const [index, item] of data.processedItems.entries()) {
        const docRef = `template_collection/${item.id}`;
        
        batchManager.set(docRef, item);
        
        detalhes.push({
          id: item.id,
          status: 'sucesso'
        });

        // Atualizar progresso
        if ((index + 1) % 10 === 0) {
          const progresso = 50 + Math.round(((index + 1) / data.processedItems.length) * 50); // 50-100%
          this.emitProgress(
            ProcessingStatus.CARREGANDO,
            progresso,
            `Salvos ${index + 1}/${data.processedItems.length} itens`
          );
        }
      }
      
      // Salvar resumo
      const summaryRef = 'template_collection/summary';
      batchManager.set(summaryRef, {
        ...data.summary,
        timestamp: new Date().toISOString()
      });
      
      // Executar batch
      await batchManager.commit();
      
      // Atualizar estatísticas
      this.updateLoadStats(data.processedItems.length, data.summary.successful, data.summary.failed);
      
      return {
        total: data.processedItems.length,
        processados: data.processedItems.length,
        sucessos: data.summary.successful,
        falhas: data.summary.failed,
        detalhes
      };
    } catch (error: any) {
      throw new Error(`Erro ao salvar no Firestore: ${error.message}`);
    }
  }
}

// Importar ProcessingStatus se necessário
import { ProcessingStatus } from '../types/etl.types';
