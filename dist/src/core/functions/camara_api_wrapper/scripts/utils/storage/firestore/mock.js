"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firestoreMock = void 0;
exports.createBatchManager = createBatchManager;
exports.saveToFirestore = saveToFirestore;
/**
 * Mock do Firestore para desenvolvimento local
 */
const logging_1 = require("../../logging");
/**
 * Implementação do mock do Firestore para testes locais
 */
class FirestoreMockImpl {
    constructor() {
        this.store = {};
    }
    /**
     * Obtém um documento do Firestore mock
     */
    async get(collection, docId) {
        logging_1.logger.debug(`[FirestoreMock] GET ${collection}/${docId}`);
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 50));
        if (!this.store[collection]) {
            return null;
        }
        return this.store[collection][docId] || null;
    }
    /**
     * Salva um documento no Firestore mock
     */
    async set(collection, docId, data) {
        logging_1.logger.debug(`[FirestoreMock] SET ${collection}/${docId}`);
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!this.store[collection]) {
            this.store[collection] = {};
        }
        this.store[collection][docId] = {
            ...data,
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString()
        };
    }
    /**
     * Atualiza um documento existente no Firestore mock
     */
    async update(collection, docId, data) {
        logging_1.logger.debug(`[FirestoreMock] UPDATE ${collection}/${docId}`);
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 75));
        if (!this.store[collection] || !this.store[collection][docId]) {
            throw new Error(`Documento ${collection}/${docId} não encontrado para atualização`);
        }
        this.store[collection][docId] = {
            ...this.store[collection][docId],
            ...data,
            _updatedAt: new Date().toISOString()
        };
    }
    /**
     * Deleta um documento do Firestore mock
     */
    async delete(collection, docId) {
        logging_1.logger.debug(`[FirestoreMock] DELETE ${collection}/${docId}`);
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 75));
        if (this.store[collection]) {
            delete this.store[collection][docId];
        }
    }
    /**
     * Executa uma consulta simples no Firestore mock
     * Suporta apenas condições de igualdade básicas
     */
    async query(collection, conditions) {
        logging_1.logger.debug(`[FirestoreMock] QUERY ${collection} with conditions:`, conditions);
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 150));
        if (!this.store[collection]) {
            return [];
        }
        const results = Object.values(this.store[collection]).filter(doc => {
            return Object.entries(conditions).every(([key, value]) => doc[key] === value);
        });
        return results;
    }
}
// Exporta uma instância única do FirestoreMock
exports.firestoreMock = new FirestoreMockImpl();
// Classe mock para o BatchManager
class MockBatchManager {
    constructor() {
        this.operations = [];
    }
    set(ref, data, options) {
        this.operations.push({ type: 'set', ref, data, options });
    }
    update(ref, data) {
        this.operations.push({ type: 'update', ref, data });
    }
    delete(ref) {
        this.operations.push({ type: 'delete', ref });
    }
    async commit() {
        const startTime = Date.now();
        const totalOperations = this.operations.length;
        logging_1.logger.info(`Realizando commit em lote com ${totalOperations} operações (mock)`);
        // Simula um atraso para parecer mais realista
        await new Promise(resolve => setTimeout(resolve, 500));
        const duration = Date.now() - startTime;
        logging_1.logger.info(`Commit em lote concluído com sucesso (mock) em ${duration}ms`);
        const result = {
            total: totalOperations,
            processados: totalOperations,
            sucessos: totalOperations,
            falhas: 0,
            tempoOperacao: duration,
            detalhes: this.operations.map(op => ({
                id: op.ref,
                status: 'sucesso',
                erro: undefined
            }))
        };
        // Limpa as operações após o commit
        this.operations = [];
        return result;
    }
}
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
function createBatchManager() {
    return new MockBatchManager();
}
/**
 * Função helper para salvar dados no Firestore de forma organizada
 * (Implementação mock para desenvolvimento)
 */
async function saveToFirestore(collectionPath, documentId, data, _options = {}) {
    const documentPath = documentId
        ? `${collectionPath}/${documentId}`
        : `${collectionPath}/${Date.now().toString()}`; // Gera ID baseado no timestamp
    logging_1.logger.info(`Salvando dados em ${documentPath} (mock)`);
    logging_1.logger.debug('Dados:', data);
    // Simula um atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 300));
    logging_1.logger.info(`Dados salvos com sucesso em ${documentPath} (mock)`);
}
//# sourceMappingURL=mock.js.map