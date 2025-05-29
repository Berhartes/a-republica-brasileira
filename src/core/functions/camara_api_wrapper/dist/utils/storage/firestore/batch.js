/**
 * Gerenciador de Operações em Lote para Firestore
 *
 * Este módulo oferece uma interface unificada para operações em lote,
 * funcionando tanto com implementação real quanto mock.
 */
import { logger } from '../../logging';
/**
 * Classe abstrata para gerenciadores de lote
 */
export class AbstractBatchManager {
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
            logger.info(`Limite de ${this.maxOperations} operações atingido. Realizando commit automático.`);
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
/**
 * Utilitários para criar referências de documentos
 */
export class DocumentRefHelper {
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
//# sourceMappingURL=batch.js.map