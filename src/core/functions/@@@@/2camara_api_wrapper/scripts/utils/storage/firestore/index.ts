/**
 * Sistema de Firestore Unificado
 *
 * Este módulo oferece uma interface unificada para o Firestore,
 * determinando automaticamente se deve usar a implementação real ou mock.
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

// Configuração de ambiente - determina qual implementação usar
// Forçando o uso do Firestore real para resolver o problema de não estar salvando no banco real
const USE_REAL_FIRESTORE = true; // process.env.NODE_ENV === 'production' || process.env.USE_REAL_FIRESTORE === 'true';

// Exportar interfaces compartilhadas
export { BatchManager } from './batch';

/**
 * Cria um novo gerenciador de lote para operações no Firestore
 * Determina automaticamente se deve usar implementação real ou mock
 */
export function createBatchManager() {
  if (USE_REAL_FIRESTORE) {
    logger.info('Usando implementação REAL do Firestore (Firebase Admin)');
    return createRealBatchManager();
  } else {
    logger.info('Usando implementação MOCK do Firestore');
    return createMockBatchManager();
  }
}

/**
 * Função helper para salvar dados no Firestore de forma organizada
 * Determina automaticamente se deve usar implementação real ou mock
 */
export async function saveToFirestore(
  collectionPath: string,
  documentId: string | null,
  data: any,
  options: { merge?: boolean } = {}
): Promise<void> {
  if (USE_REAL_FIRESTORE) {
    await firestoreReal.saveToFirestore(collectionPath, documentId, data, options);
  } else {
    await firestoreMock.saveToFirestore(collectionPath, documentId, data, options);
  }
}

/**
 * Obtém a configuração atual do Firestore
 */
export function getFirestoreConfig() {
  return {
    usingRealFirestore: USE_REAL_FIRESTORE,
    environment: process.env.NODE_ENV || 'development'
  };
}

// Reexportar utilitários específicos se necessário
export { DocumentRefHelper, AbstractBatchManager } from './batch';

// Reexportar funcionalidades da implementação real (para uso direto quando necessário)
export { db as firestoreDb, admin as firebaseAdmin } from './config';
