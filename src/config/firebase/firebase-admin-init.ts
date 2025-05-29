import * as admin from 'firebase-admin';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Determina o diretório base do projeto para encontrar o service account
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../'); // Ajuste conforme a estrutura real

let firebaseAdminApp: admin.app.App | null = null;
let firestoreAdminDb: admin.firestore.Firestore | null = null;

export function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  try {
    const serviceAccountPath = path.join(projectRoot, 'firebase-import.json');
    const serviceAccount = require(serviceAccountPath); // Usar require para JSON

    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK inicializado com sucesso.');
    return firebaseAdminApp;
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
    process.exit(1);
  }
}

export function getFirestoreAdminDb(): admin.firestore.Firestore {
  if (firestoreAdminDb) {
    return firestoreAdminDb;
  }

  if (!firebaseAdminApp) {
    initializeFirebaseAdmin();
  }

  firestoreAdminDb = admin.firestore();

  // Configurações para o emulador ou produção
  const useEmulator = process.env.USE_FIRESTORE_EMULATOR === 'true';
  if (useEmulator) {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8000';
    firestoreAdminDb.settings({
      host: emulatorHost,
      ssl: false,
      experimentalForceLongPolling: true,
    });
    console.log(`Firestore Admin SDK conectado ao emulador em: ${emulatorHost}`);
  } else {
    firestoreAdminDb.settings({
      ignoreUndefinedProperties: true
    });
    console.log('Firestore Admin SDK configurado para produção.');
  }

  return firestoreAdminDb;
}

export { admin }; // Reexporta o módulo admin para tipos e outras funcionalidades
