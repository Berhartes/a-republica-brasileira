/**
 * Configuração centralizada do sistema ETL do Senado Federal
 *
 * Este arquivo centraliza todas as configurações do sistema ETL,
 * permitindo fácil manutenção e configuração via variáveis de ambiente.
 */

export interface ETLConfig {
  senado: {
    concurrency: number;
    maxRetries: number;
    timeout: number;
    pauseBetweenRequests: number;
    legislatura: {
      min: number;
      max: number;
      atual?: number;
    };
  };
  firestore: {
    batchSize: number;
    pauseBetweenBatches: number;
    emulatorHost?: string;
  };
  export: {
    baseDir: string;
    formats: string[];
    comprimir: boolean;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    showTimestamp: boolean;
  };
}

/**
 * Configuração padrão do sistema ETL
 * Pode ser sobrescrita por variáveis de ambiente
 */
export const etlConfig: ETLConfig = {
  senado: {
    concurrency: parseInt(process.env.SENADO_CONCURRENCY || '3', 10),
    maxRetries: parseInt(process.env.SENADO_MAX_RETRIES || '5', 10),
    timeout: parseInt(process.env.SENADO_TIMEOUT || '30000', 10),
    pauseBetweenRequests: parseInt(process.env.SENADO_PAUSE_BETWEEN_REQUESTS || '3000', 10),
    legislatura: {
      min: 1,
      max: 58,
      atual: process.env.LEGISLATURA_ATUAL ? parseInt(process.env.LEGISLATURA_ATUAL, 10) : undefined
    }
  },
  firestore: {
    batchSize: parseInt(process.env.FIRESTORE_BATCH_SIZE || '10', 10),
    pauseBetweenBatches: parseInt(process.env.FIRESTORE_PAUSE_BETWEEN_BATCHES || '500', 10),
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8000'
  },
  export: {
    baseDir: process.env.EXPORT_BASE_DIR || 'dados_extraidos',
    formats: (process.env.EXPORT_FORMATS || 'json').split(','),
    comprimir: process.env.EXPORT_COMPRIMIR === 'true'
  },
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
    showTimestamp: process.env.LOG_TIMESTAMP !== 'false'
  }
};

/**
 * Valida a configuração
 */
export function validateConfig(config: ETLConfig): void {
  if (config.senado.concurrency < 1 || config.senado.concurrency > 10) {
    throw new Error('Concorrência deve estar entre 1 e 10');
  }

  if (config.senado.maxRetries < 1 || config.senado.maxRetries > 10) {
    throw new Error('Número de tentativas deve estar entre 1 e 10');
  }

  if (config.senado.timeout < 5000 || config.senado.timeout > 120000) {
    throw new Error('Timeout deve estar entre 5000ms e 120000ms');
  }

  if (config.firestore.batchSize < 1 || config.firestore.batchSize > 500) {
    throw new Error('Tamanho do batch deve estar entre 1 e 500');
  }
}

// Validar configuração na inicialização
try {
  validateConfig(etlConfig);
} catch (error: any) {
  console.error(`Erro na configuração: ${error.message}`);
  process.exit(1);
}
