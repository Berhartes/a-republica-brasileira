/**
 * Configuração e utilitários para o Firestore
 * (Implementação real para produção usando Firebase Admin SDK)
 */
import { logger } from '../../logging';
import { getFirestoreDb, getFirebaseAdmin } from './config'; // Importar as funções
import { BatchResult } from '../../../types/etl.types'; // Importar BatchResult
import { BatchManager as AbstractBatchManagerInterface } from './batch'; // Importar a interface do batch.ts

// Obter instâncias do Firestore e Admin SDK
const db = getFirestoreDb();
const admin = getFirebaseAdmin();

// Verificar se está usando emulador ou produção
const isUsingEmulator = process.env.USE_FIRESTORE_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST !== undefined;
if (isUsingEmulator) {
  logger.info(`Usando Firestore Emulator (${process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8000'}) com Firebase Admin SDK`);
} else {
  logger.info('Usando Firestore real (produção) com Firebase Admin SDK');
}

// Classe real para o BatchManager usando Firebase Admin SDK
class RealBatchManager implements AbstractBatchManagerInterface { // Implementar a interface importada
  private batch: import('firebase-admin').firestore.WriteBatch; // Usar import type
  private operations: Array<{ type: string; ref: string; data?: any; options?: any }> = [];

  constructor() {
    this.batch = db.batch();
  }

  set(ref: string, data: any, options?: any): void {
    const docRef = this.getDocRef(ref);
    this.batch.set(docRef, data, options || {});
    this.operations.push({ type: 'set', ref, data, options });
  }

  update(ref: string, data: any): void {
    const docRef = this.getDocRef(ref);
    this.batch.update(docRef, data);
    this.operations.push({ type: 'update', ref, data });
  }

  delete(ref: string): void {
    const docRef = this.getDocRef(ref);
    this.batch.delete(docRef);
    this.operations.push({ type: 'delete', ref });
  }

  async commit(): Promise<BatchResult> { // Alterado para retornar BatchResult
    const startTime = Date.now();
    const totalOperations = this.operations.length;
    logger.info(`Realizando commit em lote com ${totalOperations} operações`);

    try {
      await this.batch.commit();
      const duration = Date.now() - startTime;
      logger.info(`Commit em lote concluído com sucesso em ${duration}ms`);

      const result: BatchResult = {
        total: totalOperations,
        processados: totalOperations,
        sucessos: totalOperations,
        falhas: 0,
        tempoOperacao: duration,
        detalhes: this.operations.map(op => ({
          id: op.ref,
          status: 'sucesso',
          erro: undefined
        }))
      };
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Erro ao realizar commit em lote:', error);

      const result: BatchResult = {
        total: totalOperations,
        processados: 0,
        sucessos: 0,
        falhas: totalOperations,
        tempoOperacao: duration,
        detalhes: this.operations.map(op => ({
          id: op.ref,
          status: 'falha',
          erro: error.message || 'Erro desconhecido'
        }))
      };
      throw result; // Lançar o BatchResult como erro
    } finally {
      // Cria novo batch e limpa as operações após o commit
      this.batch = db.batch();
      this.operations = [];
    }
  }

  private getDocRef(path: string): import('firebase-admin').firestore.DocumentReference { // Usar import type
    const parts = path.split('/');
    if (parts.length < 2 || parts.length % 2 !== 0) {
      throw new Error(`Caminho inválido: ${path}. Deve ter um número par de segmentos.`);
    }

    // Para caminhos simples como "colecao/documento"
    if (parts.length === 2) {
      return db.collection(parts[0]).doc(parts[1]);
    }

    // Para caminhos aninhados como "colecao/documento/subcolecao/subdocumento"
    let currentRef: any = db;
    for (let i = 0; i < parts.length; i += 2) {
      const collectionName = parts[i];
      const docId = parts[i + 1];

      if (i === 0) {
        currentRef = currentRef.collection(collectionName).doc(docId);
      } else {
        currentRef = currentRef.collection(collectionName).doc(docId);
      }
    }

    return currentRef;
  }
}

/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export function createBatchManager(): AbstractBatchManagerInterface {
  return new RealBatchManager();
}

/**
 * Função helper para salvar dados no Firestore de forma organizada
 */
export async function saveToFirestore(
  collectionPath: string,
  documentId: string | null,
  data: any,
  options: { merge?: boolean } = {}
): Promise<void> {
  const collectionRef = db.collection(collectionPath);
  const docRef = documentId ? collectionRef.doc(documentId) : collectionRef.doc();

  logger.info(`Salvando dados em ${collectionPath}/${documentId || docRef.id}`);

  try {
    await docRef.set(data, options);
    logger.info(`Dados salvos com sucesso em ${collectionPath}/${documentId || docRef.id}`);
  } catch (error) {
    logger.error(`Erro ao salvar dados em ${collectionPath}/${documentId || docRef.id}:`, error);
    throw error;
  }
}
