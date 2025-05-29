/**
 * Interface para operações em lote do Firestore
 */
import { BatchResult } from '../../../types/etl.types';
export interface BatchManager {
    set: (ref: string, data: any, options?: any) => void;
    update: (ref: string, data: any) => void;
    delete: (ref: string) => void;
    commit: () => Promise<BatchResult>;
}
/**
 * Configurações para o gerenciador de lotes
 */
export interface BatchConfig {
    maxOperations?: number;
    autoCommit?: boolean;
}
/**
 * Classe abstrata para gerenciadores de lote
 */
export declare abstract class AbstractBatchManager implements BatchManager {
    protected operationCount: number;
    protected maxOperations: number;
    protected autoCommit: boolean;
    constructor(config?: BatchConfig);
    abstract set(ref: string, data: any, options?: any): void;
    abstract update(ref: string, data: any): void;
    abstract delete(ref: string): void;
    abstract commit(): Promise<BatchResult>;
    /**
     * Verifica se deve fazer commit automático baseado no número de operações
     */
    protected checkAutoCommit(): Promise<void>;
    /**
     * Incrementa o contador de operações e verifica se deve fazer commit automático
     */
    protected incrementAndCheck(): Promise<void>;
    /**
     * Reseta o contador de operações
     */
    protected resetCounter(): void;
    /**
     * Retorna o número atual de operações pendentes
     */
    getPendingOperations(): number;
}
/**
 * Utilitários para criar referências de documentos
 */
export declare class DocumentRefHelper {
    /**
     * Valida um caminho de documento
     */
    static validatePath(path: string): void;
    /**
     * Extrai partes do caminho
     */
    static parsePath(path: string): {
        collection: string;
        document: string;
        subcollections?: string[];
    };
}
