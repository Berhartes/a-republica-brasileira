"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRefHelper = exports.AbstractBatchManager = void 0;
/**
 * Gerenciador de Operações em Lote para Firestore
 *
 * Este módulo oferece uma interface unificada para operações em lote,
 * funcionando tanto com implementação real quanto mock.
 */
const logging_1 = require("../../logging");
/**
 * Classe abstrata para gerenciadores de lote
 */
class AbstractBatchManager {
    constructor(config = {}) {
        this.operationCount = 0;
        this.maxOperations = config.maxOperations || 500;
        this.autoCommit = config.autoCommit !== false; // default true
    }
    /**
     * Verifica se deve fazer commit automático baseado no número de operações
     */
    async checkAutoCommit() {
        if (this.autoCommit && this.operationCount >= this.maxOperations) {
            logging_1.logger.info(`Limite de ${this.maxOperations} operações atingido. Realizando commit automático.`);
            await this.commit();
        }
    }
    /**
     * Incrementa o contador de operações e verifica se deve fazer commit automático
     */
    async incrementAndCheck() {
        this.operationCount++;
        await this.checkAutoCommit();
    }
    /**
     * Reseta o contador de operações
     */
    resetCounter() {
        this.operationCount = 0;
    }
    /**
     * Retorna o número atual de operações pendentes
     */
    getPendingOperations() {
        return this.operationCount;
    }
}
exports.AbstractBatchManager = AbstractBatchManager;
/**
 * Utilitários para criar referências de documentos
 */
class DocumentRefHelper {
    /**
     * Valida um caminho de documento
     */
    static validatePath(path) {
        const parts = path.split('/');
        if (parts.length < 2 || parts.length % 2 !== 0) {
            throw new Error(`Caminho inválido: ${path}. Deve ter um número par de segmentos (coleção/documento).`);
        }
    }
    /**
     * Extrai partes do caminho
     */
    static parsePath(path) {
        this.validatePath(path);
        const parts = path.split('/');
        if (parts.length === 2) {
            return {
                collection: parts[0],
                document: parts[1]
            };
        }
        // Para caminhos aninhados
        const subcollections = [];
        for (let i = 2; i < parts.length; i += 2) {
            subcollections.push(parts[i]);
        }
        return {
            collection: parts[0],
            document: parts[1],
            subcollections
        };
    }
}
exports.DocumentRefHelper = DocumentRefHelper;
//# sourceMappingURL=batch.js.map