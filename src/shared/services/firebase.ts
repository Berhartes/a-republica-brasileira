import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Configuração do Firebase
// Usando variáveis de ambiente de forma compatível com Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Verificar se as configurações essenciais estão presentes
const isConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

// Inicializar o Firebase
let app;
try {
  if (!isConfigValid) {
    console.warn('Configuração do Firebase incompleta. Verifique as variáveis de ambiente.');
  }
  app = initializeApp(firebaseConfig);
  console.log('Firebase inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  // Criar uma configuração mínima para evitar erros de runtime
  app = initializeApp({
    apiKey: 'demo-key',
    authDomain: 'demo-app.firebaseapp.com',
    projectId: 'demo-app',
    storageBucket: 'demo-app.appspot.com',
    messagingSenderId: '123456789012',
    appId: '1:123456789012:web:abcdef1234567890'
  });
}

// Inicializar serviços
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Verificar se deve usar emuladores
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (useEmulators) {
  try {
    // Conectar aos emuladores
    connectFirestoreEmulator(db, '127.0.0.1', 8000);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    console.log('Conectado aos emuladores do Firebase');
  } catch (error) {
    console.error('Erro ao conectar aos emuladores do Firebase:', error);
    console.log('Usando serviços reais do Firebase como fallback');
  }
} else {
  console.log('Usando serviços reais do Firebase');
}

// Exportar serviços
export { db, auth, storage };
export default app;
