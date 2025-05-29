import { BatchManager as AbstractBatchManagerInterface } from './batch';
/**
 * Interface que define as operações básicas do Firestore
 */
interface FirestoreMock {
    get: (collection: string, docId: string) => Promise<any>;
    set: (collection: string, docId: string, data: any) => Promise<void>;
    update: (collection: string, docId: string, data: any) => Promise<void>;
    delete: (collection: string, docId: string) => Promise<void>;
    query: (collection: string, conditions: any) => Promise<any[]>;
}
/**
 * Implementação do mock do Firestore para testes locais
 */
declare class FirestoreMockImpl implements FirestoreMock {
    private store;
    /**
     * Obtém um documento do Firestore mock
     */
    get(collection: string, docId: string): Promise<any>;
    /**
     * Salva um documento no Firestore mock
     */
    set(collection: string, docId: string, data: any): Promise<void>;
    /**
     * Atualiza um documento existente no Firestore mock
     */
    update(collection: string, docId: string, data: any): Promise<void>;
    /**
     * Deleta um documento do Firestore mock
     */
    delete(collection: string, docId: string): Promise<void>;
    /**
     * Executa uma consulta simples no Firestore mock
     * Suporta apenas condições de igualdade básicas
     */
    query(collection: string, conditions: Record<string, any>): Promise<any[]>;
}
export declare const firestoreMock: FirestoreMockImpl;
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export declare function createBatchManager(): AbstractBatchManagerInterface;
/**
 * Função helper para salvar dados no Firestore de forma organizada
 * (Implementação mock para desenvolvimento)
 */
export declare function saveToFirestore(collectionPath: string, documentId: string | null, data: any, _options?: {
    merge?: boolean;
}): Promise<void>;
export {};
