"use strict";
/**
 * Processador base para ETL do Senado Federal
 *
 * Esta classe abstrata implementa o padrão Template Method para
 * garantir um fluxo ETL consistente em todos os processadores.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETLProcessor = void 0;
const etl_types_1 = require("../types/etl.types");
const etl_config_1 = require("../config/etl.config");
const logging_1 = require("../utils/logging");
const logging_2 = require("../utils/logging");
/**
 * Classe base abstrata para processadores ETL
 */
class ETLProcessor {
    constructor(options) {
        this.progressCallbacks = [];
        this.context = {
            options,
            config: etl_config_1.etlConfig,
            logger: logging_1.logger,
            stats: this.initializeStats()
        };
        this.logConfiguration();
    }
    /**
     * Inicializa as estatísticas de processamento
     */
    initializeStats() {
        return {
            inicio: Date.now(),
            processados: 0,
            erros: 0,
            avisos: 0,
            ignorados: 0,
            extracao: { total: 0, sucesso: 0, falha: 0 },
            transformacao: { total: 0, sucesso: 0, falha: 0 },
            carregamento: { total: 0, sucesso: 0, falha: 0 }
        };
    }
    /**
     * Registra as configurações atuais
     */
    logConfiguration() {
        this.context.logger.info('='.repeat(60));
        this.context.logger.info(`🚀 ${this.getProcessName()}`);
        this.context.logger.info('='.repeat(60));
        if (this.context.options.verbose) {
            this.context.logger.debug('Configurações:', {
                opções: this.context.options,
                senado: {
                    concorrência: this.context.config.senado.concurrency,
                    tentativas: this.context.config.senado.maxRetries,
                    timeout: `${this.context.config.senado.timeout}ms`
                },
                destino: this.context.options.destino
            });
        }
    }
    /**
     * Registra um callback de progresso
     */
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }
    /**
     * Emite um evento de progresso
     */
    emitProgress(status, progresso, mensagem, detalhes) {
        const event = { status, progresso, mensagem, detalhes };
        this.progressCallbacks.forEach(cb => cb(event));
        // Log do progresso
        const emoji = this.getStatusEmoji(status);
        this.context.logger.info(`${emoji} ${mensagem} (${progresso}%)`);
    }
    /**
     * Obtém emoji para o status
     */
    getStatusEmoji(status) {
        const emojis = {
            [etl_types_1.ProcessingStatus.INICIADO]: '🚀',
            [etl_types_1.ProcessingStatus.EXTRAINDO]: '📥',
            [etl_types_1.ProcessingStatus.TRANSFORMANDO]: '🔄',
            [etl_types_1.ProcessingStatus.CARREGANDO]: '📤',
            [etl_types_1.ProcessingStatus.FINALIZADO]: '✅',
            [etl_types_1.ProcessingStatus.ERRO]: '❌',
            [etl_types_1.ProcessingStatus.CANCELADO]: '🚫'
        };
        return emojis[status] || '📌';
    }
    /**
     * Processa o fluxo ETL completo
     */
    async process() {
        try {
            this.emitProgress(etl_types_1.ProcessingStatus.INICIADO, 0, 'Iniciando processamento ETL');
            // 1. Validação
            this.context.logger.info('📋 Etapa 1/4: Validação');
            const validacao = await this.validate();
            if (!validacao.valido) {
                throw new Error(`Validação falhou: ${validacao.erros.join(', ')}`);
            }
            if (validacao.avisos.length > 0) {
                validacao.avisos.forEach(aviso => this.context.logger.warn(`⚠️ ${aviso}`));
            }
            // 2. Extração
            this.context.logger.info('📥 Etapa 2/4: Extração');
            this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 25, 'Extraindo dados');
            const inicioExtracao = Date.now();
            const extracted = await this.extract();
            const tempoExtracao = Date.now() - inicioExtracao;
            this.context.logger.info(`✓ Extração concluída em ${(tempoExtracao / 1000).toFixed(2)}s`);
            // 3. Transformação
            this.context.logger.info('🔄 Etapa 3/4: Transformação');
            this.emitProgress(etl_types_1.ProcessingStatus.TRANSFORMANDO, 50, 'Transformando dados');
            const inicioTransformacao = Date.now();
            const transformed = await this.transform(extracted);
            const tempoTransformacao = Date.now() - inicioTransformacao;
            this.context.logger.info(`✓ Transformação concluída em ${(tempoTransformacao / 1000).toFixed(2)}s`);
            // 4. Carregamento
            this.context.logger.info('📤 Etapa 4/4: Carregamento');
            this.emitProgress(etl_types_1.ProcessingStatus.CARREGANDO, 75, 'Carregando dados');
            if (this.context.options.dryRun) {
                this.context.logger.warn('🔍 Modo DRY-RUN: Dados não serão salvos');
                return this.finalizeDryRun(tempoExtracao, tempoTransformacao);
            }
            const inicioCarregamento = Date.now();
            const loadResult = await this.load(transformed);
            const tempoCarregamento = Date.now() - inicioCarregamento;
            this.context.logger.info(`✓ Carregamento concluído em ${(tempoCarregamento / 1000).toFixed(2)}s`);
            // 5. Finalização
            this.context.stats.fim = Date.now();
            const resultado = this.finalize(loadResult, tempoExtracao, tempoTransformacao, tempoCarregamento);
            this.emitProgress(etl_types_1.ProcessingStatus.FINALIZADO, 100, 'Processamento concluído');
            this.logResultado(resultado);
            return resultado;
        }
        catch (error) {
            this.emitProgress(etl_types_1.ProcessingStatus.ERRO, 0, `Erro: ${error.message}`);
            this.context.logger.error(`Erro no processamento: ${error.message}`);
            (0, logging_2.handleError)(error, this.getProcessName());
            // Retornar resultado de erro
            return {
                sucessos: 0,
                falhas: this.context.stats.processados || 1,
                avisos: this.context.stats.avisos,
                tempoProcessamento: (Date.now() - this.context.stats.inicio) / 1000,
                destino: this.context.options.destino,
                erros: [{
                        codigo: 'ETL_ERROR',
                        mensagem: error.message,
                        timestamp: new Date().toISOString(),
                        stack: error.stack
                    }]
            };
        }
    }
    /**
     * Finaliza execução em modo dry-run
     */
    finalizeDryRun(tempoExtracao, tempoTransformacao) {
        const tempo = (Date.now() - this.context.stats.inicio) / 1000;
        return {
            sucessos: this.context.stats.processados,
            falhas: 0,
            avisos: this.context.stats.avisos,
            tempoProcessamento: tempo,
            tempoExtracao: tempoExtracao / 1000,
            tempoTransformacao: tempoTransformacao / 1000,
            destino: 'dry-run',
            detalhes: {
                mensagem: 'Execução em modo dry-run, nenhum dado foi salvo'
            }
        };
    }
    /**
     * Finaliza o processamento e prepara o resultado
     */
    finalize(loadResult, tempoExtracao, tempoTransformacao, tempoCarregamento) {
        const tempo = (this.context.stats.fim - this.context.stats.inicio) / 1000;
        return {
            sucessos: loadResult.sucessos || this.context.stats.carregamento.sucesso,
            falhas: loadResult.falhas || this.context.stats.carregamento.falha,
            avisos: this.context.stats.avisos,
            tempoProcessamento: tempo,
            tempoExtracao: tempoExtracao / 1000,
            tempoTransformacao: tempoTransformacao / 1000,
            tempoCarregamento: tempoCarregamento / 1000,
            destino: this.context.options.destino,
            legislatura: this.context.options.legislatura,
            detalhes: loadResult
        };
    }
    /**
     * Registra o resultado do processamento
     */
    logResultado(resultado) {
        this.context.logger.info('='.repeat(60));
        this.context.logger.info('📊 RESULTADO DO PROCESSAMENTO');
        this.context.logger.info('='.repeat(60));
        this.context.logger.info(`✅ Sucessos: ${resultado.sucessos}`);
        this.context.logger.info(`❌ Falhas: ${resultado.falhas}`);
        this.context.logger.info(`⚠️  Avisos: ${resultado.avisos}`);
        this.context.logger.info(`⏱️  Tempo total: ${resultado.tempoProcessamento.toFixed(2)}s`);
        if (this.context.options.verbose && resultado.tempoExtracao) {
            this.context.logger.info('⏱️  Detalhamento de tempo:');
            this.context.logger.info(`   - Extração: ${resultado.tempoExtracao.toFixed(2)}s`);
            this.context.logger.info(`   - Transformação: ${resultado.tempoTransformacao?.toFixed(2)}s`);
            this.context.logger.info(`   - Carregamento: ${resultado.tempoCarregamento?.toFixed(2)}s`);
        }
        this.context.logger.info(`💾 Destino: ${resultado.destino}`);
        if (resultado.legislatura) {
            this.context.logger.info(`🏛️  Legislatura: ${resultado.legislatura}`);
        }
        this.context.logger.info('='.repeat(60));
    }
    /**
     * Métodos auxiliares para as subclasses
     */
    /**
     * Incrementa contador de processados
     */
    incrementProcessed(count = 1) {
        this.context.stats.processados += count;
    }
    /**
     * Incrementa contador de erros
     */
    incrementErrors(count = 1) {
        this.context.stats.erros += count;
    }
    /**
     * Incrementa contador de avisos
     */
    incrementWarnings(count = 1) {
        this.context.stats.avisos += count;
    }
    /**
     * Registra estatísticas de extração
     */
    updateExtractionStats(total, sucesso, falha) {
        this.context.stats.extracao = { total, sucesso, falha };
    }
    /**
     * Registra estatísticas de transformação
     */
    updateTransformationStats(total, sucesso, falha) {
        this.context.stats.transformacao = { total, sucesso, falha };
    }
    /**
     * Registra estatísticas de carregamento
     */
    updateLoadStats(total, sucesso, falha) {
        this.context.stats.carregamento = { total, sucesso, falha };
    }
    /**
     * Incrementa contador de sucessos na extração
     */
    incrementSucessos(count = 1) {
        this.context.stats.extracao.sucesso += count;
    }
    /**
     * Incrementa contador de falhas na extração
     */
    incrementFalhas(count = 1) {
        this.context.stats.extracao.falha += count;
    }
    /**
     * Validação comum de parâmetros para todos os processadores
     */
    validateCommonParams() {
        const erros = [];
        const avisos = [];
        // Validar legislatura se especificada
        if (this.context.options.legislatura) {
            const leg = this.context.options.legislatura;
            if (leg < 1 || leg > 58) {
                erros.push(`Legislatura ${leg} fora do intervalo válido (1-58)`);
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
        // Validar partido se especificado
        if (this.context.options.partido && !/^[A-Z]{2,10}$/.test(this.context.options.partido)) {
            avisos.push('Formato de partido pode estar incorreto (use siglas como PT, PSDB, etc.)');
        }
        // Validar UF se especificada
        if (this.context.options.uf && !/^[A-Z]{2}$/.test(this.context.options.uf)) {
            erros.push('UF deve ter exatamente 2 letras maiúsculas (ex: SP, RJ, MG)');
        }
        // Validar configuração de destino
        if (this.context.options.destino === 'emulator' && !process.env.FIRESTORE_EMULATOR_HOST) {
            avisos.push('FIRESTORE_EMULATOR_HOST não configurado, usando 127.0.0.1:8000');
        }
        return {
            valido: erros.length === 0,
            erros,
            avisos
        };
    }
}
exports.ETLProcessor = ETLProcessor;
//# sourceMappingURL=etl-processor.js.map