/**
 * Processador especializado para senadores em exercício
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de senadores.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, ProcessingStatus } from '../types/etl.types';
import { senadoresExtractor } from '../extracao/senadores';
import { senadoresTransformer } from '../transformacao/senadores';
import { senadoresLoader } from '../carregamento/senadores';
import { obterNumeroLegislaturaAtual } from '../utils/date';
import { exportToJson } from '../utils/common';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  senadores: any[];
  detalhes: Map<string, any>;
  legislatura: number;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  senadoresTransformados: any[];
  estatisticas: {
    totalSenadores: number;
    senadoresPorPartido: Record<string, number>;
    senadoresPorUF: Record<string, number>;
    senadoresPorSexo: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de senadores em exercício
 */
export class SenadoresProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Senadores em Exercício';
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

    // Validar partido se especificado
    if (this.context.options.partido && !/^[A-Z]{2,10}$/.test(this.context.options.partido)) {
      avisos.push('Formato de partido pode estar incorreto (use siglas como PT, PSDB, etc.)');
    }

    // Validar UF se especificada
    if (this.context.options.uf && !/^[A-Z]{2}$/.test(this.context.options.uf)) {
      erros.push('UF deve ter exatamente 2 letras maiúsculas (ex: SP, RJ, MG)');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Extraindo senadores em exercício da legislatura ${legislatura}`);

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Extraindo lista de senadores...');

    // Extrair lista de senadores atuais
    const dadosExtraidos = await senadoresExtractor.extractSenadoresAtuais();
    
    if (!dadosExtraidos.senadores || dadosExtraidos.senadores.length === 0) {
      throw new Error('Nenhum senador em exercício encontrado');
    }

    let senadores = dadosExtraidos.senadores;

    // Aplicar filtros se especificados
    senadores = this.aplicarFiltros(senadores);

    this.context.logger.info(`✓ ${senadores.length} senadores encontrados`);

    // Aplicar limite se especificado
    if (this.context.options.limite && this.context.options.limite > 0) {
      senadores = senadores.slice(0, this.context.options.limite);
      this.context.logger.info(`🔍 Limitado a ${senadores.length} senadores`);
    }

    this.emitProgress(ProcessingStatus.EXTRAINDO, 50, 'Extraindo detalhes dos senadores...');

    // Extrair detalhes adicionais se necessário
    const detalhes = await this.extrairDetalhes(senadores);

    this.updateExtractionStats(dadosExtraidos.senadores.length, senadores.length, 0);

    return {
      senadores,
      detalhes,
      legislatura
    };
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando senadores...');

    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados dos senadores...');

    // Preparar dados para transformação
    const dadosParaTransformar = {
      timestamp: new Date().toISOString(),
      senadores: data.senadores,
      detalhes: Object.fromEntries(data.detalhes)
    };

    // Transformar senadores
    const dadosTransformados = senadoresTransformer.transformSenadoresAtuais(dadosParaTransformar);

    // Calcular estatísticas
    const estatisticas = {
      totalSenadores: dadosTransformados.senadores.length,
      senadoresPorPartido: {} as Record<string, number>,
      senadoresPorUF: {} as Record<string, number>,
      senadoresPorSexo: {} as Record<string, number>
    };

    // Calcular estatísticas detalhadas
    dadosTransformados.senadores.forEach((senador: any) => {
      // Por partido
      const partido = senador.partido?.sigla || 'Sem partido';
      estatisticas.senadoresPorPartido[partido] = (estatisticas.senadoresPorPartido[partido] || 0) + 1;
      
      // Por UF
      const uf = senador.uf || 'Sem UF';
      estatisticas.senadoresPorUF[uf] = (estatisticas.senadoresPorUF[uf] || 0) + 1;
      
      // Por sexo
      const sexo = senador.sexo || 'Não informado';
      estatisticas.senadoresPorSexo[sexo] = (estatisticas.senadoresPorSexo[sexo] || 0) + 1;
    });

    this.updateTransformationStats(
      data.senadores.length, 
      dadosTransformados.senadores.length, 
      data.senadores.length - dadosTransformados.senadores.length
    );

    this.context.logger.info(`✓ ${dadosTransformados.senadores.length} senadores transformados`);
    this.context.logger.info(`📊 Estatísticas:`, estatisticas);

    return {
      senadoresTransformados: dadosTransformados.senadores,
      estatisticas,
      legislatura: data.legislatura
    };
  }

  async load(data: TransformedData): Promise<BatchResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 80, 'Salvando senadores...');

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

  private aplicarFiltros(senadores: any[]): any[] {
    let filtrados = [...senadores];

    // Filtro por partido
    if (this.context.options.partido) {
      const partido = this.context.options.partido.toUpperCase();
      filtrados = filtrados.filter(s => {
        const partidoSenador = s.IdentificacaoParlamentar?.SiglaPartidoParlamentar?.toUpperCase();
        return partidoSenador === partido;
      });
      this.context.logger.info(`🔍 Filtrado por partido ${partido}: ${filtrados.length} senadores`);
    }

    // Filtro por UF
    if (this.context.options.uf) {
      const uf = this.context.options.uf.toUpperCase();
      filtrados = filtrados.filter(s => {
        const ufSenador = s.IdentificacaoParlamentar?.UfParlamentar?.toUpperCase();
        return ufSenador === uf;
      });
      this.context.logger.info(`🔍 Filtrado por UF ${uf}: ${filtrados.length} senadores`);
    }

    return filtrados;
  }

  private async extrairDetalhes(senadores: any[]): Promise<Map<string, any>> {
    const detalhes = new Map<string, any>();
    let processados = 0;

    // Se não há necessidade de detalhes adicionais, retornar mapa vazio
    if (!this.context.options.detalhes) {
      return detalhes;
    }

    for (const senador of senadores) {
      try {
        const codigo = senador.IdentificacaoParlamentar?.CodigoParlamentar;
        if (codigo) {
          this.context.logger.debug(`Extraindo detalhes do senador ${senador.IdentificacaoParlamentar?.NomeParlamentar}`);
          
          // Extrair detalhes específicos se necessário
          // const detalheSenador = await senadoresExtractor.extractDetalheSenador?.(codigo);
          // detalhes.set(codigo, detalheSenador);
        }
        
        processados++;
        
        // Emitir progresso
        const progresso = Math.round((processados / senadores.length) * 40);
        this.emitProgress(
          ProcessingStatus.EXTRAINDO,
          50 + progresso,
          `Extraídos detalhes de ${processados}/${senadores.length} senadores`
        );

        // Pausa entre requisições
        if (processados < senadores.length) {
          await new Promise(resolve => 
            setTimeout(resolve, this.context.config.senado.pauseBetweenRequests)
          );
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao extrair detalhes do senador: ${error.message}`);
        this.incrementWarnings();
      }
    }

    return detalhes;
  }

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando senadores no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `senadores/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar lista de senadores
      const senadoresPath = `${baseDir}/senadores_atuais_${timestamp}.json`;
      exportToJson(data.senadoresTransformados, senadoresPath);
      detalhes.push({ id: 'senadores', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar por partido
      const partidosDir = `${baseDir}/partidos`;
      Object.entries(data.estatisticas.senadoresPorPartido).forEach(([partido, quantidade]) => {
        try {
          const senadoresPartido = data.senadoresTransformados.filter(s => 
            s.partido?.sigla === partido
          );
          const partidoPath = `${partidosDir}/${partido}_${timestamp}.json`;
          exportToJson(senadoresPartido, partidoPath);
          detalhes.push({ id: `partido_${partido}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `partido_${partido}`, 
            status: 'falha', 
            erro: error.message 
          });
        }
      });

      // Salvar por UF
      const ufsDir = `${baseDir}/ufs`;
      Object.entries(data.estatisticas.senadoresPorUF).forEach(([uf, quantidade]) => {
        try {
          const senadoresUF = data.senadoresTransformados.filter(s => s.uf === uf);
          const ufPath = `${ufsDir}/${uf}_${timestamp}.json`;
          exportToJson(senadoresUF, ufPath);
          detalhes.push({ id: `uf_${uf}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `uf_${uf}`, 
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
    this.context.logger.info('☁️ Salvando senadores no Firestore...');
    
    try {
      // Reconstituir dados no formato esperado pelo loader
      const dadosParaCarregamento = {
        senadores: data.senadoresTransformados,
        timestamp: new Date().toISOString()
      };

      // Salvar senadores
      const resultadoSenadores = await senadoresLoader.saveSenadoresAtuais(
        dadosParaCarregamento,
        data.legislatura
      );
      
      // Salvar histórico
      await senadoresLoader.saveSenadoresHistorico(
        dadosParaCarregamento,
        data.legislatura
      );
      
      this.updateLoadStats(
        resultadoSenadores.totalSalvos,
        resultadoSenadores.totalSalvos,
        0
      );
      
      return {
        total: resultadoSenadores.totalSalvos,
        processados: resultadoSenadores.totalSalvos,
        sucessos: resultadoSenadores.totalSalvos,
        falhas: 0,
        detalhes: [
          { id: 'senadores', status: 'sucesso', quantidade: resultadoSenadores.totalSalvos },
          { id: 'historico', status: 'sucesso' }
        ]
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
