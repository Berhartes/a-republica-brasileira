/**
 * Processador especializado para matérias legislativas
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de matérias legislativas de senadores.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, ProcessingStatus } from '../types/etl.types';
import { perfilSenadoresExtractor, PerfilSenadorResult } from '../extracao/perfilsenadores';
import { materiasExtractor, MateriaResult } from '../extracao/materias';
import { materiasTransformer, MateriaTransformada } from '../transformacao/materias';
import { materiasLoader } from '../carregamento/materias';
import { obterNumeroLegislaturaAtual, obterPeriodoLegislatura } from '../utils/date';
import { exportToJson } from '../utils/common';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  senadores: any[];
  materias: MateriaResult[];
  legislatura: number;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  materiasTransformadas: MateriaTransformada[];
  estatisticas: {
    totalSenadores: number;
    totalMaterias: number;
    totalAutorias: number;
    totalRelatorias: number;
    materiasPorTipo: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de matérias legislativas
 */
export class MateriasProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Matérias Legislativas';
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

    // Validar senador específico se fornecido
    if (this.context.options.senador && !/^\d+$/.test(this.context.options.senador)) {
      erros.push('Código do senador deve conter apenas números');
    }

    // Avisar sobre possíveis limitações
    if (!this.context.options.limite && !this.context.options.senador) {
      avisos.push('Processando matérias de todos os senadores pode demorar muito. Considere usar --limite ou --senador');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Extraindo matérias legislativas da legislatura ${legislatura}`);

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Extraindo lista de senadores...');

    // 1. Extrair lista de senadores da legislatura
    const senadoresExtraidos = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura);
    
    if (!senadoresExtraidos.senadores || senadoresExtraidos.senadores.length === 0) {
      throw new Error(`Nenhum senador encontrado para a legislatura ${legislatura}`);
    }

    // 2. Filtrar senadores de acordo com os parâmetros
    let codigosSenadores = senadoresExtraidos.senadores
      .map(s => s.IdentificacaoParlamentar?.CodigoParlamentar)
      .filter(Boolean) as string[];

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

    this.context.logger.info(`🚀 Processando matérias legislativas de ${codigosSenadores.length} senadores`);

    this.emitProgress(ProcessingStatus.EXTRAINDO, 30, 'Extraindo matérias legislativas...');

    // 3. Extrair matérias legislativas para cada senador
    const materiasExtraidas: MateriaResult[] = await this.extrairMateriasSeadores(codigosSenadores, legislatura);

    this.updateExtractionStats(senadoresExtraidos.senadores.length, materiasExtraidas.length, 0);

    return {
      senadores: senadoresExtraidos.senadores,
      materias: materiasExtraidas,
      legislatura
    };
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando matérias legislativas...');

    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados das matérias...');

    // Transformar matérias
    const materiasTransformadas = await materiasTransformer.transformMultiplasMaterias(data.materias);

    // Calcular estatísticas
    const estatisticas = {
      totalSenadores: data.senadores.length,
      totalMaterias: materiasTransformadas.length,
      totalAutorias: 0,
      totalRelatorias: 0,
      materiasPorTipo: {} as Record<string, number>
    };

    // Contar estatísticas detalhadas
    materiasTransformadas.forEach(materia => {
      // Contar autorias
      if (materia.autorias?.length) {
        estatisticas.totalAutorias += materia.autorias.length;
        
        // Contar por tipo
        materia.autorias.forEach(autoria => {
          const tipo = autoria.tipo || 'Outros';
          estatisticas.materiasPorTipo[tipo] = (estatisticas.materiasPorTipo[tipo] || 0) + 1;
        });
      }
      
      // Contar relatorias
      if (materia.relatorias?.length) {
        estatisticas.totalRelatorias += materia.relatorias.length;
      }
    });

    this.updateTransformationStats(data.materias.length, materiasTransformadas.length, 0);

    this.context.logger.info(`✓ ${materiasTransformadas.length} senadores com matérias transformados`);
    this.context.logger.info(`📊 Estatísticas:`, estatisticas);

    return {
      materiasTransformadas,
      estatisticas,
      legislatura: data.legislatura
    };
  }

  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 80, 'Salvando matérias legislativas...');

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

  private async extrairMateriasSeadores(codigosSenadores: string[], legislatura: number): Promise<MateriaResult[]> {
    const materiasExtraidas: MateriaResult[] = [];
    let sucessos = 0;
    let falhas = 0;

    for (const [index, codigoSenador] of codigosSenadores.entries()) {
      this.context.logger.info(`👤 Processando senador ${index + 1}/${codigosSenadores.length}: código ${codigoSenador}`);

      try {
        // Extrair dados básicos e mandatos do senador
        const perfilBasico = await perfilSenadoresExtractor.extractDadosBasicos(codigoSenador);
        const mandatosSenador = await perfilSenadoresExtractor.extractMandatos(codigoSenador);

        if (!mandatosSenador || !mandatosSenador.dados) {
          this.context.logger.warn(`⚠️ Não foi possível obter mandatos para o senador ${codigoSenador}. Usando método padrão.`);
          this.incrementWarnings();

          // Usar método padrão se não conseguir obter mandatos
          const materiaSenador = await materiasExtractor.extractMaterias(codigoSenador);
          materiasExtraidas.push(materiaSenador);
          continue;
        }

        // Extrair matérias por períodos de mandato
        this.context.logger.debug(`📋 Extraindo matérias por períodos de mandato para o senador ${codigoSenador}`);

        // Obter array de mandatos
        const mandatosObj = mandatosSenador.dados;
        const mandatosArray = Array.isArray(mandatosObj.Mandato) ? mandatosObj.Mandato : [mandatosObj.Mandato];

        // Arrays para armazenar resultados por período
        let autoriasPorPeriodo: PerfilSenadorResult[] = [];
        let relatoriasPorPeriodo: PerfilSenadorResult[] = [];

        // Processar cada mandato
        for (const [idxMandato, mandato] of mandatosArray.entries()) {
          // Extrair datas de início e fim do mandato
          let dataInicio = mandato?.DataInicio;
          let dataFim = mandato?.DataFim;

          // Se não encontrar datas, tentar obter do arquivo XML
          if (!dataInicio) {
            const periodoLegislatura = await obterPeriodoLegislatura(legislatura);
            if (periodoLegislatura) {
              dataInicio = periodoLegislatura.DataInicio;
              dataFim = periodoLegislatura.DataFim;
              this.context.logger.debug(`📅 Período da legislatura ${legislatura} extraído do XML: ${dataInicio} a ${dataFim}`);
            } else {
              const hoje = new Date();
              const quatroAnosAtras = new Date();
              quatroAnosAtras.setFullYear(hoje.getFullYear() - 4);

              dataInicio = quatroAnosAtras.toISOString().slice(0, 10);
              dataFim = hoje.toISOString().slice(0, 10);
              this.context.logger.warn(`⚠️ Usando período padrão de 4 anos: ${dataInicio} a ${dataFim}`);
              this.incrementWarnings();
            }
          }

          this.context.logger.debug(`📅 Processando mandato ${idxMandato + 1}/${mandatosArray.length}: ${dataInicio} a ${dataFim}`);

          // Extrair autorias por período de mandato
          const autoriasMandato = await materiasExtractor.extractAutoriasPorPeriodoMandato(
            codigoSenador,
            dataInicio,
            dataFim
          );

          // Adicionar resultados ao array
          autoriasPorPeriodo = [...autoriasPorPeriodo, ...autoriasMandato];

          // Extrair relatorias por período de mandato
          const relatoriasMandato = await materiasExtractor.extractRelatoriasPorPeriodoMandato(
            codigoSenador,
            dataInicio,
            dataFim
          );

          // Adicionar resultados ao array
          relatoriasPorPeriodo = [...relatoriasPorPeriodo, ...relatoriasMandato];
        }

        // Consolidar resultados
        this.context.logger.debug(`🔄 Consolidando resultados de matérias para o senador ${codigoSenador}`);

        // Consolidar autorias
        const autoriasConsolidadas = autoriasPorPeriodo.length > 0
          ? materiasExtractor.consolidarResultadosAutorias(autoriasPorPeriodo)
          : null;

        // Consolidar relatorias
        const relatoriasConsolidadas = relatoriasPorPeriodo.length > 0
          ? materiasExtractor.consolidarResultadosRelatorias(relatoriasPorPeriodo)
          : null;

        // Verificar se encontrou alguma matéria
        if (autoriasConsolidadas || relatoriasConsolidadas) {
          // Criar objeto consolidado
          const materiaConsolidada: MateriaResult = {
            timestamp: new Date().toISOString(),
            codigo: codigoSenador,
            dadosBasicos: perfilBasico,
            autorias: autoriasConsolidadas ? {
              timestamp: new Date().toISOString(),
              origem: `Consolidação de ${autoriasPorPeriodo.length} períodos`,
              dados: autoriasConsolidadas,
              metadados: {}
            } : undefined,
            relatorias: relatoriasConsolidadas ? {
              timestamp: new Date().toISOString(),
              origem: `Consolidação de ${relatoriasPorPeriodo.length} períodos`,
              dados: relatoriasConsolidadas,
              metadados: {}
            } : undefined
          };

          materiasExtraidas.push(materiaConsolidada);
          sucessos++;
        } else {
          this.context.logger.warn(`⚠️ Nenhuma matéria encontrada para o senador ${codigoSenador}. Usando método padrão.`);
          this.incrementWarnings();

          // Usar método padrão se não encontrar matérias nos períodos
          const materiaSenador = await materiasExtractor.extractMaterias(codigoSenador);
          materiasExtraidas.push(materiaSenador);
        }
      } catch (error: any) {
        this.context.logger.error(`❌ Erro ao processar matérias do senador ${codigoSenador}: ${error.message}`);
        falhas++;
        this.incrementErrors();

        // Adicionar objeto de erro para manter consistência
        materiasExtraidas.push({
          timestamp: new Date().toISOString(),
          codigo: codigoSenador,
          dadosBasicos: {
            timestamp: new Date().toISOString(),
            origem: `Processamento de matérias do senador ${codigoSenador}`,
            dados: null,
            metadados: {},
            erro: error.message
          },
          erro: error.message
        });
      }

      // Emitir progresso
      const progresso = Math.round((index + 1) / codigosSenadores.length * 50); // 50% da barra para extração
      this.emitProgress(
        ProcessingStatus.EXTRAINDO,
        30 + progresso,
        `Processados ${index + 1}/${codigosSenadores.length} senadores`
      );

      // Pausa entre senadores para não sobrecarregar a API
      if (index < codigosSenadores.length - 1) {
        this.context.logger.debug(`⏱️ Aguardando 3 segundos antes de processar o próximo senador...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    this.context.logger.info(`✅ Extração concluída: ${sucessos} sucessos, ${falhas} falhas`);
    return materiasExtraidas;
  }

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando matérias legislativas no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `materias/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar todas as matérias
      const materiasPath = `${baseDir}/materias_completas_${timestamp}.json`;
      exportToJson(data.materiasTransformadas, materiasPath);
      detalhes.push({ id: 'materias_completas', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar por tipo de matéria
      const tiposDir = `${baseDir}/tipos`;
      Object.entries(data.estatisticas.materiasPorTipo).forEach(([tipo, quantidade]) => {
        try {
          const materiasDoTipo = data.materiasTransformadas.filter(m => 
            m.autorias?.some(a => a.tipo === tipo)
          );
          const tipoPath = `${tiposDir}/${tipo}_${timestamp}.json`;
          exportToJson(materiasDoTipo, tipoPath);
          detalhes.push({ id: `tipo_${tipo}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `tipo_${tipo}`, 
            status: 'falha', 
            erro: error.message 
          });
        }
      });

      // Salvar por senador se específico
      if (this.context.options.senador) {
        const senadorDir = `${baseDir}/senador_${this.context.options.senador}`;
        const senadorPath = `${senadorDir}/materias_${timestamp}.json`;
        exportToJson(data.materiasTransformadas, senadorPath);
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
    this.context.logger.info('☁️ Salvando matérias legislativas no Firestore...');
    
    try {
      // Salvar matérias
      const resultado = await materiasLoader.saveMultiplasMaterias(
        data.materiasTransformadas,
        data.legislatura
      );
      
      this.updateLoadStats(
        resultado.sucessos + resultado.falhas,
        resultado.sucessos,
        resultado.falhas
      );
      
      return {
        total: resultado.sucessos + resultado.falhas,
        processados: resultado.sucessos + resultado.falhas,
        sucessos: resultado.sucessos,
        falhas: resultado.falhas,
        detalhes: [
          { id: 'materias', status: 'sucesso', quantidade: resultado.sucessos },
          ...(resultado.falhas > 0 ? [{ id: 'falhas', status: 'falha', quantidade: resultado.falhas }] : [])
        ]
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
