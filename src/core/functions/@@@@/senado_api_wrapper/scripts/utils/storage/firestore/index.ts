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
import { logger } from '../../logging';
import * as firestoreMock from './mock';
import * as firestoreReal from './real';
import { createBatchManager as createRealBatchManager } from './real';
import { createBatchManager as createMockBatchManager } from './mock';
import { getDestinoConfig } from '../../../config/environment.config';

// Obter configuração de destino
const destinoConfig = getDestinoConfig();

// Log da configuração detectada para debug
logger.info('🔧 Configuração do Sistema de Armazenamento:');
logger.info(`   • Firestore Real: ${destinoConfig.useRealFirestore}`);
logger.info(`   • Emulador: ${destinoConfig.useEmulator}`);
logger.info(`   • Mock: ${destinoConfig.useMock}`);
logger.info(`   • Salvar no PC: ${destinoConfig.saveToPC}`);
if (destinoConfig.pcSaveDir) {
  logger.info(`   • Diretório PC: ${destinoConfig.pcSaveDir}`);
}
if (destinoConfig.useEmulator && process.env.FIRESTORE_EMULATOR_HOST) {
  logger.info(`   • Host Emulador: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

// Exportar interfaces compartilhadas
export { BatchManager } from './batch';

/**
 * Cria um novo gerenciador de lote para operações no Firestore
 * Determina automaticamente qual implementação usar baseado nas flags
 */
export function createBatchManager() {
  // Hierarquia de prioridade: PC > Emulador > Firestore Real > Mock
  
  if (destinoConfig.saveToPC) {
    logger.info('💾 Modo PC: Usando Mock do Firestore (dados serão salvos localmente)');
    return createMockBatchManager();
  }
  
  if (destinoConfig.useEmulator) {
    logger.info(`🔌 Usando Firestore EMULADOR em ${process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'}`);
    return createRealBatchManager(); // Real mas conectado ao emulador
  }
  
  if (destinoConfig.useRealFirestore) {
    logger.info('☁️ Usando Firestore REAL (Produção)');
    return createRealBatchManager();
  }
  
  // Padrão: Mock
  logger.info('🎭 Usando implementação MOCK do Firestore');
  return createMockBatchManager();
}

/**
 * Função helper para salvar dados no Firestore de forma organizada
 * Determina automaticamente qual implementação usar baseado nas flags
 */
export async function saveToFirestore(
  collectionPath: string,
  documentId: string | null,
  data: any,
  options: { merge?: boolean } = {}
): Promise<void> {
  // Se estiver no modo PC, não salvar no Firestore
  if (destinoConfig.saveToPC) {
    logger.debug(`Modo PC ativo - ignorando salvamento no Firestore de ${collectionPath}/${documentId || 'auto'}`);
    return;
  }
  
  // Usar implementação real para emulador e produção
  if (destinoConfig.useEmulator || destinoConfig.useRealFirestore) {
    await firestoreReal.saveToFirestore(collectionPath, documentId, data, options);
  } else {
    // Usar mock
    await firestoreMock.saveToFirestore(collectionPath, documentId, data, options);
  }
}

/**
 * Obtém a configuração atual do Firestore
 */
export function getFirestoreConfig() {
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
function getConfigDescription(): string {
  if (destinoConfig.saveToPC) {
    return `Salvando no PC em: ${destinoConfig.pcSaveDir}`;
  }
  if (destinoConfig.useEmulator) {
    return `Firestore Emulador (${process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'})`;
  }
  if (destinoConfig.useRealFirestore) {
    return 'Firestore Real (Produção)';
  }
  return 'Mock do Firestore (Teste)';
}

// Reexportar utilitários específicos se necessário
export { DocumentRefHelper, AbstractBatchManager } from './batch';

// Reexportar funcionalidades da implementação real (para uso direto quando necessário)
export { db as firestoreDb, admin as firebaseAdmin } from './config';

/**
 * Verifica se o sistema está configurado para salvar no PC
 */
export function isSavingToPC(): boolean {
  return destinoConfig.saveToPC;
}

/**
 * Obtém o diretório configurado para salvar no PC
 */
export function getPCSaveDirectory(): string | undefined {
  return destinoConfig.pcSaveDir;
}
