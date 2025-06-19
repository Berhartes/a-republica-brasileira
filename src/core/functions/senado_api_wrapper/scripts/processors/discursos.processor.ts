/**
 * Processador especializado para discursos de senadores
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de discursos.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult } from '../types/etl.types';
import { perfilSenadoresExtractor } from '../extracao/perfilsenadores'; // Corrigido
import { discursosTransformer } from '../transformacao/perfilsenadores_discursos'; // Corrigido
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
      
      const resultadoSenador = await perfilSenadoresExtractor.extractDiscursosDetalhados(
        codigo,
        periodo.dataInicio,
        periodo.dataFim
      );
      
      // Extrai os discursos da estrutura de resultadoSenador.dados
      // A estrutura exata pode variar (ex: Pronunciamentos ou Discursos)
      if (resultadoSenador?.dados?.DiscursosParlamentar?.Parlamentar?.Pronunciamentos?.Pronunciamento) {
        const pronunciamentos = resultadoSenador.dados.DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento;
        discursos = Array.isArray(pronunciamentos) ? pronunciamentos : [pronunciamentos];
      } else if (resultadoSenador?.dados?.DiscursosParlamentar?.Parlamentar?.Discursos?.Discurso) {
        const discursosApi = resultadoSenador.dados.DiscursosParlamentar.Parlamentar.Discursos.Discurso;
        discursos = Array.isArray(discursosApi) ? discursosApi : [discursosApi];
      } else if (resultadoSenador?.dados?.Pronunciamentos?.Pronunciamento) { // Estrutura alternativa
        const pronunciamentos = resultadoSenador.dados.Pronunciamentos.Pronunciamento;
        discursos = Array.isArray(pronunciamentos) ? pronunciamentos : [pronunciamentos];
      } else if (resultadoSenador?.dados?.Discursos?.Discurso) { // Estrutura alternativa
        const discursosApi = resultadoSenador.dados.Discursos.Discurso;
        discursos = Array.isArray(discursosApi) ? discursosApi : [discursosApi];
      } else {
        discursos = [];
      }

    } else {
      // Extrair discursos de todos os senadores da legislatura
      this.context.logger.info('👥 Extraindo discursos de todos os senadores');
      // TODO: Implementar a lógica correta para extrair discursos de todos os senadores da legislatura.
      // Isso envolveria:
      // 1. Chamar perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura)
      // 2. Iterar sobre os senadores e chamar perfilSenadoresExtractor.extractDiscursosDetalhados para cada um.
      // 3. Agregar os resultados.
      this.context.logger.warn('A extração de discursos para toda a legislatura ainda precisa ser implementada.');
      discursos = []; // Placeholder
    }

    // Aplicar limite se especificado
    // Removido o '}' extra que estava aqui

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

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando discursos...');

    const discursosTransformados: any[] = [];
    const estatisticas = {
      total: 0,
      porTipo: {} as Record<string, number>,
      porMes: {} as Record<string, number>
    };

    // O método discursosTransformer.transformDiscursos espera um DiscursoResult.
    // data.discursos é uma lista de discursos individuais (pronunciamentos/discursos da API).
    // Precisamos agrupar os discursos por senador antes de transformar,
    // ou ajustar a interface ExtractedData para que data.discursos seja uma lista de DiscursoResult.
    // Por simplicidade e para manter a estrutura atual de ExtractedData,
    // vamos simular um DiscursoResult para cada discurso individual.
    // Esta não é a abordagem ideal e pode precisar de refatoração.

    for (const discursoApiItem of data.discursos) { // Renomeado para evitar confusão
      try {
        // Simular um DiscursoResult para o transformador
        // O 'codigo' do senador e 'dadosBasicos' seriam necessários para um DiscursoResult completo.
        // Se 'discursoApiItem' já tiver uma estrutura que identifique o senador, podemos usá-la.
        // Assumindo que 'discursoApiItem' é um item de pronunciamento/discurso que não tem info do senador diretamente.
        // Esta é uma limitação da abordagem atual.
        const discursoResultMock: any = { // Usando 'any' para o mock
          timestamp: new Date().toISOString(),
          // O código do senador não está diretamente disponível em 'discursoApiItem' neste ponto do fluxo.
          // Isso é uma falha no design atual se 'transformDiscursos' realmente precisar do código do senador.
          // Vamos usar um placeholder ou tentar extrair de 'discursoApiItem' se possível.
          codigo: (discursoApiItem as any)?.Parlamentar?.IdentificacaoParlamentar?.CodigoParlamentar || this.context.options.senador || 'desconhecido',
          dadosBasicos: { // Mock de dados básicos
            timestamp: new Date().toISOString(),
            origem: 'mock',
            dados: { Parlamentar: (discursoApiItem as any)?.Parlamentar || {} },
            metadados: {}
          },
          // discursosTransformer.transformDiscursos espera .discursos.dados ou .apartes.dados
          // Vamos assumir que discursoApiItem é um único discurso que precisa ser encapsulado
          discursos: { dados: discursoApiItem } 
        };

        const transformado = discursosTransformer.transformDiscursos(discursoResultMock);

        if (transformado && transformado.discursos) {
          // 'transformado.discursos' é a lista de discursos individuais transformados para aquele senador/DiscursoResult.
          for (const d of transformado.discursos) {
            discursosTransformados.push(d);
            estatisticas.total++;
            const tipo = d.tipo || 'Outros';
            estatisticas.porTipo[tipo] = (estatisticas.porTipo[tipo] || 0) + 1;
            const mes = d.data?.substring(0, 7) || 'Sem data';
            estatisticas.porMes[mes] = (estatisticas.porMes[mes] || 0) + 1;
          }
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao transformar discurso: ${error.message}. Item: ${JSON.stringify(discursoApiItem).substring(0,100)}`);
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
        data.legislatura, // Passar legislatura como número
        false // Corrigido: apenasDiscursos é boolean. Passando false.
        // Se a intenção era usar this.context.options.senador para algo aqui,
        // a lógica de saveMultiplosDiscursos ou os parâmetros precisariam mudar.
      );
      
      this.updateLoadStats(
        resultado.total,
        resultado.sucessos,
        resultado.falhas
      );
      
      return { // Garantir que o retorno seja compatível com BatchResult
        total: resultado.total,
        processados: (resultado as any).processados ?? resultado.total, // Adicionar processados se existir no resultado de saveMultiplosDiscursos
        sucessos: resultado.sucessos,
        falhas: resultado.falhas,
        detalhes: (resultado as any).detalhes || [] // Adicionar detalhes se existir
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
