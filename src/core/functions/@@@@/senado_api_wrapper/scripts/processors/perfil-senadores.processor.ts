/**
 * Processador especializado para perfis de senadores
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de perfis de senadores.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, ProcessingStatus } from '../types/etl.types';
import { perfilSenadoresExtractor, SenadoresLegislaturaResult, PerfilCompletoResult } from '../extracao/perfilsenadores';
import { perfilSenadoresTransformer, SenadorBasicoTransformado, SenadorCompletoTransformado, ResultadoTransformacaoLista } from '../transformacao/perfilsenadores';
import { perfilSenadoresLoader } from '../carregamento/perfilsenadores';
import { obterNumeroLegislaturaAtual } from '../utils/date';
import { exportToJson } from '../utils/common';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  senadoresLista: SenadoresLegislaturaResult;
  perfis: PerfilCompletoResult[];
  legislatura: number;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  listaTransformada: ResultadoTransformacaoLista;
  perfisTransformados: SenadorCompletoTransformado[];
  legislatura: number;
}

/**
 * Processador de perfis de senadores
 */
export class PerfilSenadoresProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  /**
   * Nome do processo para identificação em logs
   */
  protected getProcessName(): string {
    return 'Processador de Perfis de Senadores';
  }

  /**
   * Valida as opções e configurações
   */
  async validate(): Promise<ValidationResult> {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Validar legislatura se especificada
    if (this.context.options.legislatura) {
      const leg = this.context.options.legislatura;
      
      if (leg < this.context.config.senado.legislatura.min || 
          leg > this.context.config.senado.legislatura.max) {
        erros.push(`Legislatura ${leg} fora do intervalo válido (${this.context.config.senado.legislatura.min}-${this.context.config.senado.legislatura.max})`);
      }

      // Avisar sobre legislaturas antigas
      if (leg < 55) {
        avisos.push(`Legislatura ${leg} é antiga e pode ter dados incompletos`);
      }
    }

    // Validar limite
    if (this.context.options.limite !== undefined && this.context.options.limite <= 0) {
      erros.push('Limite deve ser maior que zero');
    }

    // Validar senador específico se fornecido
    if (this.context.options.senador && !/^\d+$/.test(this.context.options.senador)) {
      erros.push('Código do senador deve conter apenas números');
    }

    // Validar configuração de destino
    if (this.context.options.destino === 'emulator' && !process.env.FIRESTORE_EMULATOR_HOST) {
      avisos.push('FIRESTORE_EMULATOR_HOST não configurado, usando localhost:8080');
    }

    // Validar concorrência
    if (this.context.config.senado.concurrency > 5) {
      avisos.push(`Concorrência alta (${this.context.config.senado.concurrency}) pode causar throttling na API`);
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Extrai os dados de perfis de senadores
   */
  async extract(): Promise<ExtractedData> {
    // Determinar legislatura
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Legislatura selecionada: ${legislatura}`);

    // 1. Extrair lista de senadores
    this.context.logger.info('📋 Extraindo lista de senadores...');
    const senadoresLista = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura);
    
    if (!senadoresLista.senadores || senadoresLista.senadores.length === 0) {
      throw new Error(`Nenhum senador encontrado para a legislatura ${legislatura}`);
    }

    this.context.logger.info(`✓ ${senadoresLista.senadores.length} senadores encontrados`);

    // 2. Aplicar filtros
    const codigosSenadores = this.aplicarFiltros(senadoresLista.senadores);
    this.context.logger.info(`🔍 ${codigosSenadores.length} senadores após aplicar filtros`);

    // Atualizar estatísticas
    this.updateExtractionStats(codigosSenadores.length, 0, 0);

    // 3. Extrair perfis completos
    this.context.logger.info('👤 Extraindo perfis completos...');
    const perfis = await this.extrairPerfisComProgresso(codigosSenadores);

    // Atualizar estatísticas finais
    const perfisSucesso = perfis.filter(p => !p.erro).length;
    const perfisFalha = perfis.filter(p => p.erro).length;
    this.updateExtractionStats(perfis.length, perfisSucesso, perfisFalha);

    this.context.logger.info(`✓ ${perfisSucesso} perfis extraídos com sucesso`);
    if (perfisFalha > 0) {
      this.context.logger.warn(`⚠️ ${perfisFalha} perfis com erro na extração`);
    }

    return {
      senadoresLista,
      perfis,
      legislatura
    };
  }

  /**
   * Transforma os dados extraídos
   */
  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando dados...');

    // 1. Transformar lista de senadores
    const listaTransformada = perfilSenadoresTransformer.transformSenadoresLegislatura(
      data.senadoresLista,
      data.legislatura
    );

    // 2. Transformar perfis completos
    const perfisTransformados: SenadorCompletoTransformado[] = [];
    let transformadosSucesso = 0;
    let transformadosFalha = 0;

    for (const perfil of data.perfis) {
      try {
        const perfilTransformado = perfilSenadoresTransformer.transformPerfilCompleto(perfil);
        if (perfilTransformado) {
          perfisTransformados.push(perfilTransformado);
          transformadosSucesso++;
        } else {
          transformadosFalha++;
          this.incrementWarnings();
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao transformar perfil ${perfil.codigo}: ${error.message}`);
        transformadosFalha++;
        this.incrementErrors();
      }
    }

    // Atualizar estatísticas
    this.updateTransformationStats(data.perfis.length, transformadosSucesso, transformadosFalha);

    this.context.logger.info(`✓ ${transformadosSucesso} perfis transformados com sucesso`);
    if (transformadosFalha > 0) {
      this.context.logger.warn(`⚠️ ${transformadosFalha} perfis falharam na transformação`);
    }

    return {
      listaTransformada,
      perfisTransformados,
      legislatura: data.legislatura
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
   * Métodos auxiliares privados
   */

  /**
   * Determina qual legislatura processar
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

  /**
   * Aplica filtros aos senadores
   */
  private aplicarFiltros(senadores: any[]): string[] {
    let codigos = senadores
      .map(s => s.IdentificacaoParlamentar?.CodigoParlamentar)
      .filter(Boolean) as string[];

    // Filtrar por senador específico
    if (this.context.options.senador) {
      const senadorEspecifico = this.context.options.senador;
      codigos = codigos.filter(c => c === senadorEspecifico);
      
      if (codigos.length === 0) {
        throw new Error(`Senador ${senadorEspecifico} não encontrado na legislatura`);
      }
    }

    // Filtrar por partido
    if (this.context.options.partido) {
      const partido = this.context.options.partido;
      const senadoresPartido = senadores
        .filter(s => s.IdentificacaoParlamentar?.SiglaPartidoParlamentar === partido)
        .map(s => s.IdentificacaoParlamentar?.CodigoParlamentar)
        .filter(Boolean) as string[];
      
      codigos = codigos.filter(c => senadoresPartido.includes(c));
      this.context.logger.info(`🏛️ Filtrados ${codigos.length} senadores do partido ${partido}`);
    }

    // Filtrar por UF
    if (this.context.options.uf) {
      const uf = this.context.options.uf;
      const senadoresUF = senadores
        .filter(s => s.IdentificacaoParlamentar?.UfParlamentar === uf)
        .map(s => s.IdentificacaoParlamentar?.CodigoParlamentar)
        .filter(Boolean) as string[];
      
      codigos = codigos.filter(c => senadoresUF.includes(c));
      this.context.logger.info(`📍 Filtrados ${codigos.length} senadores de ${uf}`);
    }

    // Aplicar limite
    if (this.context.options.limite && this.context.options.limite > 0) {
      codigos = codigos.slice(0, this.context.options.limite);
      this.context.logger.info(`📊 Limitado a ${codigos.length} senadores`);
    }

    return codigos;
  }

  /**
   * Extrai perfis com indicação de progresso
   */
  private async extrairPerfisComProgresso(codigosSenadores: string[]): Promise<PerfilCompletoResult[]> {
    const total = codigosSenadores.length;
    const perfis: PerfilCompletoResult[] = [];

    // Processar em lotes
    const tamanhoBatch = this.context.config.senado.concurrency;
    const batches = [];
    
    for (let i = 0; i < total; i += tamanhoBatch) {
      batches.push(codigosSenadores.slice(i, i + tamanhoBatch));
    }

    let processados = 0;

    for (const [batchIndex, batch] of batches.entries()) {
      this.context.logger.info(`📦 Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} senadores)`);

      const perfisBatch = await perfilSenadoresExtractor.extractMultiplosPerfis(
        batch,
        this.context.config.senado.concurrency,
        this.context.config.senado.maxRetries
      );

      perfis.push(...perfisBatch);
      processados += batch.length;

      // Atualizar progresso
      const progresso = Math.round((processados / total) * 100);
      this.emitProgress(
        ProcessingStatus.EXTRAINDO, 
        25 + Math.round(progresso * 0.25), // 25% a 50% do total
        `Extraídos ${processados}/${total} perfis`
      );

      // Pausa entre lotes
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.context.config.senado.pauseBetweenRequests));
      }
    }

    return perfis;
  }

  /**
   * Configura o emulador do Firestore
   */
  private configurarEmulator(): void {
    process.env.FIRESTORE_EMULATOR_HOST = this.context.config.firestore.emulatorHost;
    this.context.logger.info(`🔧 Configurado Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  /**
   * Salva dados no PC local
   */
  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando dados no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `senadores/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar lista de senadores
      const listaPath = `${baseDir}/lista_senadores_${timestamp}.json`;
      exportToJson(data.listaTransformada, listaPath);
      detalhes.push({ id: 'lista', status: 'sucesso' });
      
      // Salvar perfis completos
      const perfisPath = `${baseDir}/perfis_completos_${timestamp}.json`;
      exportToJson(data.perfisTransformados, perfisPath);
      detalhes.push({ id: 'perfis_completos', status: 'sucesso' });
      
      // Salvar perfis individuais
      const individualDir = `${baseDir}/individuais`;
      let salvosIndividuais = 0;
      
      for (const perfil of data.perfisTransformados) {
        try {
          const perfilPath = `${individualDir}/senador_${perfil.codigo}_${timestamp}.json`;
          exportToJson(perfil, perfilPath);
          salvosIndividuais++;
          detalhes.push({ id: perfil.codigo, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: perfil.codigo, 
            status: 'falha', 
            erro: error.message 
          });
        }
      }
      
      this.context.logger.info(`✓ ${salvosIndividuais} perfis individuais salvos`);
      
      // Atualizar estatísticas
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

  /**
   * Salva dados no Firestore
   */
  private async salvarNoFirestore(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('☁️ Salvando dados no Firestore...');
    
    const detalhes: any[] = [];

    try {
      // 1. Salvar lista de senadores
      this.context.logger.info('📋 Salvando lista de senadores...');
      const resultadoLista = await perfilSenadoresLoader.saveSenadoresLegislatura(
        data.listaTransformada,
        data.legislatura
      );
      
      detalhes.push({ 
        id: 'lista_senadores', 
        status: resultadoLista.status === 'success' ? 'sucesso' : 'falha' 
      });

      // 2. Salvar perfis completos
      this.context.logger.info('👤 Salvando perfis completos...');
      const resultadoPerfis = await perfilSenadoresLoader.saveMultiplosPerfis(
        data.perfisTransformados,
        data.legislatura
      );
      
      // Adicionar detalhes dos perfis
      for (const perfil of data.perfisTransformados) {
        detalhes.push({ 
          id: perfil.codigo, 
          status: 'sucesso' // Assumindo sucesso por simplicidade
        });
      }

      // 3. Salvar histórico
      if (!this.context.options.dryRun) {
        this.context.logger.info('📚 Salvando histórico...');
        await perfilSenadoresLoader.saveHistorico(
          data.perfisTransformados,
          data.legislatura
        );
        
        detalhes.push({ 
          id: 'historico', 
          status: 'sucesso' 
        });
      }

      // Calcular totais
      const sucessos = resultadoPerfis.sucessos + 1; // +1 para a lista
      const falhas = resultadoPerfis.falhas;
      
      // Atualizar estatísticas
      this.updateLoadStats(data.perfisTransformados.length + 1, sucessos, falhas);
      
      return {
        total: data.perfisTransformados.length + 1,
        processados: data.perfisTransformados.length + 1,
        sucessos,
        falhas,
        detalhes
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      throw error;
    }
  }
}
