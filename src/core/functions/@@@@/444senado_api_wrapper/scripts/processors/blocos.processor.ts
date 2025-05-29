/**
 * Processador especializado para blocos parlamentares
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de blocos parlamentares.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, ProcessingStatus } from '../types/etl.types';
import { blocoExtractor } from '../extracao/blocos';
import { blocoTransformer } from '../transformacao/blocos';
import { blocoLoader } from '../carregamento/blocos';
import { obterNumeroLegislaturaAtual } from '../utils/date';
import { exportToJson } from '../utils/common';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  blocos: any[];
  membros: Map<string, any[]>; // blocoId -> membros[]
  legislatura: number;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  blocosTransformados: any[];
  membrosTransformados: Map<string, any[]>;
  estatisticas: {
    totalBlocos: number;
    totalMembros: number;
    blocosPorTipo: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de blocos parlamentares
 */
export class BlocosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Blocos Parlamentares';
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
      avisos.push('Processando todos os blocos pode demorar. Considere usar --limite para testes');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Extraindo blocos da legislatura ${legislatura}`);

    // Extrair lista de blocos
    this.context.logger.info('📋 Extraindo lista de blocos parlamentares...');
    const resultadoBlocos = await blocoExtractor.extractBlocosLegislatura(legislatura);
    
    let blocos = resultadoBlocos.blocos || [];
    
    if (blocos.length === 0) {
      throw new Error(`Nenhum bloco encontrado para a legislatura ${legislatura}`);
    }

    this.context.logger.info(`✓ ${blocos.length} blocos encontrados`);

    // Aplicar limite se especificado
    if (this.context.options.limite && this.context.options.limite > 0) {
      blocos = blocos.slice(0, this.context.options.limite);
      this.context.logger.info(`🔍 Limitado a ${blocos.length} blocos`);
    }

    // Extrair membros de cada bloco
    this.context.logger.info('👥 Extraindo membros dos blocos...');
    const membros = await this.extrairMembros(blocos);

    this.updateExtractionStats(blocos.length, blocos.length, 0);

    return {
      blocos,
      membros,
      legislatura
    };
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando blocos e membros...');

    const blocosTransformados: any[] = [];
    const membrosTransformados = new Map<string, any[]>();
    const estatisticas = {
      totalBlocos: 0,
      totalMembros: 0,
      blocosPorTipo: {} as Record<string, number>
    };

    // Transformar blocos
    for (const bloco of data.blocos) {
      try {
        const transformado = blocoTransformer.transformBloco(bloco);
        if (transformado) {
          blocosTransformados.push(transformado);
          
          // Atualizar estatísticas
          estatisticas.totalBlocos++;
          const tipo = transformado.tipo || 'Outros';
          estatisticas.blocosPorTipo[tipo] = (estatisticas.blocosPorTipo[tipo] || 0) + 1;
          
          // Transformar membros do bloco
          const membrosBloco = data.membros.get(bloco.CodigoBloco);
          if (membrosBloco) {
            const membrosTransf = membrosBloco.map(m => 
              blocoTransformer.transformMembroBloco(m, bloco.CodigoBloco)
            ).filter(Boolean);
            
            membrosTransformados.set(bloco.CodigoBloco, membrosTransf);
            estatisticas.totalMembros += membrosTransf.length;
          }
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao transformar bloco ${bloco.CodigoBloco}: ${error.message}`);
        this.incrementErrors();
      }
    }

    this.updateTransformationStats(
      data.blocos.length, 
      blocosTransformados.length, 
      data.blocos.length - blocosTransformados.length
    );

    this.context.logger.info(`✓ ${blocosTransformados.length} blocos transformados`);
    this.context.logger.info(`✓ ${estatisticas.totalMembros} membros transformados`);
    this.context.logger.info(`📊 Estatísticas:`, estatisticas);

    return {
      blocosTransformados,
      membrosTransformados,
      estatisticas,
      legislatura: data.legislatura
    };
  }

  async load(data: TransformedData): Promise<BatchResult> {
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

  private async extrairMembros(blocos: any[]): Promise<Map<string, any[]>> {
    const membros = new Map<string, any[]>();
    let processados = 0;

    for (const bloco of blocos) {
      try {
        this.context.logger.debug(`Extraindo membros do bloco ${bloco.NomeBloco}`);
        
        const resultadoMembros = await blocoExtractor.extractMembrosBloco(
          bloco.CodigoBloco,
          this.context.options.legislatura || 57
        );
        
        if (resultadoMembros.membros && resultadoMembros.membros.length > 0) {
          membros.set(bloco.CodigoBloco, resultadoMembros.membros);
        }
        
        processados++;
        
        // Emitir progresso
        const progresso = Math.round((processados / blocos.length) * 100);
        this.emitProgress(
          ProcessingStatus.EXTRAINDO,
          25 + Math.round(progresso * 0.25),
          `Extraídos membros de ${processados}/${blocos.length} blocos`
        );

        // Pausa entre requisições
        if (processados < blocos.length) {
          await new Promise(resolve => 
            setTimeout(resolve, this.context.config.senado.pauseBetweenRequests)
          );
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao extrair membros do bloco ${bloco.CodigoBloco}: ${error.message}`);
        this.incrementWarnings();
      }
    }

    return membros;
  }

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando blocos no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `blocos/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar lista de blocos
      const blocosPath = `${baseDir}/blocos_${timestamp}.json`;
      exportToJson(data.blocosTransformados, blocosPath);
      detalhes.push({ id: 'blocos', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar membros por bloco
      const membrosDir = `${baseDir}/membros`;
      data.membrosTransformados.forEach((membros, blocoId) => {
        try {
          const membrosPath = `${membrosDir}/bloco_${blocoId}_${timestamp}.json`;
          exportToJson(membros, membrosPath);
          detalhes.push({ id: `membros_${blocoId}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `membros_${blocoId}`, 
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
    this.context.logger.info('☁️ Salvando blocos no Firestore...');
    
    try {
      // Salvar blocos
      const resultadoBlocos = await blocoLoader.saveMultiplosBlocos(
        data.blocosTransformados,
        data.legislatura
      );
      
      // Salvar membros
      let totalMembros = 0;
      let sucessosMembros = 0;
      let falhasMembros = 0;
      
      for (const [blocoId, membros] of data.membrosTransformados) {
        try {
          const resultado = await blocoLoader.saveMembrosBloco(
            membros,
            blocoId,
            data.legislatura
          );
          
          totalMembros += resultado.total;
          sucessosMembros += resultado.sucessos;
          falhasMembros += resultado.falhas;
        } catch (error: any) {
          this.context.logger.warn(`Erro ao salvar membros do bloco ${blocoId}: ${error.message}`);
          falhasMembros += membros.length;
        }
      }
      
      const totalSucessos = resultadoBlocos.sucessos + sucessosMembros;
      const totalFalhas = resultadoBlocos.falhas + falhasMembros;
      
      this.updateLoadStats(
        resultadoBlocos.total + totalMembros,
        totalSucessos,
        totalFalhas
      );
      
      return {
        total: resultadoBlocos.total + totalMembros,
        processados: resultadoBlocos.processados + totalMembros,
        sucessos: totalSucessos,
        falhas: totalFalhas,
        detalhes: [
          { id: 'blocos', status: 'sucesso', quantidade: resultadoBlocos.sucessos },
          { id: 'membros', status: 'sucesso', quantidade: sucessosMembros }
        ]
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
