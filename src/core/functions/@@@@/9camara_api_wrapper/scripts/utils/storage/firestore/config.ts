/**
 * Configuração do Firebase Admin SDK para acesso ao Firestore
 * Este arquivo configura o Firebase Admin SDK usando as credenciais de serviço
 */
import { logger } from '../../logging';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import { parseFirestorePath } from './helpers'; // Importar parseFirestorePath

// Variáveis globais para o SDK do Admin e instância do Firestore
let db: admin.firestore.Firestore;
let firebaseAdminInstance: typeof admin; // Renomeado para evitar conflito com o 'admin' importado

/**
 * Inicializa o Firebase Admin SDK e configura o Firestore.
 * Esta função deve ser chamada uma vez no início do script, após a configuração
 * das variáveis de ambiente (especialmente FIRESTORE_EMULATOR_HOST).
 */
export function initializeFirestore(): void {
  // Evitar reinicialização se já estiver configurado
  if (firebaseAdminInstance && firebaseAdminInstance.apps.length) {
    logger.debug('Firebase Admin SDK já inicializado para Camara API Wrapper.');
    // Garante que 'db' está definido se o SDK já foi inicializado
    if (!db) {
      db = firebaseAdminInstance.firestore();
    }
    return;
  }

  // Carregar configurações de ambiente dinamicamente para obter projectId e serviceAccountKey
  // Isso é útil se essas configurações não forem definidas como variáveis de ambiente diretas.
  const environmentConfigModule = require('../../../config/environment.config');
  const firestoreConfig = environmentConfigModule.getFirestoreConfig();

  const appOptions: admin.AppOptions = {
    projectId: process.env.GCLOUD_PROJECT || firestoreConfig.projectId || 'demo-project-camara',
  };

  // Se FIRESTORE_EMULATOR_HOST NÃO estiver definido, configurar para usar o Firestore real com credenciais.
  // Caso contrário, o SDK usará automaticamente o emulador se FIRESTORE_EMULATOR_HOST estiver definido.
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    const serviceAccountKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                                  firestoreConfig.credentials || 
                                  path.resolve(process.cwd(), 'config', 'serviceAccountKey-camara.json'); // Caminho padrão
    
    if (fs.existsSync(serviceAccountKeyPath)) {
      appOptions.credential = admin.credential.cert(serviceAccountKeyPath);
      logger.info(`Usando Firestore REAL para Camara API. Credenciais: ${serviceAccountKeyPath}`);
    } else {
      logger.warn(`Arquivo de credenciais (${serviceAccountKeyPath}) não encontrado. Tentando inicializar sem credenciais explícitas (pode funcionar em ambientes GCP).`);
      // Permite que o SDK tente usar credenciais do ambiente (ex: em Cloud Functions)
    }
  } else {
    logger.info(`Usando Firestore EMULATOR para Camara API em: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    // Não são necessárias credenciais para o emulador; o SDK detecta FIRESTORE_EMULATOR_HOST.
  }

  try {
    // Inicializa o app apenas se não houver apps existentes.
    // Isso é importante para evitar erros de "app já existe".
    if (!admin.apps.length) {
      admin.initializeApp(appOptions);
    } else {
      // Se já existe um app, tenta usá-lo.
      // Isso pode acontecer se outro módulo já inicializou o admin.
      // Idealmente, a inicialização deve ser centralizada, mas isso oferece alguma robustez.
      logger.warn('Firebase Admin SDK já possui apps inicializados. Tentando usar o app default.');
    }
    firebaseAdminInstance = admin; // Armazena a instância do SDK do admin
    db = firebaseAdminInstance.firestore(); // Obtém a instância do Firestore

    // Configurações do Firestore (aplicável tanto para real quanto para emulador)
    db.settings({
      ignoreUndefinedProperties: true, // Boa prática para evitar erros com campos undefined
    });

    if (process.env.FIRESTORE_EMULATOR_HOST) {
        // Apenas para log, o SDK já usa o emulador se a variável de ambiente estiver definida.
        logger.debug(`Firestore (Camara) configurado para usar o emulador em ${process.env.FIRESTORE_EMULATOR_HOST}. SSL desabilitado implicitamente pelo SDK para emuladores.`);
    }

    logger.info('Firebase Admin SDK (Camara) inicializado e instância do Firestore obtida.');

  } catch (error) {
    logger.error('Erro CRÍTICO ao inicializar Firebase Admin SDK para Camara API Wrapper:', error);
    // Relançar o erro para que o script principal saiba que a inicialização falhou.
    throw error;
  }
}

// Exportar a instância do Firestore e a instância do SDK do admin
// É importante que initializeFirestore() seja chamado antes de usar 'db' ou 'adminSdk'.
export { db, firebaseAdminInstance as admin };

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
// Função para estimar o tamanho de um objeto em bytes
function getObjectSizeInBytes(obj: any): number {
  try {
    const jsonString = JSON.stringify(obj);
    return Buffer.byteLength(jsonString, 'utf8');
  } catch (error) {
    logger.warn('Não foi possível calcular o tamanho do objeto:', error);
    return 0; // Retorna 0 em caso de erro para não bloquear o processo
  }
}

export class FirestoreBatchManager {
  private batch: admin.firestore.WriteBatch;
  private operationCount: number = 0;
  private readonly MAX_OPERATIONS = 250; // Limite de operações por lote REDUZIDO
  private readonly MAX_DOC_SIZE_BYTES = 1 * 1024 * 1024 * 0.95; // 1MB (com margem de 5%)

  constructor() {
    if (!db) {
      logger.error('CRITICAL: Instância DB do Firestore não inicializada antes de criar FirestoreBatchManager.');
      throw new Error('Firestore DB não inicializado.');
    }
    this.batch = db.batch();
  }

  /**
   * Adiciona uma operação de set (criar/substituir) ao lote
   */
  async set(collectionPath: string, documentId: string, data: any, options?: admin.firestore.SetOptions): Promise<void> {
    const { collectionPath: parsedCollectionPath, documentId: parsedDocumentId } = parseFirestorePath(collectionPath, documentId);
    const docSize = getObjectSizeInBytes(data);
    if (docSize > this.MAX_DOC_SIZE_BYTES) {
      logger.warn(`Documento ${parsedCollectionPath}/${parsedDocumentId} (SET) excede o tamanho máximo (${(docSize / (1024*1024)).toFixed(2)}MB > ${(this.MAX_DOC_SIZE_BYTES / (1024*1024)).toFixed(2)}MB). Pulando adição ao lote.`);
      return; 
    }
    logger.debug(`Adicionando SET para ${parsedCollectionPath}/${parsedDocumentId}, tamanho: ${(docSize / 1024).toFixed(2)}KB`);
    const docRef = db.collection(parsedCollectionPath).doc(parsedDocumentId);
    this.batch.set(docRef, data, options || {});
    this.operationCount++;

    if (this.operationCount >= this.MAX_OPERATIONS) {
      await this.commitAndReset(); // AGUARDAR o commit do lote
    }
  }

  /**
   * Adiciona uma operação de update (atualizar) ao lote
   */
  async update(collectionPath: string, documentId: string, data: any): Promise<void> {
    const { collectionPath: parsedCollectionPath, documentId: parsedDocumentId } = parseFirestorePath(collectionPath, documentId);
    const docSize = getObjectSizeInBytes(data);
    if (docSize > this.MAX_DOC_SIZE_BYTES) {
      logger.warn(`Documento ${parsedCollectionPath}/${parsedDocumentId} (UPDATE) excede o tamanho máximo (${(docSize / (1024*1024)).toFixed(2)}MB > ${(this.MAX_DOC_SIZE_BYTES / (1024*1024)).toFixed(2)}MB). Pulando adição ao lote.`);
      return;
    }
    logger.debug(`Adicionando UPDATE para ${parsedCollectionPath}/${parsedDocumentId}, tamanho: ${(docSize / 1024).toFixed(2)}KB`);
    const docRef = db.collection(parsedCollectionPath).doc(parsedDocumentId);
    this.batch.update(docRef, data);
    this.operationCount++;

    if (this.operationCount >= this.MAX_OPERATIONS) {
      await this.commitAndReset(); // AGUARDAR o commit do lote
    }
  }

  /**
   * Adiciona uma operação de delete (excluir) ao lote
   */
  async delete(collectionPath: string, documentId: string): Promise<void> {
    const { collectionPath: parsedCollectionPath, documentId: parsedDocumentId } = parseFirestorePath(collectionPath, documentId);
    logger.debug(`Adicionando DELETE para ${parsedCollectionPath}/${parsedDocumentId}`);
    const docRef = db.collection(parsedCollectionPath).doc(parsedDocumentId);
    this.batch.delete(docRef);
    this.operationCount++;

    if (this.operationCount >= this.MAX_OPERATIONS) {
      await this.commitAndReset(); // AGUARDAR o commit do lote
    }
  }

  /**
   * Executa o lote atual e cria um novo lote
   */
  private async commitAndReset(): Promise<void> {
    if (this.operationCount > 0) {
      logger.info(`Realizando commit em lote com ${this.operationCount} operações...`);
      const currentOperations = this.operationCount; // Salva o número de operações antes de resetar
      try {
        // Adicionar timeout para evitar travamento
        const commitPromise = this.batch.commit();
        const timeoutPromise = new Promise((_, reject) => {
          // eslint-disable-next-line no-undef
          const timer = setTimeout(() => {
            reject(new Error(`Timeout de 30s no commit do lote com ${currentOperations} operações.`));
          }, 30000); // 30 segundos
          // @ts-ignore
          if (commitPromise.finally) { // Para limpar o timer se o commit terminar antes
            // @ts-ignore
            commitPromise.finally(() => clearTimeout(timer));
          }
        });
        
        await Promise.race([commitPromise, timeoutPromise]);
        logger.info(`✅ Lote com ${currentOperations} operações concluído com sucesso.`);
      } catch (error: any) {
        logger.error(`❌ Erro ao executar lote com ${currentOperations} operações:`, error.message || error);
        // Não relançar o erro aqui para permitir que outros lotes tentem,
        // mas o erro já foi logado. O processador principal deve capturar o estado geral.
        // Se for um erro crítico que impede a continuação, pode ser necessário relançar.
      } finally {
        // Resetar o lote e o contador, independentemente do sucesso ou falha do commit anterior
        // para permitir que o processamento continue com novos lotes, se aplicável.
        if (!db) {
          logger.error('CRITICAL: Instância DB do Firestore não disponível para criar novo batch após commitAndReset.');
          // Lançar um erro aqui pode ser apropriado se a ausência de `db` for irrecuperável
          throw new Error('Firestore DB não disponível para resetar batch.');
        }
        this.batch = db.batch();
        this.operationCount = 0;
        logger.debug('Batch resetado e contador zerado.');
      }
    } else {
      logger.debug('Nenhuma operação no lote para commitar.');
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
