/**
 * Configurações de ambiente para o Sistema ETL da Câmara de Deputados
 *
 * Gerencia variáveis de ambiente e configurações específicas do ambiente
 * de execução (desenvolvimento, produção, teste).
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Configurações de ambiente
 */
export const environmentConfig = {
  // Ambiente atual
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Configurações da API da Câmara
  CAMARA_API_BASE_URL: process.env.CAMARA_API_BASE_URL || 'https://dadosabertos.camara.leg.br/api/v2',
  CAMARA_API_TIMEOUT: parseInt(process.env.CAMARA_API_TIMEOUT || '30000'),
  CAMARA_API_RATE_LIMIT: parseInt(process.env.CAMARA_API_RATE_LIMIT || '2'),

  // Configurações do Firestore
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  FIRESTORE_PROJECT_ID: process.env.FIRESTORE_PROJECT_ID,
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080',

  // Configurações de logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_COLORIZE: process.env.LOG_COLORIZE !== 'false',
  LOG_INCLUDE_TIMESTAMP: process.env.LOG_INCLUDE_TIMESTAMP !== 'false',
  LOG_API_REQUESTS: process.env.LOG_API_REQUESTS === 'true' || true, // Temporariamente ativado para debug
  LOG_API_RESPONSES: process.env.LOG_API_RESPONSES === 'true' || true, // Temporariamente ativado para debug

  // Configurações de exportação
  EXPORT_BASE_DIR: process.env.EXPORT_BASE_DIR || './exports',
  EXPORT_COMPRESSION: process.env.EXPORT_COMPRESSION === 'true',
  SAVE_RAW_DATA: process.env.SAVE_RAW_DATA === 'true',

  // Configurações de desenvolvimento
  DEV_MODE: process.env.NODE_ENV === 'development',
  DEBUG_MODE: process.env.DEBUG === 'true',
  ENABLE_PERFORMANCE_METRICS: process.env.ENABLE_PERFORMANCE_METRICS === 'true',

  // Configurações de concorrência
  DEFAULT_CONCURRENCY: parseInt(process.env.DEFAULT_CONCURRENCY || '3'),
  MAX_CONCURRENCY: parseInt(process.env.MAX_CONCURRENCY || '10'),

  // Configurações de batch
  FIRESTORE_BATCH_SIZE: parseInt(process.env.FIRESTORE_BATCH_SIZE || '500'),
  FIRESTORE_MAX_SIZE: parseInt(process.env.FIRESTORE_MAX_SIZE || '1048576'),

  // Configurações de retry
  DEFAULT_RETRIES: parseInt(process.env.DEFAULT_RETRIES || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '1000'),

  // Configurações específicas por processador
  DESPESAS_ITEMS_PER_PAGE: parseInt(process.env.DESPESAS_ITEMS_PER_PAGE || '75'),
  DISCURSOS_ITEMS_PER_PAGE: parseInt(process.env.DISCURSOS_ITEMS_PER_PAGE || '75'),
  DESPESAS_RECENT_MONTHS: parseInt(process.env.DESPESAS_RECENT_MONTHS || '2'),
  DISCURSOS_RECENT_DAYS: parseInt(process.env.DISCURSOS_RECENT_DAYS || '60')
};

/**
 * Valida configurações obrigatórias
 */
export function validateEnvironmentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar configurações do Firestore (apenas se não for modo PC)
  if (!process.argv.includes('--pc')) {
    if (!environmentConfig.GOOGLE_APPLICATION_CREDENTIALS) {
      errors.push('GOOGLE_APPLICATION_CREDENTIALS não configurado');
    }

    if (!environmentConfig.FIRESTORE_PROJECT_ID) {
      errors.push('FIRESTORE_PROJECT_ID não configurado');
    }
  }

  // Validar configurações numéricas
  if (isNaN(environmentConfig.CAMARA_API_TIMEOUT) || environmentConfig.CAMARA_API_TIMEOUT <= 0) {
    errors.push('CAMARA_API_TIMEOUT deve ser um número positivo');
  }

  if (isNaN(environmentConfig.DEFAULT_CONCURRENCY) || environmentConfig.DEFAULT_CONCURRENCY <= 0) {
    errors.push('DEFAULT_CONCURRENCY deve ser um número positivo');
  }

  if (environmentConfig.DEFAULT_CONCURRENCY > environmentConfig.MAX_CONCURRENCY) {
    errors.push('DEFAULT_CONCURRENCY não pode ser maior que MAX_CONCURRENCY');
  }

  // Validar URL da API
  try {
    new URL(environmentConfig.CAMARA_API_BASE_URL);
  } catch (error) {
    errors.push('CAMARA_API_BASE_URL deve ser uma URL válida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detecta se está rodando em ambiente de produção
 */
export function isProduction(): boolean {
  return environmentConfig.NODE_ENV === 'production';
}

/**
 * Detecta se está rodando em ambiente de desenvolvimento
 */
export function isDevelopment(): boolean {
  return environmentConfig.NODE_ENV === 'development';
}

/**
 * Detecta se está rodando em ambiente de teste
 */
export function isTest(): boolean {
  return environmentConfig.NODE_ENV === 'test';
}

/**
 * Obtém configurações específicas do ambiente
 */
export function getEnvironmentSpecificConfig() {
  const base = {
    api: {
      baseURL: environmentConfig.CAMARA_API_BASE_URL,
      timeout: environmentConfig.CAMARA_API_TIMEOUT,
      rateLimit: environmentConfig.CAMARA_API_RATE_LIMIT
    },
    logging: {
      level: environmentConfig.LOG_LEVEL,
      colorize: environmentConfig.LOG_COLORIZE,
      includeTimestamp: environmentConfig.LOG_INCLUDE_TIMESTAMP
    },
    concurrency: environmentConfig.DEFAULT_CONCURRENCY,
    retries: environmentConfig.DEFAULT_RETRIES
  };

  if (isDevelopment()) {
    return {
      ...base,
      logging: {
        ...base.logging,
        level: 'debug'
      },
      debug: {
        enableDetailedLogs: true,
        logApiRequests: environmentConfig.LOG_API_REQUESTS,
        logApiResponses: environmentConfig.LOG_API_RESPONSES,
        saveRawData: environmentConfig.SAVE_RAW_DATA
      }
    };
  }

  if (isProduction()) {
    return {
      ...base,
      logging: {
        ...base.logging,
        level: 'info'
      },
      concurrency: Math.min(base.concurrency, 5), // Limite em produção
      debug: {
        enableDetailedLogs: false,
        logApiRequests: false,
        logApiResponses: false,
        saveRawData: false
      }
    };
  }

  return base;
}

/**
 * Obtém configurações do Firestore baseadas no ambiente
 */
export function getFirestoreConfig() {
  return {
    projectId: environmentConfig.FIRESTORE_PROJECT_ID,
    credentials: environmentConfig.GOOGLE_APPLICATION_CREDENTIALS,
    emulatorHost: environmentConfig.FIRESTORE_EMULATOR_HOST,
    batchSize: environmentConfig.FIRESTORE_BATCH_SIZE,
    maxSize: environmentConfig.FIRESTORE_MAX_SIZE
  };
}

/**
 * Obtém diretório de exportação baseado no ambiente
 */
export function getExportDirectory(): string {
  return path.resolve(environmentConfig.EXPORT_BASE_DIR);
}

/**
 * Configurações de segurança
 */
export const securityConfig = {
  // Timeout para operações longas
  operationTimeout: 5 * 60 * 1000, // 5 minutos

  // Limites de segurança
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxRecordsPerBatch: 1000,
  maxConcurrentConnections: 10,

  // Rate limiting
  apiCallsPerMinute: isProduction() ? 60 : 120,
  burstLimit: isProduction() ? 10 : 20
};

/**
 * Configurações de monitoramento
 */
export const monitoringConfig = {
  enableMetrics: environmentConfig.ENABLE_PERFORMANCE_METRICS,
  metricsInterval: 30000, // 30 segundos
  alertThresholds: {
    errorRate: 0.1, // 10%
    responseTime: 30000, // 30s
    memoryUsage: 0.8 // 80%
  }
};

/**
 * Configura variáveis de ambiente baseadas nos argumentos da linha de comando
 * DEVE ser executado ANTES de qualquer import do Firestore
 */
export function configurarVariaveisAmbiente(): void {
  const args = process.argv.slice(2);

  // Log inicial
  console.log('🔧 Configurando variáveis de ambiente baseadas nas flags...');
  console.log('📋 Argumentos recebidos:', args);

  // Detectar flags de destino
  const hasFirestore = args.includes('--firestore');
  const hasEmulator = args.includes('--emulator');
  const hasPC = args.includes('--pc');
  const hasMock = args.includes('--mock');

  // Validar exclusividade
  const destinos = [hasFirestore, hasEmulator, hasPC, hasMock].filter(Boolean);
  if (destinos.length > 1) {
    console.error('❌ Erro: Especifique apenas um destino: --firestore, --emulator, --pc ou --mock');
    process.exit(1);
  }

  // Configurar baseado nas flags
  if (hasEmulator) {
    console.log('🔌 Configurando para usar Firestore Emulator');
    process.env.USE_FIRESTORE_EMULATOR = 'true';
    process.env.USE_REAL_FIRESTORE = 'false';
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8000';
    console.log(`   Host do emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (hasFirestore) {
    console.log('☁️ Configurando para usar Firestore Real (Produção)');
    process.env.USE_REAL_FIRESTORE = 'true';
    process.env.USE_FIRESTORE_EMULATOR = 'false';
    delete process.env.FIRESTORE_EMULATOR_HOST; // Remove para garantir
  } else if (hasPC) {
    console.log('💾 Configurando para salvar no PC local');
    process.env.USE_REAL_FIRESTORE = 'false';
    process.env.USE_FIRESTORE_EMULATOR = 'false';
    process.env.SAVE_TO_PC = 'true';
    // Configurar diretório base para salvamento no PC
    process.env.PC_SAVE_DIR = 'C:\\Users\\Kast Berhartes\\projetos-web-berhartes\\a-republica-brasileira\\src\\core';
  } else if (hasMock) {
    console.log('🎭 Configurando para usar Mock do Firestore');
    process.env.USE_REAL_FIRESTORE = 'false';
    process.env.USE_FIRESTORE_EMULATOR = 'false';
    process.env.USE_MOCK_FIRESTORE = 'true';
  } else {
    // Padrão: Firestore Real em produção, Mock em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      console.log('☁️ Ambiente de produção detectado - usando Firestore Real');
      process.env.USE_REAL_FIRESTORE = 'true';
    } else {
      console.log('🏗️ Ambiente de desenvolvimento - usando Mock por padrão');
      console.log('   Use --firestore para forçar Firestore real');
      console.log('   Use --emulator para usar o emulador');
      process.env.USE_REAL_FIRESTORE = 'false';
      process.env.USE_MOCK_FIRESTORE = 'true';
    }
  }

  // Log final da configuração
  console.log('✅ Configuração de ambiente concluída:');
  console.log(`   USE_REAL_FIRESTORE: ${process.env.USE_REAL_FIRESTORE}`);
  console.log(`   USE_FIRESTORE_EMULATOR: ${process.env.USE_FIRESTORE_EMULATOR}`);
  console.log(`   USE_MOCK_FIRESTORE: ${process.env.USE_MOCK_FIRESTORE}`);
  console.log(`   SAVE_TO_PC: ${process.env.SAVE_TO_PC}`);
  console.log('─'.repeat(60));
}

/**
 * Obtém a configuração de destino atual
 */
export function getDestinoConfig(): {
  useRealFirestore: boolean;
  useEmulator: boolean;
  useMock: boolean;
  saveToPC: boolean;
  pcSaveDir?: string;
} {
  return {
    useRealFirestore: process.env.USE_REAL_FIRESTORE === 'true',
    useEmulator: process.env.USE_FIRESTORE_EMULATOR === 'true',
    useMock: process.env.USE_MOCK_FIRESTORE === 'true',
    saveToPC: process.env.SAVE_TO_PC === 'true',
    pcSaveDir: process.env.PC_SAVE_DIR
  };
}
