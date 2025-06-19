/**
 * Configurações de ambiente para o sistema de armazenamento do Senado.
 * Este arquivo define as flags para determinar qual implementação do Firestore usar.
 */

export function getDestinoConfig() {
  return {
    useRealFirestore: true, // Define para usar o Firestore real
    useEmulator: false,      // Desativa o uso do emulador
    useMock: false,          // Desativa o uso do mock
    saveToPC: false,         // Desativa o salvamento local no PC
    pcSaveDir: undefined,    // Garante que o diretório de salvamento no PC não esteja definido
  };
}

/**
 * Configurações específicas do Firestore.
 * Pode ser estendido para incluir projectId, etc., se necessário.
 */
export function getFirestoreConfig() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID, // Pode ser lido de variáveis de ambiente
    credentials: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH, // Pode ser lido de variáveis de ambiente
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
  };
}
