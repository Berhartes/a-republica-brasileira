/**
 * Processador ETL para Despesas de Deputados da Câmara - Versão 3 (Otimizada)
 *
 * Implementa o fluxo ETL para extrair, transformar e carregar despesas
 * de deputados para a nova estrutura de dados desnormalizada do Firestore.
 * Garante a mesma metodologia de coleta de dados da v2.
 */

import { ETLProcessor } from '../core/etl-processor';
import {
  ValidationResult,
  DeputadoBasico,
  ETLOptions,
  ProcessingStatus,
  ETLResult,
} from '../types/etl.types';
import { DespesaOptimizada, DeputadoOptimizado, FornecedorOptimizado } from '../types/firestore.types';
import { createBatchManager } from '../utils/storage';
import { firestoreDb as getDb } from '../utils/storage/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { etlConfig } from '../config/etl.config';
import { apiClient, get, replacePath } from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/logging/error-handler';
import { formatarCnpjCpf } from '../utils/formatters';

// Interface de extração idêntica à v2 para garantir compatibilidade
interface ExtractedData {
  deputados: DeputadoBasico[];
  despesasPorDeputado: Array<{
    deputadoId: string;
    despesas: any[];
    erro?: string;
  }>;
}

// Interface de transformação para a nova estrutura otimizada
interface TransformedData {
  deputados: DeputadoOptimizado[];
  despesas: DespesaOptimizada[];
  fornecedores: FornecedorOptimizado[];
}

export class DespesasDeputadosV3Processor extends ETLProcessor<ExtractedData, TransformedData> {
  constructor(options: ETLOptions) {
    super(options);
  }

  protected getProcessName(): string {
    return 'Processador de Despesas de Deputados v3';
  }

  async validate(): Promise<ValidationResult> {
    const baseValidation = this.validateCommonParams();
    const erros = [...baseValidation.erros];
    const avisos = [...baseValidation.avisos];

    if (!this.context.options.legislatura) {
      erros.push('Legislatura é obrigatória.');
    }
    // Adicionar outras validações da v2 se necessário
    return { valido: erros.length === 0, erros, avisos };
  }

  // =================================================================
  // EXTRACTION LOGIC (Identical to V2)
  // =================================================================

  async extract(): Promise<ExtractedData> {
    const legislatura = this.context.options.legislatura!;
    const limite = this.context.options.limite || 0;
    const deputadoEspecifico = this.context.options.deputado;
    const modoAtualizacao = this.context.options.atualizar || false;

    this.emitProgress(ProcessingStatus.EXTRAINDO, 10, 'Iniciando extração de dados');

    try {
      let deputadosParaProcessar: DeputadoBasico[];

      if (deputadoEspecifico) {
        this.context.logger.info(`🎯 Extraindo despesas do deputado específico: ${deputadoEspecifico}`);
        deputadosParaProcessar = await this.extractDeputadoEspecifico(deputadoEspecifico, legislatura);
      } else {
        this.context.logger.info(`📋 Extraindo lista de deputados da ${legislatura}ª Legislatura`);
        const listaCompleta = await this.extractDeputadosLegislatura(legislatura);
        deputadosParaProcessar = this.applyFilters(listaCompleta);

        if (this.context.options.entre) {
          const entreParts = this.context.options.entre.split('-');
          const inicio = parseInt(entreParts[0], 10);
          const fim = parseInt(entreParts[1], 10);
          const sliceInicio = inicio - 1;
          const sliceFim = fim;

          if (sliceInicio < deputadosParaProcessar.length) {
            this.context.logger.info(`🔪 Aplicando filtro --entre ${inicio}-${fim}.`);
            deputadosParaProcessar = deputadosParaProcessar.slice(sliceInicio, sliceFim);
          } else {
            deputadosParaProcessar = [];
          }
        }

        if (limite > 0 && deputadosParaProcessar.length > limite) {
          this.context.logger.info(`🔢 Aplicando limite: ${limite} de ${deputadosParaProcessar.length} deputados`);
          deputadosParaProcessar = deputadosParaProcessar.slice(0, limite);
        }
      }

      if (deputadosParaProcessar.length === 0) {
        this.context.logger.warn('⚠️ Nenhum deputado encontrado com os filtros especificados');
        return { deputados: [], despesasPorDeputado: [] };
      }

      this.emitProgress(ProcessingStatus.EXTRAINDO, 30, `Extraindo despesas de ${deputadosParaProcessar.length} deputados`);
      const despesasPorDeputado = await this.extractDespesasDeputados(deputadosParaProcessar, modoAtualizacao);
      this.emitProgress(ProcessingStatus.EXTRAINDO, 90, 'Extração concluída');

      return { deputados: deputadosParaProcessar, despesasPorDeputado };

    } catch (error: any) {
      this.context.logger.error(`❌ Erro na extração: ${error.message}`);
      throw error;
    }
  }

  private async extractDeputadoEspecifico(deputadoId: string, legislatura: number): Promise<DeputadoBasico[]> {
    try {
      const endpointConfig = endpoints.DEPUTADOS.PERFIL;
      const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });
      const response = await withRetry(() => get(endpoint, endpointConfig.PARAMS), etlConfig.camara.maxRetries, etlConfig.camara.pauseBetweenRequests, `Perfil do deputado ${deputadoId}`);
      if (!response || !response.dados) throw new Error(`Deputado ${deputadoId} não encontrado`);
      const deputado = response.dados;
      return [{
        id: deputado.id?.toString() || deputadoId,
        nome: deputado.nomeCivil || deputado.nome || '',
        nomeCivil: deputado.nomeCivil,
        siglaPartido: deputado.ultimoStatus?.siglaPartido || '',
        siglaUf: deputado.ultimoStatus?.siglaUf || '',
        idLegislatura: legislatura,
        urlFoto: deputado.ultimoStatus?.urlFoto || ''
      }];
    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair deputado ${deputadoId}: ${error.message}`);
      throw error;
    }
  }

  private async extractDeputadosLegislatura(legislatura: number): Promise<DeputadoBasico[]> {
    try {
      const endpointConfig = endpoints.DEPUTADOS.LISTA;
      let deputados: DeputadoBasico[] = [];
      let pagina = 1;
      do {
        const params = { ...endpointConfig.PARAMS, idLegislatura: legislatura.toString(), ordem: 'ASC', ordenarPor: 'nome', pagina: pagina.toString(), itens: String(etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE) };
        const response = await withRetry(() => get(endpointConfig.PATH, params), etlConfig.camara.maxRetries, etlConfig.camara.pauseBetweenRequests, `Lista de deputados da legislatura ${legislatura}, página ${pagina}`);
        if (!response || !response.dados || !Array.isArray(response.dados) || response.dados.length === 0) break;
        const deputadosDaPagina: DeputadoBasico[] = response.dados.map((dep: any) => ({ id: dep.id?.toString() || '', nome: dep.nome || '', nomeCivil: dep.nomeCivil, siglaPartido: dep.siglaPartido || '', siglaUf: dep.siglaUf || '', idLegislatura: legislatura, urlFoto: dep.urlFoto || '' }));
        deputados = deputados.concat(deputadosDaPagina);
        pagina++;
        await new Promise(resolve => setTimeout(resolve, etlConfig.camara.pauseBetweenRequests / 2));
      } while (true);
      this.context.logger.info(`✅ Encontrados ${deputados.length} deputados na ${legislatura}ª Legislatura`);
      return deputados;
    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair lista de deputados: ${error.message}`);
      throw error;
    }
  }

  private applyFilters(deputados: DeputadoBasico[]): DeputadoBasico[] {
    let filtrados = [...deputados];
    const totalOriginal = filtrados.length;
    filtrados = this.deduplicateDeputados(filtrados);
    if (totalOriginal !== filtrados.length) this.context.logger.info(`🔄 Deduplicação: ${totalOriginal} → ${filtrados.length} deputados`);
    if (this.context.options.partido) {
      const partido = this.context.options.partido.toUpperCase();
      filtrados = filtrados.filter(dep => dep.siglaPartido === partido);
      this.context.logger.info(`🔍 Filtro por partido ${partido}: ${filtrados.length} deputados`);
    }
    if (this.context.options.uf) {
      const uf = this.context.options.uf.toUpperCase();
      filtrados = filtrados.filter(dep => dep.siglaUf === uf);
      this.context.logger.info(`🔍 Filtro por UF ${uf}: ${filtrados.length} deputados`);
    }
    return filtrados;
  }

  private deduplicateDeputados(deputados: DeputadoBasico[]): DeputadoBasico[] {
    const deputadosUnicos = new Map<string, DeputadoBasico>();
    for (const deputado of deputados) {
      if (!deputadosUnicos.has(deputado.id)) {
        deputadosUnicos.set(deputado.id, deputado);
      }
    }
    return Array.from(deputadosUnicos.values());
  }

  private async extractDespesasDeputados(deputados: DeputadoBasico[], modoAtualizacao = false): Promise<ExtractedData['despesasPorDeputado']> {
    const resultados: ExtractedData['despesasPorDeputado'] = [];
    const concorrencia = this.context.options.concorrencia || 2;
    this.context.logger.info(`🔄 Extraindo despesas com concorrência: ${concorrencia}`);
    for (let i = 0; i < deputados.length; i += concorrencia) {
      const lote = deputados.slice(i, i + concorrencia);
      const promessas = lote.map(async (deputado) => {
        try {
          const despesasResult = modoAtualizacao ? await this.extractDespesasIncremental(deputado.id) : await this.extractDespesasCompletas(deputado.id);
          this.incrementSucessos();
          return despesasResult;
        } catch (error: any) {
          this.context.logger.error(`❌ Erro ao extrair despesas do deputado ${deputado.id}: ${error.message}`);
          this.incrementFalhas();
          return { deputadoId: deputado.id, despesas: [], erro: error.message };
        }
      });
      const resultadosLote = await Promise.allSettled(promessas);
      resultadosLote.forEach((resultado) => {
        if (resultado.status === 'fulfilled') resultados.push(resultado.value);
      });
      const progresso = Math.min(90, 30 + (i / deputados.length) * 60);
      this.emitProgress(ProcessingStatus.EXTRAINDO, progresso, `${resultados.length}/${deputados.length} deputados processados`);
      if (i + concorrencia < deputados.length) await new Promise(resolve => setTimeout(resolve, etlConfig.camara.pauseBetweenRequests * 2));
    }
    return resultados;
  }

  private async extractDespesasCompletas(deputadoId: string): Promise<{ deputadoId: string, despesas: any[] }> {
    const legislatura = this.context.options.legislatura!;
    const ano = this.context.options.ano;
    const mes = this.context.options.mes;
    try {
      const endpointConfig = endpoints.DEPUTADOS.DESPESAS;
      const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });
      const baseParams: Record<string, any> = { ...endpointConfig.PARAMS, idLegislatura: legislatura.toString(), itens: String(etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE) };
      if (ano) baseParams.ano = ano.toString();
      if (mes) baseParams.mes = mes.toString();
      const todasDespesas = await apiClient.getAllPages(endpoint, baseParams, { context: `Despesas do deputado ${deputadoId}`, maxPages: 100 });
      return { deputadoId, despesas: todasDespesas };
    } catch (error: any) {
      this.context.logger.error(`❌ Erro ao extrair despesas do deputado ${deputadoId}: ${error.message}`);
      throw error;
    }
  }

  private async extractDespesasIncremental(deputadoId: string): Promise<{ deputadoId: string, despesas: any[] }> {
    const agora = new Date();
    const mesesParaVerificar: { ano: number; mes: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      mesesParaVerificar.push({ ano: data.getFullYear(), mes: data.getMonth() + 1 });
    }
    const mesesUnicos = [...new Map(mesesParaVerificar.map(item => [`${item.ano}-${item.mes}`, item])).values()];
    let todasDespesas: any[] = [];
    const dataLimiteInferior = new Date();
    dataLimiteInferior.setMonth(dataLimiteInferior.getMonth() - 2);
    dataLimiteInferior.setDate(1);
    dataLimiteInferior.setHours(0, 0, 0, 0);
    for (const { ano, mes } of mesesUnicos) {
      try {
        const despesasMes = await this.extractDespesasPorMes(deputadoId, ano, mes);
        const despesasRecentes = despesasMes.filter((despesa: any) => {
          if (!despesa.dataDocumento) return false;
          try {
            return new Date(despesa.dataDocumento) >= dataLimiteInferior;
          } catch (e) { return false; }
        });
        todasDespesas.push(...despesasRecentes);
      } catch (error: any) {
        this.context.logger.warn(`⚠️ Erro ao extrair mês ${ano}-${mes} do deputado ${deputadoId}: ${error.message}`);
      }
    }
    return { deputadoId, despesas: todasDespesas };
  }

  private async extractDespesasPorMes(deputadoId: string, ano: number, mes: number): Promise<any[]> {
    const legislatura = this.context.options.legislatura!;
    const endpointConfig = endpoints.DEPUTADOS.DESPESAS;
    const endpoint = replacePath(endpointConfig.PATH, { codigo: deputadoId });
    const params: Record<string, any> = { ...endpointConfig.PARAMS, idLegislatura: legislatura.toString(), ano: ano.toString(), mes: mes.toString(), itens: String(etlConfig.camara.itemsPerPage || endpoints.REQUEST.DEFAULT_ITEMS_PER_PAGE) };
    return await apiClient.getAllPages(endpoint, params, { context: `Despesas ${ano}-${mes.toString().padStart(2, '0')} do deputado ${deputadoId}`, maxPages: 20 });
  }

  // =================================================================
  // TRANSFORMATION LOGIC (Adapted for V3)
  // =================================================================

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 10, 'Iniciando transformação para estrutura otimizada');
    
    const deputadosOtimizados: DeputadoOptimizado[] = [];
    const despesasOtimizadas: DespesaOptimizada[] = [];
    const fornecedoresMap = new Map<string, FornecedorOptimizado>();

    const deputadosMap = new Map(data.deputados.map(d => [d.id, d]));

    for (const dadosDeputado of data.despesasPorDeputado) {
      if (dadosDeputado.erro) continue;

      const deputadoInfo = deputadosMap.get(dadosDeputado.deputadoId);
      if (!deputadoInfo) continue;

      // Adiciona o deputado à lista de transformação se ainda não estiver lá
      if (!deputadosOtimizados.some(d => d.id === deputadoInfo.id)) {
        deputadosOtimizados.push({
            id: deputadoInfo.id,
            nome: deputadoInfo.nome,
            siglaPartido: deputadoInfo.siglaPartido,
            siglaUf: deputadoInfo.siglaUf,
            urlFoto: deputadoInfo.urlFoto || '',
            ultimaAtualizacao: Timestamp.now(),
        });
      }

      for (const despesaBruta of dadosDeputado.despesas) {
        // Validação mínima da despesa bruta
        if (!despesaBruta.ano || !despesaBruta.mes || !despesaBruta.dataDocumento) {
          this.context.logger.warn(`Despesa ignorada por falta de dados essenciais: ${JSON.stringify(despesaBruta)}`);
          continue;
        }

        despesasOtimizadas.push({
            deputadoId: deputadoInfo.id,
            deputadoNome: deputadoInfo.nome,
            ano: despesaBruta.ano,
            mes: despesaBruta.mes,
            anoMes: `${despesaBruta.ano}-${String(despesaBruta.mes).padStart(2, '0')}`,
            tipoDespesa: despesaBruta.tipoDespesa,
            valorLiquido: despesaBruta.valorLiquido,
            dataDocumento: Timestamp.fromDate(new Date(despesaBruta.dataDocumento)),
            fornecedorNome: despesaBruta.nomeFornecedor,
            fornecedorCnpj: formatarCnpjCpf(despesaBruta.cnpjCpfFornecedor),
            partidoDeputado: deputadoInfo.siglaPartido,
            ufDeputado: deputadoInfo.siglaUf,
        });

        // Coleta e agrega dados de fornecedores
        const cnpjOriginal = despesaBruta.cnpjCpfFornecedor;
        if (cnpjOriginal) {
            const cnpjFormatado = formatarCnpjCpf(cnpjOriginal) || cnpjOriginal;
            if (!fornecedoresMap.has(cnpjFormatado)) {
                fornecedoresMap.set(cnpjFormatado, {
                    cnpj: cnpjFormatado,
                    nome: despesaBruta.nomeFornecedor,
                    // Campos de agregação inicializados
                totalRecebido: 0,
                numeroTransacoes: 0,
                numeroDeputados: 0,
                scoreInvestigativo: 0,
                categoriaRisco: 'NORMAL',
                ultimaAtualizacao: Timestamp.now(),
                });
            }
        }
      }
    }

    const fornecedoresOtimizados = Array.from(fornecedoresMap.values());
    this.emitProgress(ProcessingStatus.TRANSFORMANDO, 90, 'Transformação concluída');
    return { deputados: deputadosOtimizados, despesas: despesasOtimizadas, fornecedores: fornecedoresOtimizados };
  }

  // =================================================================
  // LOAD LOGIC (Adapted for V3)
  // =================================================================

  async load(data: TransformedData): Promise<ETLResult> {
    this.emitProgress(ProcessingStatus.CARREGANDO, 10, 'Iniciando carregamento na nova estrutura');
    const batchManager = createBatchManager();

    // Carregar/Atualizar Deputados
    this.emitProgress(ProcessingStatus.CARREGANDO, 20, `Carregando ${data.deputados.length} deputados`);
    for (const deputado of data.deputados) {
        const docRef = `deputados/${deputado.id}`;
        // Usar merge para não sobrescrever agregações futuras feitas por Cloud Functions
        await batchManager.set(docRef, deputado, { merge: true });
    }

    // Carregar Fornecedores
    this.emitProgress(ProcessingStatus.CARREGANDO, 40, `Carregando ${data.fornecedores.length} fornecedores`);
    for (const fornecedor of data.fornecedores) {
        // O ID do documento deve ser o CNPJ sem formatação para consistência
        const docId = fornecedor.cnpj.replace(/\D/g, '');
        const docRef = `fornecedores/${docId}`;
        // Usar merge para não sobrescrever agregações futuras
        await batchManager.set(docRef, fornecedor, { merge: true });
    }

    // Carregar Despesas
    this.emitProgress(ProcessingStatus.CARREGANDO, 60, `Carregando ${data.despesas.length} despesas`);
    for (const despesa of data.despesas) {
        // Gerar um ID único para cada despesa para evitar colisões
        const despesaId = getDb().collection(`deputados/${despesa.deputadoId}/despesas`).doc().id;
        const docRef = `deputados/${despesa.deputadoId}/despesas/${despesaId}`;
        await batchManager.set(docRef, despesa);
    }

    this.emitProgress(ProcessingStatus.CARREGANDO, 90, 'Executando commit dos batches');
    const batchResults = await batchManager.commit();

    return {
        sucessos: batchResults.sucessos,
        falhas: batchResults.falhas,
        avisos: 0,
        tempoProcessamento: batchResults.tempoOperacao ?? 0,
        destino: 'Firestore (Estrutura Otimizada)',
        legislatura: this.context.options.legislatura!,
        detalhes: {
            deputadosSalvos: data.deputados.length,
            despesasSalvas: data.despesas.length,
            fornecedoresSalvos: data.fornecedores.length,
        }
    };
  }
}
