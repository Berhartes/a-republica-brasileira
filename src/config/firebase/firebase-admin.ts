/**
 * @file Configuração Firebase Admin para o servidor
 */

import { logger } from '@/shared/utils/logger';
import admin from 'firebase-admin';
import { applicationDefault, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Variável para armazenar a instância singleton
let firebaseApp: admin.app.App | null = null;
let firestoreDb: admin.firestore.Firestore | null = null;

/**
 * Inicializa o Firebase Admin
 * @returns Instância do Firebase Admin
 */
export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    logger.debug('Firebase admin já inicializado, retornando instância existente');
    return firebaseApp;
  }

  try {
    // Usa credential default do ambiente
    const appConfig = {
      credential: applicationDefault(),
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    };

    firebaseApp = initializeAdminApp(appConfig) as admin.app.App;
    logger.info('Firebase admin inicializado com sucesso');
    
    return firebaseApp as admin.app.App;
  } catch (error) {
    logger.error('Erro ao inicializar o Firebase Admin:', error);
    throw error;
  }
}

/**
 * Obtém a instância do Firestore
 * @returns Instância do Firestore
 */
export function getDb(): admin.firestore.Firestore {
  if (firestoreDb) {
    return firestoreDb;
  }

  if (!firebaseApp) {
    initializeFirebase();
  }

  firestoreDb = getFirestore();
  
  // Configurações adicionais do Firestore
  if (import.meta.env.DEV) {
    firestoreDb.settings({
      ignoreUndefinedProperties: true,
    });
  }

  return firestoreDb;
}

/**
 * Encerra a conexão com o Firebase Admin
 */
export async function closeFirebaseConnection(): Promise<void> {
  if (firebaseApp) {
    try {
      await firebaseApp.delete();
      firestoreDb = null;
      firebaseApp = null;
      logger.info('Conexão com Firebase encerrada');
    } catch (error) {
      logger.error('Erro ao encerrar conexão com Firebase:', error);
      throw error;
    }
  }
}

export default { initializeFirebase, getDb, closeFirebaseConnection };
