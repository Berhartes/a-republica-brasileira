import * as admin from 'firebase-admin';
declare let db: admin.firestore.Firestore;
declare let firebaseAdmin: typeof admin;
/**
 * Inicializa o Firebase Admin SDK e configura o Firestore
 * Deve ser chamado APÓS a configuração das variáveis de ambiente
 */
export declare function initializeFirestore(): void;
export { db, firebaseAdmin as admin };
/**
 * Função para salvar um documento no Firestore
 * @param collectionPath Caminho da coleção
 * @param documentId ID do documento (opcional, se não fornecido, será gerado automaticamente)
 * @param data Dados a serem salvos
 * @param options Opções adicionais (como merge)
 */
export declare function saveDocument(collectionPath: string, documentId: string | null, data: any, options?: {
    merge?: boolean;
}): Promise<string>;
/**
 * Classe para gerenciar operações em lote no Firestore
 */
export declare class FirestoreBatchManager {
    private batch;
    private operationCount;
    private readonly MAX_OPERATIONS;
    constructor();
    /**
     * Adiciona uma operação de set (criar/substituir) ao lote
     */
    set(collectionPath: string, documentId: string, data: any, options?: admin.firestore.SetOptions): void;
    /**
     * Adiciona uma operação de update (atualizar) ao lote
     */
    update(collectionPath: string, documentId: string, data: any): void;
    /**
     * Adiciona uma operação de delete (excluir) ao lote
     */
    delete(collectionPath: string, documentId: string): void;
    /**
     * Executa o lote atual e cria um novo lote
     */
    private commitAndReset;
    /**
     * Executa todas as operações pendentes no lote
     */
    commit(): Promise<void>;
}
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export declare function createBatchManager(): FirestoreBatchManager;
