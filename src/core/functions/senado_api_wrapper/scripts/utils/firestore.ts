/**
 * Configuração e utilitários para o Firestore
 * (Implementação mock para desenvolvimento local)
 */
import { logger } from './logger';

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
  options: { merge?: boolean } = {}
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
