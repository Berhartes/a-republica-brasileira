/**
 * Configuração centralizada do sistema ETL da Câmara dos Deputados
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
  camara: {
    concurrency: number;
    maxRetries: number;
    timeout: number;
    pauseBetweenRequests: number;
    itemsPerPage?: number; // Adicionado para controlar o número de itens por página
    concorrenciaDiscursos?: number; // Concorrência específica para processamento de discursos
    concorrenciaEventos?: number; // Concorrência específica para processamento de eventos
    itemsPerPageEventos?: number; // Itens por página específico para eventos
    diasAtualizacaoIncrementalEventos?: number; // Dias para busca incremental de eventos
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
 * Configuração da API da Câmara
 */
export interface APIConfig {
  rateLimit: {
    requestsPerSecond: number;
  };
  timeouts: {
    default: number;
    long: number;
  };
  retryConfig: {
    attempts: number;
    delay: number;
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
  camara: {
    concurrency: parseInt(process.env.CAMARA_CONCURRENCY || '3', 10),
    maxRetries: parseInt(process.env.CAMARA_MAX_RETRIES || '5', 10),
    timeout: parseInt(process.env.CAMARA_TIMEOUT || '30000', 10),
    pauseBetweenRequests: parseInt(process.env.CAMARA_PAUSE_BETWEEN_REQUESTS || '2000', 10),
    itemsPerPage: parseInt(process.env.CAMARA_ITEMS_PER_PAGE || '100', 10), // Default para 100
    concorrenciaDiscursos: parseInt(process.env.CAMARA_CONCORRENCIA_DISCURSOS || '2', 10),
    concorrenciaEventos: parseInt(process.env.CAMARA_CONCORRENCIA_EVENTOS || '2', 10),
    itemsPerPageEventos: parseInt(process.env.CAMARA_ITEMS_PER_PAGE_EVENTOS || '100', 10),
    diasAtualizacaoIncrementalEventos: parseInt(process.env.CAMARA_DIAS_ATUALIZACAO_EVENTOS || '60', 10),
    legislatura: {
      min: 50,
      max: 57, // Ajustar conforme a legislatura mais recente coberta pela API
      atual: process.env.LEGISLATURA_ATUAL ? parseInt(process.env.LEGISLATURA_ATUAL, 10) : undefined
    }
  },
  firestore: {
    batchSize: parseInt(process.env.FIRESTORE_BATCH_SIZE || '5', 10),
    pauseBetweenBatches: parseInt(process.env.FIRESTORE_PAUSE_BETWEEN_BATCHES || '7000', 10),
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
 * Configuração da API da Câmara
 */
export const apiConfig: APIConfig = {
  rateLimit: {
    requestsPerSecond: parseInt(process.env.CAMARA_REQUESTS_PER_SECOND || '2', 10)
  },
  timeouts: {
    default: parseInt(process.env.CAMARA_TIMEOUT_DEFAULT || '30000', 10),
    long: parseInt(process.env.CAMARA_TIMEOUT_LONG || '60000', 10)
  },
  retryConfig: {
    attempts: parseInt(process.env.CAMARA_RETRY_ATTEMPTS || '3', 10),
    delay: parseInt(process.env.CAMARA_RETRY_DELAY || '2000', 10)
  }
};

// A função validateConfig anterior validava apenas 'config.senado',
// o que não é relevante para o wrapper da Câmara.
// Se uma validação específica para 'config.camara' for necessária,
// ela deve ser implementada. Por ora, a validação foi removida.

// // Validar configuração na inicialização
// try {
//   // validateConfig(etlConfig); // Chamada removida
// } catch (error: any) {
//   console.error(`Erro na configuração: ${error.message}`);
//   process.exit(1);
// }
