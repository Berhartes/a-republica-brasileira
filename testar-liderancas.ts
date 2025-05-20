/**
 * Script para testar o salvamento de lideranças no Firestore
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Configurar logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args)
};

// Caminho para o arquivo de credenciais de serviço
const serviceAccountPath = path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');

// Verificar se o arquivo de credenciais existe
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
}

// Inicializar o Firebase Admin SDK
try {
  initializeApp({
    credential: cert(serviceAccountPath)
  });
  logger.info('Firebase Admin SDK inicializado com sucesso');
} catch (error) {
  logger.error('Erro ao inicializar Firebase Admin SDK:', error);
  throw error;
}

// Obter instância do Firestore e configurar para ignorar propriedades indefinidas
const db = getFirestore();
// Configurar para ignorar propriedades indefinidas
db.settings({
  ignoreUndefinedProperties: true
});
logger.info('Conexão com Firestore estabelecida (ignorando propriedades indefinidas)');

async function testarSalvamentoLiderancas() {
  try {
    logger.info('Iniciando teste de salvamento de lideranças no Firestore');

    // Criar dados de teste
    const timestamp = new Date().toISOString();
    const liderancasTeste = [
      {
        codigo: 'teste1',
        nome: 'Liderança de Teste 1',
        descricao: 'Descrição da liderança de teste 1',
        tipo: {
          codigo: 'tipo1',
          descricao: 'Tipo de Liderança 1'
        },
        atualizadoEm: timestamp,
        id: '57_teste1',
        legislatura: 57,
        atual: true
      },
      {
        codigo: 'teste2',
        nome: 'Liderança de Teste 2',
        descricao: 'Descrição da liderança de teste 2',
        tipo: {
          codigo: 'tipo2',
          descricao: 'Tipo de Liderança 2'
        },
        atualizadoEm: timestamp,
        id: '57_teste2',
        legislatura: 57,
        atual: true
      }
    ];

    // Salvar metadados
    logger.info('Salvando metadados de teste');
    await db.collection('metadata').doc('liderancas_teste').set({
      ultimaAtualizacao: timestamp,
      totalLiderancas: liderancasTeste.length,
      legislatura: 57,
      status: 'teste'
    });
    logger.info('Metadados de teste salvos com sucesso');

    // Salvar lideranças
    logger.info(`Salvando ${liderancasTeste.length} lideranças de teste`);
    for (const lideranca of liderancasTeste) {
      logger.info(`Salvando liderança de teste ${lideranca.codigo}`);
      await db.collection('liderancas_teste').doc(lideranca.id).set(lideranca);
      logger.info(`Liderança de teste ${lideranca.codigo} salva com sucesso`);
    }

    logger.info('Teste de salvamento de lideranças concluído com sucesso');

    // Verificar se os dados foram salvos
    logger.info('Verificando se os dados foram salvos');

    const metadados = await db.collection('metadata').doc('liderancas_teste').get();
    logger.info(`Metadados de teste: ${metadados.exists ? 'existem' : 'não existem'}`);

    const liderancasSnapshot = await db.collection('liderancas_teste').get();
    logger.info(`Lideranças de teste: ${liderancasSnapshot.size} documentos`);

    liderancasSnapshot.forEach(doc => {
      logger.info(`Liderança de teste encontrada: ${doc.id}`);
    });

    logger.info('Verificação concluída');
  } catch (error) {
    logger.error(`Erro no teste de salvamento de lideranças: ${error.message}`, error);
  }
}

// Executar o teste
testarSalvamentoLiderancas();
