/**
 * Configuração do Firebase Admin SDK para acesso ao Firestore
 * Este arquivo configura o Firebase Admin SDK usando as credenciais de serviço
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

// Inicializar o Firebase Admin SDK se ainda não estiver inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
    logger.info('Firebase Admin SDK inicializado com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar Firebase Admin SDK:', error);
    throw error;
  }
}

// Determina se deve usar o emulador do Firestore
const USE_FIRESTORE_EMULATOR = true; // Altere para false para usar o Firestore real

// Obter instância do Firestore e configurar para ignorar propriedades indefinidas
const db = admin.firestore();

// Configurar para ignorar propriedades indefinidas e conectar ao emulador se necessário
if (USE_FIRESTORE_EMULATOR) {
  db.settings({
    host: 'localhost:8000',
    ssl: false,
    ignoreUndefinedProperties: true
  });
  logger.info('Conexão com Firestore Emulator estabelecida (localhost:8000)');
} else {
  db.settings({
    ignoreUndefinedProperties: true
  });
  logger.info('Conexão com Firestore real estabelecida (ignorando propriedades indefinidas)');
}

// Exportar a instância do Firestore e outras funções úteis
export { db, admin };

/**
 * Função para salvar um documento no Firestore
 * @param collectionPath Caminho da coleção
 * @param documentId ID do documento (opcional, se não fornecido, será gerado automaticamente)
 * @param data Dados a serem salvos
 * @param options Opções adicionais (como merge)
 */
export async function saveDocument(
  collectionPath: string,
  documentId: string | null,
  data: any,
  options: { merge?: boolean } = {}
): Promise<string> {
  try {
    // Adicionar timestamps
    const dataWithTimestamps = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Se não for uma atualização (merge), adicionar createdAt
    if (!options.merge) {
      dataWithTimestamps.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // Salvar o documento
    if (documentId) {
      // Documento com ID específico
      const docRef = db.collection(collectionPath).doc(documentId);
      await docRef.set(dataWithTimestamps, options);
      logger.info(`Documento salvo com sucesso: ${collectionPath}/${documentId}`);
      return documentId;
    } else {
      // Documento com ID automático
      const docRef = await db.collection(collectionPath).add(dataWithTimestamps);
      logger.info(`Documento salvo com sucesso: ${collectionPath}/${docRef.id}`);
      return docRef.id;
    }
  } catch (error) {
    logger.error(`Erro ao salvar documento em ${collectionPath}:`, error);
    throw error;
  }
}

/**
 * Classe para gerenciar operações em lote no Firestore
 */
export class FirestoreBatchManager {
  private batch: admin.firestore.WriteBatch;
  private operationCount: number = 0;
  private readonly MAX_OPERATIONS = 500; // Limite de operações por lote

  constructor() {
    this.batch = db.batch();
  }

  /**
   * Adiciona uma operação de set (criar/substituir) ao lote
   */
  set(collectionPath: string, documentId: string, data: any, options?: admin.firestore.SetOptions): void {
    const docRef = db.collection(collectionPath).doc(documentId);
    this.batch.set(docRef, data, options || {});
    this.operationCount++;

    // Se atingir o limite, commit automaticamente e criar novo lote
    if (this.operationCount >= this.MAX_OPERATIONS) {
      this.commitAndReset();
    }
  }

  /**
   * Adiciona uma operação de update (atualizar) ao lote
   */
  update(collectionPath: string, documentId: string, data: any): void {
    const docRef = db.collection(collectionPath).doc(documentId);
    this.batch.update(docRef, data);
    this.operationCount++;

    // Se atingir o limite, commit automaticamente e criar novo lote
    if (this.operationCount >= this.MAX_OPERATIONS) {
      this.commitAndReset();
    }
  }

  /**
   * Adiciona uma operação de delete (excluir) ao lote
   */
  delete(collectionPath: string, documentId: string): void {
    const docRef = db.collection(collectionPath).doc(documentId);
    this.batch.delete(docRef);
    this.operationCount++;

    // Se atingir o limite, commit automaticamente e criar novo lote
    if (this.operationCount >= this.MAX_OPERATIONS) {
      this.commitAndReset();
    }
  }

  /**
   * Executa o lote atual e cria um novo lote
   */
  private async commitAndReset(): Promise<void> {
    if (this.operationCount > 0) {
      try {
        await this.batch.commit();
        logger.info(`Lote com ${this.operationCount} operações concluído com sucesso`);
      } catch (error) {
        logger.error(`Erro ao executar lote com ${this.operationCount} operações:`, error);
        throw error;
      }

      // Resetar o lote e o contador
      this.batch = db.batch();
      this.operationCount = 0;
    }
  }

  /**
   * Executa todas as operações pendentes no lote
   */
  async commit(): Promise<void> {
    await this.commitAndReset();
  }
}

/**
 * Cria um novo gerenciador de lote para operações no Firestore
 */
export function createBatchManager(): FirestoreBatchManager {
  return new FirestoreBatchManager();
}
