/**
 * Configuração e utilitários para o Firestore
 * (Implementação real para produção usando Firebase Admin SDK)
 */
import { logger } from './logger';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Caminho para o arquivo de credenciais de serviço
const serviceAccountPath = path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');

// Verificar se o arquivo de credenciais existe
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
}

// Inicializar o Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  logger.info('Firebase Admin SDK inicializado com sucesso');
}

// Obter instância do Firestore
const db = admin.firestore();
logger.info('Usando Firestore real (produção) com Firebase Admin SDK');

// Interface para operações em lote do Firestore
export interface BatchManager {
  set: (ref: string, data: any, options?: any) => void;
  update: (ref: string, data: any) => void;
  delete: (ref: string) => void;
  commit: () => Promise<void>;
}

// Classe real para o BatchManager
class RealBatchManager implements BatchManager {
  private batch = writeBatch(db);
  private operations: Array<{ type: string; ref: string; data?: any; options?: any }> = [];

  set(ref: string, data: any, options?: any): void {
    const docRef = this.getDocRef(ref);
    this.batch.set(docRef, data, options);
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

  async commit(): Promise<void> {
    logger.info(`Realizando commit em lote com ${this.operations.length} operações`);

    try {
      await this.batch.commit();
      logger.info('Commit em lote concluído com sucesso');
    } catch (error) {
      logger.error('Erro ao realizar commit em lote:', error);
      throw error;
    } finally {
      // Limpa as operações após o commit
      this.operations = [];
    }
  }

  private getDocRef(path: string): any {
    const parts = path.split('/');
    if (parts.length % 2 !== 0) {
      throw new Error(`Caminho inválido: ${path}. Deve ter um número par de segmentos.`);
    }

    let currentRef: any = db;
    for (let i = 0; i < parts.length; i += 2) {
      const collectionName = parts[i];
      const docId = parts[i + 1];

      if (i === 0) {
        currentRef = collection(db, collectionName);
      } else {
        currentRef = collection(currentRef, collectionName);
      }

      currentRef = doc(currentRef, docId);
    }

    return currentRef;
  }
}

/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export function createBatchManager(): BatchManager {
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
  const collectionRef = collection(db, collectionPath);
  const docRef = documentId
    ? doc(collectionRef, documentId)
    : doc(collectionRef); // Gera ID automático

  logger.info(`Salvando dados em ${collectionPath}/${documentId || docRef.id}`);

  try {
    await setDoc(docRef, data, options);
    logger.info(`Dados salvos com sucesso em ${collectionPath}/${documentId || docRef.id}`);
  } catch (error) {
    logger.error(`Erro ao salvar dados em ${collectionPath}/${documentId || docRef.id}:`, error);
    throw error;
  }
}

// Exporta a instância do Firestore para uso direto
export { db };
