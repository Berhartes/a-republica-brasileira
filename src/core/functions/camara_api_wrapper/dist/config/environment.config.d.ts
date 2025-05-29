/**
 * Configurações de ambiente para o Sistema ETL da Câmara de Deputados
 *
 * Gerencia variáveis de ambiente e configurações específicas do ambiente
 * de execução (desenvolvimento, produção, teste).
 */
/**
 * Configurações de ambiente
 */
export declare const environmentConfig: {
    NODE_ENV: string;
    CAMARA_API_BASE_URL: string;
    CAMARA_API_TIMEOUT: number;
    CAMARA_API_RATE_LIMIT: number;
    GOOGLE_APPLICATION_CREDENTIALS: string | undefined;
    FIRESTORE_PROJECT_ID: string | undefined;
    FIRESTORE_EMULATOR_HOST: string;
    LOG_LEVEL: string;
    LOG_COLORIZE: boolean;
    LOG_INCLUDE_TIMESTAMP: boolean;
    LOG_API_REQUESTS: true;
    LOG_API_RESPONSES: true;
    EXPORT_BASE_DIR: string;
    EXPORT_COMPRESSION: boolean;
    SAVE_RAW_DATA: boolean;
    DEV_MODE: boolean;
    DEBUG_MODE: boolean;
    ENABLE_PERFORMANCE_METRICS: boolean;
    DEFAULT_CONCURRENCY: number;
    MAX_CONCURRENCY: number;
    FIRESTORE_BATCH_SIZE: number;
    FIRESTORE_MAX_SIZE: number;
    DEFAULT_RETRIES: number;
    RETRY_DELAY: number;
    DESPESAS_ITEMS_PER_PAGE: number;
    DISCURSOS_ITEMS_PER_PAGE: number;
    DESPESAS_RECENT_MONTHS: number;
    DISCURSOS_RECENT_DAYS: number;
};
/**
 * Valida configurações obrigatórias
 */
export declare function validateEnvironmentConfig(): {
    valid: boolean;
    errors: string[];
};
/**
 * Detecta se está rodando em ambiente de produção
 */
export declare function isProduction(): boolean;
/**
 * Detecta se está rodando em ambiente de desenvolvimento
 */
export declare function isDevelopment(): boolean;
/**
 * Detecta se está rodando em ambiente de teste
 */
export declare function isTest(): boolean;
/**
 * Obtém configurações específicas do ambiente
 */
export declare function getEnvironmentSpecificConfig(): {
    api: {
        baseURL: string;
        timeout: number;
        rateLimit: number;
    };
    logging: {
        level: string;
        colorize: boolean;
        includeTimestamp: boolean;
    };
    concurrency: number;
    retries: number;
} | {
    logging: {
        level: string;
        colorize: boolean;
        includeTimestamp: boolean;
    };
    concurrency: number;
    debug: {
        enableDetailedLogs: boolean;
        logApiRequests: boolean;
        logApiResponses: boolean;
        saveRawData: boolean;
    };
    api: {
        baseURL: string;
        timeout: number;
        rateLimit: number;
    };
    retries: number;
};
/**
 * Obtém configurações do Firestore baseadas no ambiente
 */
export declare function getFirestoreConfig(): {
    projectId: string | undefined;
    credentials: string | undefined;
    emulatorHost: string;
    batchSize: number;
    maxSize: number;
};
/**
 * Obtém diretório de exportação baseado no ambiente
 */
export declare function getExportDirectory(): string;
/**
 * Configurações de segurança
 */
export declare const securityConfig: {
    operationTimeout: number;
    maxFileSize: number;
    maxRecordsPerBatch: number;
    maxConcurrentConnections: number;
    apiCallsPerMinute: number;
    burstLimit: number;
};
/**
 * Configurações de monitoramento
 */
export declare const monitoringConfig: {
    enableMetrics: boolean;
    metricsInterval: number;
    alertThresholds: {
        errorRate: number;
        responseTime: number;
        memoryUsage: number;
    };
};
/**
 * Configura variáveis de ambiente baseadas nos argumentos da linha de comando
 * DEVE ser executado ANTES de qualquer import do Firestore
 */
export declare function configurarVariaveisAmbiente(): void;
/**
 * Obtém a configuração de destino atual
 */
export declare function getDestinoConfig(): {
    useRealFirestore: boolean;
    useEmulator: boolean;
    useMock: boolean;
    saveToPC: boolean;
    pcSaveDir?: string;
};
