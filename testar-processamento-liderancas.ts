/**
 * Script para testar o processamento de lideranças
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

async function testarProcessamentoLiderancas() {
  try {
    logger.info('Iniciando teste de processamento de lideranças');

    // Criar dados de teste para lideranças
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

    // Criar dados de teste para tipos de liderança
    const tiposLiderancaTeste = [
      {
        codigo: 'tipo1',
        descricao: 'Tipo de Liderança 1',
        atualizadoEm: timestamp
      },
      {
        codigo: 'tipo2',
        descricao: 'Tipo de Liderança 2',
        atualizadoEm: timestamp
      }
    ];

    // Criar dados de teste para tipos de unidade
    const tiposUnidadeTeste = [
      {
        codigo: 'unidade1',
        descricao: 'Tipo de Unidade 1',
        atualizadoEm: timestamp
      },
      {
        codigo: 'unidade2',
        descricao: 'Tipo de Unidade 2',
        atualizadoEm: timestamp
      }
    ];

    // Salvar metadados
    logger.info('Salvando metadados de teste');
    await db.collection('metadata').doc('liderancas_teste').set({
      ultimaAtualizacao: timestamp,
      totalLiderancas: liderancasTeste.length,
      totalTiposLideranca: tiposLiderancaTeste.length,
      totalTiposUnidade: tiposUnidadeTeste.length,
      legislatura: 57,
      status: 'teste'
    });
    logger.info('Metadados de teste salvos com sucesso');

    // Salvar lideranças
    logger.info(`Salvando ${liderancasTeste.length} lideranças de teste`);
    for (const lideranca of liderancasTeste) {
      logger.info(`Salvando liderança de teste ${lideranca.codigo}`);
      await db.collection('liderancas').doc(lideranca.id).set(lideranca);
      logger.info(`Liderança de teste ${lideranca.codigo} salva com sucesso`);
    }

    // Salvar tipos de liderança
    logger.info(`Salvando ${tiposLiderancaTeste.length} tipos de liderança de teste`);
    for (const tipo of tiposLiderancaTeste) {
      logger.info(`Salvando tipo de liderança de teste ${tipo.codigo}`);
      await db.collection('referencias_tiposLideranca').doc(tipo.codigo).set(tipo);
      logger.info(`Tipo de liderança de teste ${tipo.codigo} salvo com sucesso`);
    }

    // Salvar tipos de unidade
    logger.info(`Salvando ${tiposUnidadeTeste.length} tipos de unidade de teste`);
    for (const tipo of tiposUnidadeTeste) {
      logger.info(`Salvando tipo de unidade de teste ${tipo.codigo}`);
      await db.collection('referencias_tiposUnidade').doc(tipo.codigo).set(tipo);
      logger.info(`Tipo de unidade de teste ${tipo.codigo} salvo com sucesso`);
    }

    logger.info('Teste de processamento de lideranças concluído com sucesso');

    // Verificar se os dados foram salvos
    logger.info('Verificando se os dados foram salvos');
    
    const metadados = await db.collection('metadata').doc('liderancas_teste').get();
    logger.info(`Metadados de teste: ${metadados.exists ? 'existem' : 'não existem'}`);
    
    const liderancasSnapshot = await db.collection('liderancas').get();
    logger.info(`Lideranças: ${liderancasSnapshot.size} documentos`);
    
    const tiposLiderancaSnapshot = await db.collection('referencias_tiposLideranca').get();
    logger.info(`Tipos de liderança: ${tiposLiderancaSnapshot.size} documentos`);
    
    const tiposUnidadeSnapshot = await db.collection('referencias_tiposUnidade').get();
    logger.info(`Tipos de unidade: ${tiposUnidadeSnapshot.size} documentos`);

    logger.info('Verificação concluída');
  } catch (error) {
    logger.error(`Erro no teste de processamento de lideranças: ${error.message}`, error);
  }
}

// Executar o teste
testarProcessamentoLiderancas();
