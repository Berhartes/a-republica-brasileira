/**
 * Configuração do Firebase Admin SDK para acesso ao Firestore
 * Este arquivo configura o Firebase Admin SDK usando as credenciais de serviço
 */
import { logger } from '../../logging';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
// import { getFirestoreConfig, getDestinoConfig } from '../../config/environment.config'; // Comentado para usar require dinâmico
let db;
let firebaseAdmin;
/**
 * Inicializa o Firebase Admin SDK e configura o Firestore
 * Deve ser chamado APÓS a configuração das variáveis de ambiente
 */
export function initializeFirestore() {
    if (firebaseAdmin && firebaseAdmin.apps.length) {
        logger.info('Firebase Admin SDK já inicializado.');
        return;
    }
    // Usar require dinâmico para carregar environment.config
    const environmentConfigModule = require('../../../config/environment.config');
    const firestoreConfig = environmentConfigModule.getFirestoreConfig();
    const destinoConfig = environmentConfigModule.getDestinoConfig();
    // Caminho para o arquivo de credenciais de serviço
    const serviceAccountPath = firestoreConfig.credentials ?
        path.resolve(process.cwd(), firestoreConfig.credentials) :
        path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');
    // Verificar se o arquivo de credenciais existe (apenas se não for mock ou PC)
    if (!destinoConfig.useMock && !destinoConfig.saveToPC && !fs.existsSync(serviceAccountPath)) {
        logger.error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
        throw new Error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
    }
    try {
        firebaseAdmin = admin; // Atribuir admin globalmente
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccountPath),
            projectId: firestoreConfig.projectId // Usar projectId da config
        });
        logger.info('Firebase Admin SDK inicializado com sucesso');
    }
    catch (error) {
        logger.error('Erro ao inicializar Firebase Admin SDK:', error);
        throw error;
    }
    // Obter instância do Firestore e configurar para ignorar propriedades indefinidas
    db = firebaseAdmin.firestore();
    // Configurar para ignorar propriedades indefinidas e conectar ao emulador se necessário
    if (destinoConfig.useEmulator) {
        const emulatorHost = firestoreConfig.emulatorHost || '127.0.0.1:8000';
        db.settings({
            host: emulatorHost,
            ssl: false,
            ignoreUndefinedProperties: true
        });
        logger.info(`Conexão com Firestore Emulator estabelecida (${emulatorHost})`);
    }
    else if (destinoConfig.useRealFirestore) {
        db.settings({
            ignoreUndefinedProperties: true
        });
        logger.info('Conexão com Firestore real estabelecida (ignorando propriedades indefinidas)');
    }
    else if (destinoConfig.useMock) {
        logger.info('Usando Firestore Mock (nenhuma conexão real estabelecida)');
    }
    else if (destinoConfig.saveToPC) {
        logger.info('Salvando dados localmente no PC (nenhuma conexão Firestore estabelecida)');
    }
}
// Exportar a instância do Firestore e outras funções úteis
export { db, firebaseAdmin as admin }; // Exportar db e admin após a inicialização
/**
 * Função para salvar um documento no Firestore
 * @param collectionPath Caminho da coleção
 * @param documentId ID do documento (opcional, se não fornecido, será gerado automaticamente)
 * @param data Dados a serem salvos
 * @param options Opções adicionais (como merge)
 */
export async function saveDocument(collectionPath, documentId, data, options = {}) {
    try {
        // Adicionar timestamps
        const dataWithTimestamps = {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        // Se não for uma atualização (merge), adicionar createdAt
        if (!options.merge) {
            dataWithTimestamps.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }
        // Salvar o documento
        if (documentId) {
            // Documento com ID específico
            const docRef = db.collection(collectionPath).doc(documentId);
            await docRef.set(dataWithTimestamps, options);
            logger.info(`Documento salvo com sucesso: ${collectionPath}/${documentId}`);
            return documentId;
        }
        else {
            // Documento com ID automático
            const docRef = await db.collection(collectionPath).add(dataWithTimestamps);
            logger.info(`Documento salvo com sucesso: ${collectionPath}/${docRef.id}`);
            return docRef.id;
        }
    }
    catch (error) {
        logger.error(`Erro ao salvar documento em ${collectionPath}:`, error);
        throw error;
    }
}
/**
 * Classe para gerenciar operações em lote no Firestore
 */
export class FirestoreBatchManager {
    constructor() {
        this.operationCount = 0;
        this.MAX_OPERATIONS = 500; // Limite de operações por lote
        this.batch = db.batch();
    }
    /**
     * Adiciona uma operação de set (criar/substituir) ao lote
     */
    set(collectionPath, documentId, data, options) {
        const docRef = db.collection(collectionPath).doc(documentId);
        this.batch.set(docRef, data, options || {});
        this.operationCount++;
        // Se atingir o limite, commit automaticamente e criar novo lote
        if (this.operationCount >= this.MAX_OPERATIONS) {
            this.commitAndReset();
        }
    }
    /**
     * Adiciona uma operação de update (atualizar) ao lote
     */
    update(collectionPath, documentId, data) {
        const docRef = db.collection(collectionPath).doc(documentId);
        this.batch.update(docRef, data);
        this.operationCount++;
        // Se atingir o limite, commit automaticamente e criar novo lote
        if (this.operationCount >= this.MAX_OPERATIONS) {
            this.commitAndReset();
        }
    }
    /**
     * Adiciona uma operação de delete (excluir) ao lote
     */
    delete(collectionPath, documentId) {
        const docRef = db.collection(collectionPath).doc(documentId);
        this.batch.delete(docRef);
        this.operationCount++;
        // Se atingir o limite, commit automaticamente e criar novo lote
        if (this.operationCount >= this.MAX_OPERATIONS) {
            this.commitAndReset();
        }
    }
    /**
     * Executa o lote atual e cria um novo lote
     */
    async commitAndReset() {
        if (this.operationCount > 0) {
            try {
                logger.info(`Realizando commit em lote com ${this.operationCount} operações`);
                // Adicionar timeout para evitar travamento
                const commitPromise = this.batch.commit();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout no commit do lote')), 30000));
                await Promise.race([commitPromise, timeoutPromise]);
                logger.info(`✅ Lote com ${this.operationCount} operações concluído com sucesso`);
            }
            catch (error) {
                logger.error(`❌ Erro ao executar lote com ${this.operationCount} operações:`, error);
                throw error;
            }
            // Resetar o lote e o contador
            this.batch = db.batch();
            this.operationCount = 0;
        }
    }
    /**
     * Executa todas as operações pendentes no lote
     */
    async commit() {
        await this.commitAndReset();
    }
}
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export function createBatchManager() {
    return new FirestoreBatchManager();
}
//# sourceMappingURL=config.js.map