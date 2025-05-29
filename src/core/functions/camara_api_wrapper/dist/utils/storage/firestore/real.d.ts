import { db } from './config';
import { BatchManager as AbstractBatchManagerInterface } from './batch';
/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export declare function createBatchManager(): AbstractBatchManagerInterface;
/**
 * Função helper para salvar dados no Firestore de forma organizada
 */
export declare function saveToFirestore(collectionPath: string, documentId: string | null, data: any, options?: {
    merge?: boolean;
}): Promise<void>;
export { db };
