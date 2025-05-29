"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.createBatchManager = createBatchManager;
exports.saveToFirestore = saveToFirestore;
/**
 * Configuração e utilitários para o Firestore
 * (Implementação real para produção usando Firebase Admin SDK)
 */
const logging_1 = require("../../logging");
const config_1 = require("./config"); // Ensure admin is imported directly
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return config_1.db; } });
// Verificar se está usando emulador ou produção
const isUsingEmulator = process.env.USE_FIRESTORE_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST !== undefined;
if (isUsingEmulator) {
    logging_1.logger.info(`Usando Firestore Emulator (${process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8000'}) com Firebase Admin SDK`);
}
else {
    logging_1.logger.info('Usando Firestore real (produção) com Firebase Admin SDK');
}
// Classe real para o BatchManager usando Firebase Admin SDK
class RealBatchManager {
    constructor() {
        this.operations = [];
        this.batch = config_1.db.batch();
    }
    set(ref, data, options) {
        const docRef = this.getDocRef(ref);
        this.batch.set(docRef, data, options || {});
        this.operations.push({ type: 'set', ref, data, options });
    }
    update(ref, data) {
        const docRef = this.getDocRef(ref);
        this.batch.update(docRef, data);
        this.operations.push({ type: 'update', ref, data });
    }
    delete(ref) {
        const docRef = this.getDocRef(ref);
        this.batch.delete(docRef);
        this.operations.push({ type: 'delete', ref });
    }
    async commit() {
        const startTime = Date.now();
        const totalOperations = this.operations.length;
        logging_1.logger.info(`Realizando commit em lote com ${totalOperations} operações`);
        try {
            await this.batch.commit();
            const duration = Date.now() - startTime;
            logging_1.logger.info(`Commit em lote concluído com sucesso em ${duration}ms`);
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
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logging_1.logger.error('Erro ao realizar commit em lote:', error);
            const result = {
                total: totalOperations,
                processados: 0,
                sucessos: 0,
                falhas: totalOperations,
                tempoOperacao: duration,
                detalhes: this.operations.map(op => ({
                    id: op.ref,
                    status: 'falha',
                    erro: error.message || 'Erro desconhecido'
                }))
            };
            throw result; // Lançar o BatchResult como erro
        }
        finally {
            // Cria novo batch e limpa as operações após o commit
            this.batch = config_1.db.batch();
            this.operations = [];
        }
    }
    getDocRef(path) {
        const parts = path.split('/');
        if (parts.length < 2 || parts.length % 2 !== 0) {
            throw new Error(`Caminho inválido: ${path}. Deve ter um número par de segmentos.`);
        }
        // Para caminhos simples como "colecao/documento"
        if (parts.length === 2) {
            return config_1.db.collection(parts[0]).doc(parts[1]);
        }
        // Para caminhos aninhados como "colecao/documento/subcolecao/subdocumento"
        let currentRef = config_1.db;
        for (let i = 0; i < parts.length; i += 2) {
            const collectionName = parts[i];
            const docId = parts[i + 1];
            if (i === 0) {
                currentRef = currentRef.collection(collectionName).doc(docId);
            }
            else {
                currentRef = currentRef.collection(collectionName).doc(docId);
            }
        }
        return currentRef;
    }
}
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
function createBatchManager() {
    return new RealBatchManager();
}
/**
 * Função helper para salvar dados no Firestore de forma organizada
 */
async function saveToFirestore(collectionPath, documentId, data, options = {}) {
    const collectionRef = config_1.db.collection(collectionPath);
    const docRef = documentId ? collectionRef.doc(documentId) : collectionRef.doc();
    logging_1.logger.info(`Salvando dados em ${collectionPath}/${documentId || docRef.id}`);
    try {
        await docRef.set(data, options);
        logging_1.logger.info(`Dados salvos com sucesso em ${collectionPath}/${documentId || docRef.id}`);
    }
    catch (error) {
        logging_1.logger.error(`Erro ao salvar dados em ${collectionPath}/${documentId || docRef.id}:`, error);
        throw error;
    }
}
//# sourceMappingURL=real.js.map