/**
 * @file Configuração Firebase Admin para o servidor
 */

// Ajuste o caminho do logger conforme a localização final do logger compartilhado.
// Se o logger estiver em src/shared/utils/logger.ts:
import { logger } from '../../src/shared/utils/logger';
// Se o logger for movido para backend/shared/utils/logger.ts:
// import { logger } from '../shared/utils/logger'; 
import { initializeFirebaseAdmin, getFirestoreAdminDb } from './firebase-admin-init';

/**
 * Inicializa o Firebase Admin SDK.
 * @returns A instância do Firebase Admin App.
 */
export const initializeFirebase = initializeFirebaseAdmin;

/**
 * Obtém a instância do Firestore.
 * @returns A instância do Firestore.
 */
export const getDb = getFirestoreAdminDb;

/**
 * Encerra a conexão com o Firebase Admin SDK.
 * Útil para testes ou para garantir que os recursos sejam liberados.
 */
export async function closeFirebaseConnection(): Promise<void> {
  // A lógica de fechamento agora é gerenciada internamente pelo firebase-admin-init
  // ou pode ser adicionada aqui se houver necessidade de lógica específica do app.
  // Por enquanto, apenas loga.
  logger.info('Solicitação para encerrar conexão com Firebase Admin. Gerenciamento de recursos centralizado.');
}

export default { initializeFirebase, getDb, closeFirebaseConnection };
