/**
 * Configuração do Firebase Admin SDK para acesso ao Firestore
 * Este arquivo configura o Firebase Admin SDK usando as credenciais de serviço
 */
import { logger } from './logger';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Caminho para o arquivo de credenciais de serviço
const serviceAccountPath = path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');

// Verificar se o arquivo de credenciais existe
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
}

// Inicializar o Firebase Admin SDK se ainda não estiver inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
    logger.info('Firebase Admin SDK inicializado com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar Firebase Admin SDK:', error);
    throw error;
  }
}

// Determina se deve usar o emulador do Firestore
const USE_FIRESTORE_EMULATOR = false; // Altere para true para usar o emulador local

// Obter instância do Firestore e configurar para ignorar propriedades indefinidas
const db = admin.firestore();

// Configurar para ignorar propriedades indefinidas e conectar ao emulador se necessário
if (USE_FIRESTORE_EMULATOR) {
  db.settings({
    host: 'localhost:8000',
    ssl: false,
    ignoreUndefinedProperties: true
  });
  logger.info('Conexão com Firestore Emulator estabelecida (localhost:8000)');
} else {
  db.settings({
    ignoreUndefinedProperties: true
  });
  logger.info('Conexão com Firestore real estabelecida (ignorando propriedades indefinidas)');
}

// Exportar a instância do Firestore
export { db };
