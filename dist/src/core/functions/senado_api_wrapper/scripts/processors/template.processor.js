"use strict";
/**
 * Template de processador ETL
 *
 * Use este template como base para criar novos processadores.
 * Copie este arquivo e ajuste conforme necessário.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateProcessor = void 0;
const etl_processor_1 = require("../core/etl-processor");
// Função auxiliar para parsear caminhos do Firestore
function parseFirestorePath(fullPath) {
    const parts = fullPath.split('/');
    if (parts.length % 2 !== 0) {
        throw new Error(`Caminho Firestore inválido: ${fullPath}. Deve ter um número par de segmentos (coleção/documento/coleção/documento...).`);
    }
    const documentId = parts[parts.length - 1];
    const collectionPath = parts.slice(0, parts.length - 1).join('/');
    return { collectionPath, documentId };
}
/**
 * Template de processador ETL
 *
 * Renomeie esta classe para refletir o que ela processa
 * Exemplo: VotacoesProcessor, DiscursosProcessor, etc.
 */
class TemplateProcessor extends etl_processor_1.ETLProcessor {
    /**
     * Nome do processo para logs e identificação
     */
    getProcessName() {
        return 'Template Processor';
    }
    /**
     * Valida as opções e configurações antes do processamento
     */
    async validate() {
        const erros = [];
        const avisos = [];
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
    async extract() {
        this.context.logger.info('Iniciando extração de dados...');
        // Simular extração de dados
        // Na prática, aqui você faria chamadas à API, leitura de arquivos, etc.
        const items = [];
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
                this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, progresso, `Extraídos ${i + 1}/${limite} itens`);
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
    async transform(data) {
        this.context.logger.info('Transformando dados...');
        const processedItems = [];
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
                    this.emitProgress(etl_types_1.ProcessingStatus.TRANSFORMANDO, progresso, `Transformados ${index + 1}/${data.items.length} itens`);
                }
            }
            catch (error) {
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
    async load(data) {
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
    configurarEmulator() {
        process.env.FIRESTORE_EMULATOR_HOST = this.context.config.firestore.emulatorHost;
        this.context.logger.info(`Configurado Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
    /**
     * Salva dados localmente no PC
     */
    async salvarNoPC(data) {
        this.context.logger.info('Salvando dados no PC local...');
        // Importar função de exportação
        const { exportToJson } = await Promise.resolve().then(() => __importStar(require('../utils/common')));
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
        }
        catch (error) {
            throw new Error(`Erro ao salvar no PC: ${error.message}`);
        }
    }
    /**
     * Salva dados no Firestore
     */
    async salvarNoFirestore(data) {
        this.context.logger.info('Salvando dados no Firestore...');
        // Importar gerenciador de batch
        const { createBatchManager } = await Promise.resolve().then(() => __importStar(require('../utils/storage')));
        const batchManager = createBatchManager();
        const detalhes = [];
        try {
            // Salvar cada item
            for (const [index, item] of data.processedItems.entries()) {
                const docRef = `template_collection/${item.id}`;
                const { collectionPath, documentId } = parseFirestorePath(docRef);
                batchManager.set(collectionPath, documentId, item);
                detalhes.push({
                    id: item.id,
                    status: 'sucesso'
                });
                // Atualizar progresso
                if ((index + 1) % 10 === 0) {
                    const progresso = 50 + Math.round(((index + 1) / data.processedItems.length) * 50); // 50-100%
                    this.emitProgress(etl_types_1.ProcessingStatus.CARREGANDO, progresso, `Salvos ${index + 1}/${data.processedItems.length} itens`);
                }
            }
            // Salvar resumo
            const summaryRef = 'template_collection/summary';
            const { collectionPath: summaryCollection, documentId: summaryDocId } = parseFirestorePath(summaryRef);
            batchManager.set(summaryCollection, summaryDocId, {
                ...data.summary,
                timestamp: new Date().toISOString()
            });
            // Executar batch
            await batchManager.commitAndReset();
            // Atualizar estatísticas
            this.updateLoadStats(data.processedItems.length, data.summary.successful, data.summary.failed);
            return {
                total: data.processedItems.length,
                processados: data.processedItems.length,
                sucessos: data.summary.successful,
                falhas: data.summary.failed,
                detalhes
            };
        }
        catch (error) {
            throw new Error(`Erro ao salvar no Firestore: ${error.message}`);
        }
    }
}
exports.TemplateProcessor = TemplateProcessor;
// Importar ProcessingStatus se necessário
const etl_types_1 = require("../types/etl.types");
//# sourceMappingURL=template.processor.js.map