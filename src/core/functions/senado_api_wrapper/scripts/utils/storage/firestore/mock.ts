/**
 * Mock do Firestore para desenvolvimento local
 */
import { logger } from '../../logging';

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
class FirestoreMockImpl implements FirestoreMock {
  private store: Record<string, Record<string, any>> = {};

  /**
   * Obtém um documento do Firestore mock
   */
  async get(collection: string, docId: string): Promise<any> {
    logger.debug(`[FirestoreMock] GET ${collection}/${docId}`);

    // Simular atraso de rede
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!this.store[collection]) {
      return null;
    }

    return this.store[collection][docId] || null;
  }

  /**
   * Salva um documento no Firestore mock
   */
  async set(collection: string, docId: string, data: any): Promise<void> {
    logger.debug(`[FirestoreMock] SET ${collection}/${docId}`);

    // Simular atraso de rede
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!this.store[collection]) {
      this.store[collection] = {};
    }

    this.store[collection][docId] = {
      ...data,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString()
    };
  }

  /**
   * Atualiza um documento existente no Firestore mock
   */
  async update(collection: string, docId: string, data: any): Promise<void> {
    logger.debug(`[FirestoreMock] UPDATE ${collection}/${docId}`);

    // Simular atraso de rede
    await new Promise(resolve => setTimeout(resolve, 75));

    if (!this.store[collection] || !this.store[collection][docId]) {
      throw new Error(`Documento ${collection}/${docId} não encontrado para atualização`);
    }

    this.store[collection][docId] = {
      ...this.store[collection][docId],
      ...data,
      _updatedAt: new Date().toISOString()
    };
  }

  /**
   * Deleta um documento do Firestore mock
   */
  async delete(collection: string, docId: string): Promise<void> {
    logger.debug(`[FirestoreMock] DELETE ${collection}/${docId}`);

    // Simular atraso de rede
    await new Promise(resolve => setTimeout(resolve, 75));

    if (this.store[collection]) {
      delete this.store[collection][docId];
    }
  }

  /**
   * Executa uma consulta simples no Firestore mock
   * Suporta apenas condições de igualdade básicas
   */
  async query(collection: string, conditions: Record<string, any>): Promise<any[]> {
    logger.debug(`[FirestoreMock] QUERY ${collection} with conditions:`, conditions);

    // Simular atraso de rede
    await new Promise(resolve => setTimeout(resolve, 150));

    if (!this.store[collection]) {
      return [];
    }

    const results = Object.values(this.store[collection]).filter(doc => {
      return Object.entries(conditions).every(([key, value]) => doc[key] === value);
    });

    return results;
  }
}

// Exporta uma instância única do FirestoreMock
export const firestoreMock = new FirestoreMockImpl();

// Interface para operações em lote do Firestore
export interface BatchManager {
  set: (ref: string, data: any, options?: any) => void;
  update: (ref: string, data: any) => void;
  delete: (ref: string) => void;
  commit: () => Promise<void>;
}

// Classe mock para o BatchManager
class MockBatchManager implements BatchManager {
  private operations: Array<{ type: string; ref: string; data?: any; options?: any }> = [];

  set(ref: string, data: any, options?: any): void {
    this.operations.push({ type: 'set', ref, data, options });
  }

  update(ref: string, data: any): void {
    this.operations.push({ type: 'update', ref, data });
  }

  delete(ref: string): void {
    this.operations.push({ type: 'delete', ref });
  }

  async commit(): Promise<void> {
    logger.info(`Realizando commit em lote com ${this.operations.length} operações`);
    // No ambiente real, aqui executaríamos as operações no Firestore
    // Na versão mock, apenas logamos as operações

    logger.debug('Operações do lote:', this.operations);

    // Simula um atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.info('Commit em lote concluído com sucesso (mock)');

    // Limpa as operações após o commit
    this.operations = [];
  }
}

/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export function createBatchManager(): BatchManager {
  return new MockBatchManager();
}

/**
 * Função helper para salvar dados no Firestore de forma organizada
 * (Implementação mock para desenvolvimento)
 */
export async function saveToFirestore(
  collectionPath: string,
  documentId: string | null,
  data: any,
  _options: { merge?: boolean } = {}
): Promise<void> {
  const documentPath = documentId
    ? `${collectionPath}/${documentId}`
    : `${collectionPath}/${Date.now().toString()}`; // Gera ID baseado no timestamp

  logger.info(`Salvando dados em ${documentPath} (mock)`);
  logger.debug('Dados:', data);

  // Simula um atraso para parecer mais realista
  await new Promise(resolve => setTimeout(resolve, 300));

  logger.info(`Dados salvos com sucesso em ${documentPath} (mock)`);
}
