"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAdmin = exports.firestoreDb = exports.AbstractBatchManager = exports.DocumentRefHelper = void 0;
exports.createBatchManager = createBatchManager;
exports.saveToFirestore = saveToFirestore;
exports.getFirestoreConfig = getFirestoreConfig;
exports.isSavingToPC = isSavingToPC;
exports.getPCSaveDirectory = getPCSaveDirectory;
const tslib_1 = require("tslib");
/**
 * Sistema de Firestore Unificado
 *
 * Este módulo oferece uma interface unificada para o Firestore,
 * determinando automaticamente se deve usar a implementação real ou mock
 * baseado nas configurações de ambiente definidas pelas flags.
 *
 * @example
 * ```typescript
 * import { createBatchManager, saveToFirestore, BatchManager } from '../utils/storage/firestore';
 *
 * // Usar batch manager
 * const batch = createBatchManager();
 * batch.set('senadores/123', { nome: 'João Silva' });
 * await batch.commit();
 *
 * // Salvar documento único
 * await saveToFirestore('senadores', '123', { nome: 'João Silva' });
 * ```
 */
const logging_1 = require("../../logging");
const firestoreMock = tslib_1.__importStar(require("./mock"));
const firestoreReal = tslib_1.__importStar(require("./real"));
const real_1 = require("./real");
const mock_1 = require("./mock");
const environment_config_1 = require("../../../config/environment.config");
const config_1 = require("./config"); // Importar a função de inicialização
// Obter configuração de destino
const destinoConfig = (0, environment_config_1.getDestinoConfig)();
// INICIALIZAR O FIRESTORE AQUI, APÓS AS VARIÁVEIS DE AMBIENTE SEREM LIDAS
// E ANTES DE QUALQUER LÓGICA QUE DEPENDA DA INSTÂNCIA `db`
(0, config_1.initializeFirestore)();
// Log da configuração detectada para debug
logging_1.logger.info('🔧 Configuração do Sistema de Armazenamento:');
logging_1.logger.info(`   • Firestore Real: ${destinoConfig.useRealFirestore}`);
logging_1.logger.info(`   • Emulador: ${destinoConfig.useEmulator}`);
logging_1.logger.info(`   • Mock: ${destinoConfig.useMock}`);
logging_1.logger.info(`   • Salvar no PC: ${destinoConfig.saveToPC}`);
if (destinoConfig.pcSaveDir) {
    logging_1.logger.info(`   • Diretório PC: ${destinoConfig.pcSaveDir}`);
}
if (destinoConfig.useEmulator && process.env.FIRESTORE_EMULATOR_HOST) {
    logging_1.logger.info(`   • Host Emulador: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 * Determina automaticamente qual implementação usar baseado nas flags
 */
function createBatchManager() {
    // Hierarquia de prioridade: PC > Emulador > Firestore Real > Mock
    if (destinoConfig.saveToPC) {
        logging_1.logger.info('💾 Modo PC: Usando Mock do Firestore (dados serão salvos localmente)');
        return (0, mock_1.createBatchManager)();
    }
    if (destinoConfig.useEmulator) {
        logging_1.logger.info(`🔌 Usando Firestore EMULADOR em ${process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'}`);
        return (0, real_1.createBatchManager)(); // Real mas conectado ao emulador
    }
    if (destinoConfig.useRealFirestore) {
        logging_1.logger.info('☁️ Usando Firestore REAL (Produção)');
        return (0, real_1.createBatchManager)();
    }
    // Padrão: Mock
    logging_1.logger.info('🎭 Usando implementação MOCK do Firestore');
    return (0, mock_1.createBatchManager)();
}
/**
 * Função helper para salvar dados no Firestore de forma organizada
 * Determina automaticamente qual implementação usar baseado nas flags
 */
async function saveToFirestore(collectionPath, documentId, data, options = {}) {
    // Se estiver no modo PC, não salvar no Firestore
    if (destinoConfig.saveToPC) {
        logging_1.logger.debug(`Modo PC ativo - ignorando salvamento no Firestore de ${collectionPath}/${documentId || 'auto'}`);
        return;
    }
    // Usar implementação real para emulador e produção
    if (destinoConfig.useEmulator || destinoConfig.useRealFirestore) {
        await firestoreReal.saveToFirestore(collectionPath, documentId, data, options);
    }
    else {
        // Usar mock
        await firestoreMock.saveToFirestore(collectionPath, documentId, data, options);
    }
}
/**
 * Obtém a configuração atual do Firestore
 */
function getFirestoreConfig() {
    const config = {
        ...destinoConfig,
        environment: process.env.NODE_ENV || 'development',
        emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
        description: getConfigDescription()
    };
    return config;
}
/**
 * Retorna uma descrição legível da configuração atual
 */
function getConfigDescription() {
    if (destinoConfig.saveToPC) {
        return `Salvando no PC em: ${destinoConfig.pcSaveDir}`;
    }
    if (destinoConfig.useEmulator) {
        return `Firestore Emulador (${process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8000'})`;
    }
    if (destinoConfig.useRealFirestore) {
        return 'Firestore Real (Produção)';
    }
    return 'Mock do Firestore (Teste)';
}
// Reexportar utilitários específicos se necessário
var batch_1 = require("./batch");
Object.defineProperty(exports, "DocumentRefHelper", { enumerable: true, get: function () { return batch_1.DocumentRefHelper; } });
Object.defineProperty(exports, "AbstractBatchManager", { enumerable: true, get: function () { return batch_1.AbstractBatchManager; } });
// Reexportar funcionalidades da implementação real (para uso direto quando necessário)
var config_2 = require("./config");
Object.defineProperty(exports, "firestoreDb", { enumerable: true, get: function () { return config_2.db; } });
Object.defineProperty(exports, "firebaseAdmin", { enumerable: true, get: function () { return config_2.admin; } });
/**
 * Verifica se o sistema está configurado para salvar no PC
 */
function isSavingToPC() {
    return destinoConfig.saveToPC;
}
/**
 * Obtém o diretório configurado para salvar no PC
 */
function getPCSaveDirectory() {
    return destinoConfig.pcSaveDir;
}
//# sourceMappingURL=index.js.map