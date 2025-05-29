export { BatchManager } from './batch';
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 * Determina automaticamente qual implementação usar baseado nas flags
 */
export declare function createBatchManager(): import("./batch").BatchManager;
/**
 * Função helper para salvar dados no Firestore de forma organizada
 * Determina automaticamente qual implementação usar baseado nas flags
 */
export declare function saveToFirestore(collectionPath: string, documentId: string | null, data: any, options?: {
    merge?: boolean;
}): Promise<void>;
/**
 * Obtém a configuração atual do Firestore
 */
export declare function getFirestoreConfig(): {
    environment: string;
    emulatorHost: string | undefined;
    description: string;
    useRealFirestore: boolean;
    useEmulator: boolean;
    useMock: boolean;
    saveToPC: boolean;
    pcSaveDir?: string;
};
export { DocumentRefHelper, AbstractBatchManager } from './batch';
export { db as firestoreDb, admin as firebaseAdmin } from './config';
/**
 * Verifica se o sistema está configurado para salvar no PC
 */
export declare function isSavingToPC(): boolean;
/**
 * Obtém o diretório configurado para salvar no PC
 */
export declare function getPCSaveDirectory(): string | undefined;
