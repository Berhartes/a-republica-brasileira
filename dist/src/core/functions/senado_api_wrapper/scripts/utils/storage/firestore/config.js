"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreBatchManager = exports.admin = exports.db = void 0;
exports.saveDocument = saveDocument;
exports.createBatchManager = createBatchManager;
const tslib_1 = require("tslib");
/**
 * Configuração do Firebase Admin SDK para acesso ao Firestore
 * Este arquivo configura o Firebase Admin SDK usando as credenciais de serviço
 */
const logging_1 = require("../../logging");
const admin = tslib_1.__importStar(require("firebase-admin"));
exports.admin = admin;
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs")); // Adicionado para verificar o arquivo de credenciais
// Caminho para o arquivo de credenciais de serviço
const serviceAccountPath = path.resolve(process.cwd(), 'firebase-import.json'); // Assumindo que está na raiz do projeto
// Verificar se o arquivo de credenciais existe
if (!fs.existsSync(serviceAccountPath)) {
    logging_1.logger.error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
    process.exit(1);
}
// Inicializar o Firebase Admin SDK se ainda não estiver inicializado
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath)
        });
        logging_1.logger.info('Firebase Admin SDK inicializado com sucesso.');
    }
    catch (error) {
        logging_1.logger.error('Erro ao inicializar Firebase Admin SDK:', error);
        process.exit(1);
    }
}
// Obter instância do Firestore e configurar para ignorar propriedades indefinidas
const db = admin.firestore();
exports.db = db;
// Configurações para o emulador ou produção
const USE_FIRESTORE_EMULATOR = process.env.USE_FIRESTORE_EMULATOR === 'true';
if (USE_FIRESTORE_EMULATOR) {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8000';
    db.settings({
        host: emulatorHost,
        ssl: false,
        experimentalForceLongPolling: true,
    });
    logging_1.logger.info(`Firestore Admin SDK conectado ao emulador em: ${emulatorHost}`);
}
else {
    db.settings({
        ignoreUndefinedProperties: true
    });
    logging_1.logger.info('Firestore Admin SDK configurado para produção.');
}
/**
 * Função para salvar um documento no Firestore
 * @param collectionPath Caminho da coleção
 * @param documentId ID do documento (opcional, se não fornecido, será gerado automaticamente)
 * @param data Dados a serem salvos
 * @param options Opções adicionais (como merge)
 */
async function saveDocument(collectionPath, documentId, data, options = {} // Tipo ajustado
) {
    try {
        // Adicionar timestamps
        const dataWithTimestamps = {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        // Se não for uma atualização (merge), adicionar createdAt
        if (!options.merge) { // Agora options.merge é reconhecido
            dataWithTimestamps.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }
        // Salvar o documento
        if (documentId) {
            // Documento com ID específico
            const docRef = db.collection(collectionPath).doc(documentId);
            await docRef.set(dataWithTimestamps, options);
            logging_1.logger.info(`Documento salvo com sucesso: ${collectionPath}/${documentId}`);
            return documentId;
        }
        else {
            // Documento com ID automático
            const docRef = await db.collection(collectionPath).add(dataWithTimestamps);
            logging_1.logger.info(`Documento salvo com sucesso: ${collectionPath}/${docRef.id}`);
            return docRef.id;
        }
    }
    catch (error) {
        logging_1.logger.error(`Erro ao salvar documento em ${collectionPath}:`, error);
        throw error;
    }
}
/**
 * Classe para gerenciar operações em lote no Firestore
 */
class FirestoreBatchManager {
    constructor() {
        this.operationCount = 0;
        this.MAX_OPERATIONS = 250; // Limite de operações por lote (ajustado para 250)
        this.PAUSE_BETWEEN_BATCHES = 500; // Pausa em ms entre commits de lote
        this.batch = db.batch();
    }
    /**
     * Adiciona uma operação de set (criar/substituir) ao lote
     */
    async set(collectionPath, documentId, data, options) {
        const docRef = db.collection(collectionPath).doc(documentId);
        const dataWithTimestamps = {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (!options?.merge) { // Correção para SetOptions
            dataWithTimestamps.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }
        this.batch.set(docRef, dataWithTimestamps, options || {});
        this.operationCount++;
        await this.commitAndResetIfFull();
    }
    /**
     * Adiciona uma operação de update (atualizar) ao lote
     */
    async update(collectionPath, documentId, data) {
        const docRef = db.collection(collectionPath).doc(documentId);
        const dataWithTimestamps = {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        this.batch.update(docRef, dataWithTimestamps);
        this.operationCount++;
        await this.commitAndResetIfFull();
    }
    /**
     * Adiciona uma operação de delete (excluir) ao lote
     */
    async delete(collectionPath, documentId) {
        const docRef = db.collection(collectionPath).doc(documentId);
        this.batch.delete(docRef);
        this.operationCount++;
        await this.commitAndResetIfFull();
    }
    /**
     * Commita o lote atual se o número máximo de operações for atingido.
     * @private
     */
    async commitAndResetIfFull() {
        if (this.operationCount >= this.MAX_OPERATIONS) {
            await this.commitAndReset();
        }
    }
    /**
     * Commita o lote atual e o reseta.
     * @param caminhoBase Opcional: caminho base para logs.
     */
    async commitAndReset(caminhoBase) {
        if (this.operationCount === 0) {
            logging_1.logger.debug(`Nenhuma operação para commitar no lote para ${caminhoBase || 'caminho desconhecido'}.`);
            return;
        }
        logging_1.logger.info(`Commitando lote com ${this.operationCount} operações para ${caminhoBase || 'caminho desconhecido'}...`);
        try {
            await this.batch.commit();
            logging_1.logger.info(`Lote de ${this.operationCount} operações commitadas com sucesso para ${caminhoBase || 'caminho desconhecido'}.`);
        }
        catch (error) {
            logging_1.logger.error(`Erro ao commitar lote para ${caminhoBase || 'caminho desconhecido'}:`, error);
            throw error; // Re-lança o erro para que o chamador possa lidar com ele
        }
        finally {
            // Resetar o lote e o contador
            this.batch = db.batch();
            this.operationCount = 0;
            // Pausar brevemente para evitar sobrecarga do Firestore
            await new Promise(resolve => setTimeout(resolve, this.PAUSE_BETWEEN_BATCHES));
        }
    }
    /**
     * Retorna o número atual de operações no lote.
     * @returns Número de operações.
     */
    getOperationCount() {
        return this.operationCount;
    }
}
exports.FirestoreBatchManager = FirestoreBatchManager;
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
function createBatchManager() {
    return new FirestoreBatchManager();
}
//# sourceMappingURL=config.js.map