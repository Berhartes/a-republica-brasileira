/**
 * Processador especializado para discursos de senadores
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de discursos.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult } from '../types/etl.types';
import { discursosExtractor } from '../extracao/discursos';
import { discursoTransformer } from '../transformacao/discursos';
import { discursosLoader } from '../carregamento/discursos';
import { obterNumeroLegislaturaAtual } from '../utils/date';
import { exportToJson } from '../utils/common';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  discursos: any[];
  senador?: any;
  legislatura: number;
  periodo: {
    dataInicio: string;
    dataFim: string;
  };
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  discursosTransformados: any[];
  estatisticas: {
    total: number;
    porTipo: Record<string, number>;
    porMes: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de discursos
 */
export class DiscursosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Discursos de Senadores';
  }

  async validate(): Promise<ValidationResult> {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Validar datas se fornecidas
    if (this.context.options.dataInicio && this.context.options.dataFim) {
      const inicio = new Date(this.context.options.dataInicio);
      const fim = new Date(this.context.options.dataFim);
      
      if (inicio > fim) {
        erros.push('Data de início não pode ser posterior à data de fim');
      }
      
      // Avisar se período muito longo
      const dias = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      if (dias > 365) {
        avisos.push(`Período de ${dias} dias pode resultar em muitos dados`);
      }
    }

    // Validar senador se especificado
    if (this.context.options.senador && !/^\d+$/.test(this.context.options.senador)) {
      erros.push('Código do senador deve conter apenas números');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    const periodo = this.determinarPeriodo();
    
    this.context.logger.info(`📅 Extraindo discursos da legislatura ${legislatura}`);
    this.context.logger.info(`📆 Período: ${periodo.dataInicio} a ${periodo.dataFim}`);

    let discursos: any[] = [];

    if (this.context.options.senador) {
      // Extrair discursos de um senador específico
      const codigo = this.context.options.senador;
      this.context.logger.info(`👤 Extraindo discursos do senador ${codigo}`);
      
      // Usar método com mandatos para melhor extração
      const resultado = await discursosExtractor.extractDiscursosComMandatos(codigo, legislatura);
      
      if (resultado.discursos && resultado.discursos.dados) {
        discursos = this.extrairDiscursosDoResultado(resultado.discursos.dados);
      }
      
      this.context.logger.info(`🔍 ${discursos.length} discursos encontrados para o senador`);
    } else {
      // Extrair discursos de todos os senadores da legislatura
      this.context.logger.info('👥 Extraindo discursos de todos os senadores');
      
      discursos = await this.extrairDiscursosLegislatura(legislatura, periodo);
      
      this.context.logger.info(`🔍 ${discursos.length} discursos encontrados na legislatura`);
    }

    // Aplicar limite se especificado
    if (this.context.options.limite && this.context.options.limite > 0) {
      discursos = discursos.slice(0, this.context.options.limite);
      this.context.logger.info(`🔍 Limitado a ${discursos.length} discursos`);
    }

    this.updateExtractionStats(discursos.length, discursos.length, 0);

    return {
      discursos,
      legislatura,
      periodo
    };
  }

  /**
   * Extrai discursos de todos os senadores de uma legislatura
   */
  private async extrairDiscursosLegislatura(
    legislatura: number, 
    periodo: { dataInicio: string; dataFim: string }
  ): Promise<any[]> {
    try {
      // Importar o extrator de perfis
      const { perfilSenadoresExtractor } = await import('../extracao/perfilsenadores');
      
      // 1. Extrair lista de senadores da legislatura
      const senadoresExtraidos = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura);
      
      if (!senadoresExtraidos.senadores || senadoresExtraidos.senadores.length === 0) {
        this.context.logger.warn(`Nenhum senador encontrado para a legislatura ${legislatura}`);
        return [];
      }

      // 2. Filtrar senadores de acordo com os parâmetros
      let codigosSenadores = senadoresExtraidos.senadores
        .map(s => s.IdentificacaoParlamentar?.CodigoParlamentar)
        .filter(Boolean) as string[];

      this.context.logger.info(`🔍 ${codigosSenadores.length} códigos de senadores válidos encontrados`);

      // Aplicar limite se fornecido
      if (this.context.options.limite && this.context.options.limite > 0) {
        const limiteSenadores = Math.min(this.context.options.limite, codigosSenadores.length);
        this.context.logger.info(`📊 Limitando processamento aos primeiros ${limiteSenadores} senadores`);
        codigosSenadores = codigosSenadores.slice(0, limiteSenadores);
      }

      this.context.logger.info(`🚀 Processando discursos de ${codigosSenadores.length} senadores`);

      // 3. Extrair discursos para cada senador
      const todosDiscursos: any[] = [];
      let sucessos = 0;
      let falhas = 0;

      for (const [index, codigoSenador] of codigosSenadores.entries()) {
        this.context.logger.info(`👤 Processando senador ${index + 1}/${codigosSenadores.length}: código ${codigoSenador}`);

        try {
          // Usar método com mandatos para melhor extração
          const resultadoSenador = await discursosExtractor.extractDiscursosComMandatos(codigoSenador, legislatura);
          
          if (resultadoSenador.discursos && resultadoSenador.discursos.dados) {
            const discursosSenador = this.extrairDiscursosDoResultado(resultadoSenador.discursos.dados);
            todosDiscursos.push(...discursosSenador);
            sucessos++;
            
            this.context.logger.debug(`📝 Senador ${codigoSenador}: ${discursosSenador.length} discursos encontrados`);
          } else {
            this.context.logger.debug(`🔄 Senador ${codigoSenador}: nenhum discurso encontrado`);
          }

        } catch (error: any) {
          this.context.logger.error(`❌ Erro ao processar discursos do senador ${codigoSenador}: ${error.message}`);
          falhas++;
          this.incrementErrors();
        }

        // Emitir progresso
        const progresso = Math.round((index + 1) / codigosSenadores.length * 50); // 50% da barra para extração
        this.emitProgress(
          this.context.status,
          25 + progresso,
          `Processados ${index + 1}/${codigosSenadores.length} senadores`
        );

        // Pausa entre senadores para não sobrecarregar a API
        if (index < codigosSenadores.length - 1) {
          this.context.logger.debug(`⏱️ Aguardando 2 segundos antes de processar o próximo senador...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.context.logger.info(`✅ Extração concluída: ${sucessos} sucessos, ${falhas} falhas`);
      return todosDiscursos;
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao extrair discursos da legislatura: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai discursos de um resultado de dados
   */
  private extrairDiscursosDoResultado(dados: any): any[] {
    let discursos: any[] = [];
    
    try {
      // Verificar diferentes caminhos possíveis para os discursos
      if (dados.ListaTextos?.Textos?.Texto) {
        discursos = Array.isArray(dados.ListaTextos.Textos.Texto) 
          ? dados.ListaTextos.Textos.Texto 
          : [dados.ListaTextos.Textos.Texto];
      }
      else if (dados.discursos) {
        discursos = Array.isArray(dados.discursos) ? dados.discursos : [dados.discursos];
      }
      else if (Array.isArray(dados)) {
        discursos = dados;
      }
      else if (typeof dados === 'object' && dados !== null) {
        // Verificar se o objeto tem alguma propriedade que é um array
        for (const key in dados) {
          if (Array.isArray(dados[key])) {
            discursos = dados[key];
            break;
          }
        }
      }
      
      return discursos;
    } catch (error: any) {
      this.context.logger.warn(`Erro ao extrair discursos do resultado: ${error.message}`);
      return [];
    }
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando discursos...');

    const discursosTransformados: any[] = [];
    const estatisticas = {
      total: 0,
      porTipo: {} as Record<string, number>,
      porMes: {} as Record<string, number>
    };

    for (const discurso of data.discursos) {
      try {
        const transformado = discursoTransformer.transformDiscurso(discurso);
        if (transformado) {
          discursosTransformados.push(transformado);
          
          // Atualizar estatísticas
          estatisticas.total++;
          
          // Por tipo
          const tipo = transformado.tipo || 'Outros';
          estatisticas.porTipo[tipo] = (estatisticas.porTipo[tipo] || 0) + 1;
          
          // Por mês
          const mes = transformado.data?.substring(0, 7) || 'Sem data';
          estatisticas.porMes[mes] = (estatisticas.porMes[mes] || 0) + 1;
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao transformar discurso: ${error.message}`);
        this.incrementErrors();
      }
    }

    this.updateTransformationStats(data.discursos.length, discursosTransformados.length, data.discursos.length - discursosTransformados.length);

    this.context.logger.info(`✓ ${discursosTransformados.length} discursos transformados`);
    this.context.logger.info(`📊 Estatísticas:`, estatisticas);

    return {
      discursosTransformados,
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

  private determinarPeriodo(): { dataInicio: string; dataFim: string } {
    const hoje = new Date();
    const umAnoAtras = new Date(hoje);
    umAnoAtras.setFullYear(hoje.getFullYear() - 1);

    return {
      dataInicio: this.context.options.dataInicio || umAnoAtras.toISOString().split('T')[0],
      dataFim: this.context.options.dataFim || hoje.toISOString().split('T')[0]
    };
  }

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando discursos no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `discursos/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar todos os discursos
      const discursosPath = `${baseDir}/discursos_${timestamp}.json`;
      exportToJson(data.discursosTransformados, discursosPath);
      detalhes.push({ id: 'discursos_completos', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar por senador se aplicável
      if (this.context.options.senador) {
        const senadorDir = `${baseDir}/senador_${this.context.options.senador}`;
        const senadorPath = `${senadorDir}/discursos_${timestamp}.json`;
        exportToJson(data.discursosTransformados, senadorPath);
        detalhes.push({ id: `senador_${this.context.options.senador}`, status: 'sucesso' });
      }
      
      const sucessos = detalhes.filter(d => d.status === 'sucesso').length;
      this.updateLoadStats(detalhes.length, sucessos, 0);
      
      return {
        total: data.discursosTransformados.length,
        processados: data.discursosTransformados.length,
        sucessos,
        falhas: 0,
        detalhes
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no PC: ${error.message}`);
      throw error;
    }
  }

  private async salvarNoFirestore(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('☁️ Salvando discursos no Firestore...');
    
    try {
      const resultado = await discursosLoader.saveMultiplosDiscursos(
        data.discursosTransformados,
        {
          legislatura: data.legislatura,
          senadorCodigo: this.context.options.senador
        }
      );
      
      this.updateLoadStats(
        resultado.total,
        resultado.sucessos,
        resultado.falhas
      );
      
      return resultado;
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
