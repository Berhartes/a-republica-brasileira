/**
 * Configuração e utilitários para o Firestore
 * Exporta a implementação real (Firebase Admin) ou mock dependendo do ambiente
 */
import { logger } from './logger';
import * as firestoreMock from './firestore_mock';
import * as firebaseAdmin from './firebase-admin-config';

// Determina se deve usar a implementação real ou mock
const USE_REAL_FIRESTORE = true; // Altere para false para usar o mock
// Nota: A configuração do emulador é feita no arquivo firebase-admin-config.ts

// Exporta as interfaces e funções da implementação escolhida
export interface BatchManager {
  set: (ref: string, data: any, options?: any) => void;
  update: (ref: string, data: any) => void;
  delete: (ref: string) => void;
  commit: () => Promise<void>;
}

/**
 * Adaptador para o BatchManager do Firebase Admin
 */
class FirebaseAdminBatchAdapter implements BatchManager {
  private batchManager: firebaseAdmin.FirestoreBatchManager;

  constructor() {
    this.batchManager = firebaseAdmin.createBatchManager();
  }

  set(ref: string, data: any, options?: any): void {
    const [collectionPath, documentId] = this.parseRef(ref);
    this.batchManager.set(collectionPath, documentId, data, options);
  }

  update(ref: string, data: any): void {
    const [collectionPath, documentId] = this.parseRef(ref);
    this.batchManager.update(collectionPath, documentId, data);
  }

  delete(ref: string): void {
    const [collectionPath, documentId] = this.parseRef(ref);
    this.batchManager.delete(collectionPath, documentId);
  }

  async commit(): Promise<void> {
    await this.batchManager.commit();
  }

  private parseRef(ref: string): [string, string] {
    const parts = ref.split('/');
    if (parts.length < 2 || parts.length % 2 !== 0) {
      throw new Error(`Referência inválida: ${ref}. Deve ter um número par de segmentos.`);
    }

    // Para caminhos simples como "colecao/documento"
    if (parts.length === 2) {
      return [parts[0], parts[1]];
    }

    // Para caminhos aninhados, precisamos adaptar para o formato do Firebase Admin
    // Exemplo: "colecao/documento/subcolecao/subdocumento" -> ["colecao/documento/subcolecao", "subdocumento"]
    const documentId = parts.pop() || '';
    const collectionPath = parts.join('/');
    return [collectionPath, documentId];
  }
}

/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export function createBatchManager(): BatchManager {
  if (USE_REAL_FIRESTORE) {
    logger.info('Usando implementação REAL do Firestore (Firebase Admin)');
    return new FirebaseAdminBatchAdapter();
  } else {
    logger.info('Usando implementação MOCK do Firestore');
    return firestoreMock.createBatchManager();
  }
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
  if (USE_REAL_FIRESTORE) {
    await firebaseAdmin.saveDocument(collectionPath, documentId, data, options);
  } else {
    await firestoreMock.saveToFirestore(collectionPath, documentId, data, options);
  }
}
