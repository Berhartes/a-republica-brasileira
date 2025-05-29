"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractBatchManager = exports.DocumentRefHelper = void 0;
exports.createBatchManager = createBatchManager;
exports.saveToFirestore = saveToFirestore;
exports.getFirestoreConfig = getFirestoreConfig;
exports.isSavingToPC = isSavingToPC;
exports.getPCSaveDirectory = getPCSaveDirectory;
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
const config_1 = require("./config");
const environment_config_1 = require("../../../config/environment.config");
// Obter configuração de destino
const destinoConfig = (0, environment_config_1.getDestinoConfig)();
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
 * Cria um novo gerenciador de lote para operações no Firestore.
 * Determina automaticamente qual implementação usar baseado nas flags.
 */
function createBatchManager() {
    // Hierarquia de prioridade: PC > Emulador > Firestore Real > Mock
    // Nota: A lógica de mock para "salvar no PC" deve ser tratada em outro lugar,
    // pois este módulo foca na interação com o Firestore (real ou emulador).
    // Se saveToPC for true, a função saveToFirestore abaixo já irá ignorar.
    if (destinoConfig.useEmulator) {
        logging_1.logger.info(`🔌 Usando Firestore EMULADOR em ${process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8000'}`);
        return (0, config_1.createBatchManager)(); // Usa o BatchManager configurado para o emulador
    }
    if (destinoConfig.useRealFirestore) {
        logging_1.logger.info('☁️ Usando Firestore REAL (Produção)');
        return (0, config_1.createBatchManager)(); // Usa o BatchManager configurado para produção
    }
    // Se nenhuma flag de Firestore real ou emulador for definida,
    // e não for para salvar no PC, então usa o mock.
    // Isso é um fallback para ambientes de desenvolvimento sem emulador/real.
    logging_1.logger.info('🎭 Usando implementação MOCK do Firestore (apenas para simulação)');
    // TODO: Implementar um mock de BatchManager se necessário para testes unitários
    // Por enquanto, retorna um BatchManager que não faz nada ou loga.
    // Para este cenário, o saveDocument abaixo já lida com o mock.
    return (0, config_1.createBatchManager)(); // Retorna o real, mas as operações serão ignoradas se não houver conexão.
}
/**
 * Função helper para salvar dados no Firestore de forma organizada.
 * Determina automaticamente qual implementação usar baseado nas flags.
 */
async function saveToFirestore(collectionPath, documentId, data, options = {}) {
    // Se estiver no modo PC, não salvar no Firestore
    if (destinoConfig.saveToPC) {
        logging_1.logger.debug(`Modo PC ativo - ignorando salvamento no Firestore de ${collectionPath}/${documentId || 'auto'}`);
        return;
    }
    // Usar a função saveDocument do módulo de configuração centralizado
    // que já lida com a conexão ao emulador ou Firestore real.
    await (0, config_1.saveDocument)(collectionPath, documentId, data, options);
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
// As exportações de db e admin agora vêm diretamente do módulo centralizado
// src/shared/services/firebase-admin-init.ts, e são reexportadas por ./config.ts
// Não é necessário reexportá-las aqui novamente.
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