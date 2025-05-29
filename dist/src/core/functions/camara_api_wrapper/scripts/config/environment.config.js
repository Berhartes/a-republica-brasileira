"use strict";
/**
 * Configurações de ambiente para o Sistema ETL da Câmara de Deputados
 *
 * Gerencia variáveis de ambiente e configurações específicas do ambiente
 * de execução (desenvolvimento, produção, teste).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringConfig = exports.securityConfig = exports.environmentConfig = void 0;
exports.validateEnvironmentConfig = validateEnvironmentConfig;
exports.isProduction = isProduction;
exports.isDevelopment = isDevelopment;
exports.isTest = isTest;
exports.getEnvironmentSpecificConfig = getEnvironmentSpecificConfig;
exports.getFirestoreConfig = getFirestoreConfig;
exports.getExportDirectory = getExportDirectory;
exports.configurarVariaveisAmbiente = configurarVariaveisAmbiente;
exports.getDestinoConfig = getDestinoConfig;
const tslib_1 = require("tslib");
const dotenv = tslib_1.__importStar(require("dotenv"));
const path = tslib_1.__importStar(require("path"));
// Carregar variáveis de ambiente
dotenv.config();
/**
 * Configurações de ambiente
 */
exports.environmentConfig = {
    // Ambiente atual
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Configurações da API da Câmara
    CAMARA_API_BASE_URL: process.env.CAMARA_API_BASE_URL || 'https://dadosabertos.camara.leg.br/api/v2',
    CAMARA_API_TIMEOUT: parseInt(process.env.CAMARA_API_TIMEOUT || '30000'),
    CAMARA_API_RATE_LIMIT: parseInt(process.env.CAMARA_API_RATE_LIMIT || '2'),
    // Configurações do Firestore
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    FIRESTORE_PROJECT_ID: process.env.FIRESTORE_PROJECT_ID,
    FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8000', // Porta corrigida para 8000
    // Configurações de logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug', // Alterado para 'debug' para depuração
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
function validateEnvironmentConfig() {
    const errors = [];
    // Validar configurações do Firestore (apenas se não for modo PC)
    if (!process.argv.includes('--pc')) {
        if (!exports.environmentConfig.GOOGLE_APPLICATION_CREDENTIALS) {
            errors.push('GOOGLE_APPLICATION_CREDENTIALS não configurado');
        }
        if (!exports.environmentConfig.FIRESTORE_PROJECT_ID) {
            errors.push('FIRESTORE_PROJECT_ID não configurado');
        }
    }
    // Validar configurações numéricas
    if (isNaN(exports.environmentConfig.CAMARA_API_TIMEOUT) || exports.environmentConfig.CAMARA_API_TIMEOUT <= 0) {
        errors.push('CAMARA_API_TIMEOUT deve ser um número positivo');
    }
    if (isNaN(exports.environmentConfig.DEFAULT_CONCURRENCY) || exports.environmentConfig.DEFAULT_CONCURRENCY <= 0) {
        errors.push('DEFAULT_CONCURRENCY deve ser um número positivo');
    }
    if (exports.environmentConfig.DEFAULT_CONCURRENCY > exports.environmentConfig.MAX_CONCURRENCY) {
        errors.push('DEFAULT_CONCURRENCY não pode ser maior que MAX_CONCURRENCY');
    }
    // Validar URL da API
    try {
        new URL(exports.environmentConfig.CAMARA_API_BASE_URL);
    }
    catch (error) {
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
function isProduction() {
    return exports.environmentConfig.NODE_ENV === 'production';
}
/**
 * Detecta se está rodando em ambiente de desenvolvimento
 */
function isDevelopment() {
    return exports.environmentConfig.NODE_ENV === 'development';
}
/**
 * Detecta se está rodando em ambiente de teste
 */
function isTest() {
    return exports.environmentConfig.NODE_ENV === 'test';
}
/**
 * Obtém configurações específicas do ambiente
 */
function getEnvironmentSpecificConfig() {
    const base = {
        api: {
            baseURL: exports.environmentConfig.CAMARA_API_BASE_URL,
            timeout: exports.environmentConfig.CAMARA_API_TIMEOUT,
            rateLimit: exports.environmentConfig.CAMARA_API_RATE_LIMIT
        },
        logging: {
            level: exports.environmentConfig.LOG_LEVEL,
            colorize: exports.environmentConfig.LOG_COLORIZE,
            includeTimestamp: exports.environmentConfig.LOG_INCLUDE_TIMESTAMP
        },
        concurrency: exports.environmentConfig.DEFAULT_CONCURRENCY,
        retries: exports.environmentConfig.DEFAULT_RETRIES
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
                logApiRequests: exports.environmentConfig.LOG_API_REQUESTS,
                logApiResponses: exports.environmentConfig.LOG_API_RESPONSES,
                saveRawData: exports.environmentConfig.SAVE_RAW_DATA
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
function getFirestoreConfig() {
    return {
        projectId: exports.environmentConfig.FIRESTORE_PROJECT_ID,
        credentials: exports.environmentConfig.GOOGLE_APPLICATION_CREDENTIALS,
        emulatorHost: exports.environmentConfig.FIRESTORE_EMULATOR_HOST,
        batchSize: exports.environmentConfig.FIRESTORE_BATCH_SIZE,
        maxSize: exports.environmentConfig.FIRESTORE_MAX_SIZE
    };
}
/**
 * Obtém diretório de exportação baseado no ambiente
 */
function getExportDirectory() {
    return path.resolve(exports.environmentConfig.EXPORT_BASE_DIR);
}
/**
 * Configurações de segurança
 */
exports.securityConfig = {
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
exports.monitoringConfig = {
    enableMetrics: exports.environmentConfig.ENABLE_PERFORMANCE_METRICS,
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
function configurarVariaveisAmbiente() {
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
        // Forçar a porta do emulador para 8000 quando a flag --emulator é usada
        process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8000';
        console.log(`   Host do emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
    else if (hasFirestore) {
        console.log('☁️ Configurando para usar Firestore Real (Produção)');
        process.env.USE_REAL_FIRESTORE = 'true';
        process.env.USE_FIRESTORE_EMULATOR = 'false';
        delete process.env.FIRESTORE_EMULATOR_HOST; // Remove para garantir
    }
    else if (hasPC) {
        console.log('💾 Configurando para salvar no PC local');
        process.env.USE_REAL_FIRESTORE = 'false';
        process.env.USE_FIRESTORE_EMULATOR = 'false';
        process.env.SAVE_TO_PC = 'true';
        // Configurar diretório base para salvamento no PC
        process.env.PC_SAVE_DIR = 'C:\\Users\\Kast Berhartes\\projetos-web-berhartes\\a-republica-brasileira\\src\\core';
    }
    else if (hasMock) {
        console.log('🎭 Configurando para usar Mock do Firestore');
        process.env.USE_REAL_FIRESTORE = 'false';
        process.env.USE_FIRESTORE_EMULATOR = 'false';
        process.env.USE_MOCK_FIRESTORE = 'true';
    }
    else {
        // Padrão: Firestore Real em produção, Mock em desenvolvimento
        if (process.env.NODE_ENV === 'production') {
            console.log('☁️ Ambiente de produção detectado - usando Firestore Real');
            process.env.USE_REAL_FIRESTORE = 'true';
        }
        else {
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
function getDestinoConfig() {
    return {
        useRealFirestore: process.env.USE_REAL_FIRESTORE === 'true',
        useEmulator: process.env.USE_FIRESTORE_EMULATOR === 'true',
        useMock: process.env.USE_MOCK_FIRESTORE === 'true',
        saveToPC: process.env.SAVE_TO_PC === 'true',
        pcSaveDir: process.env.PC_SAVE_DIR
    };
}
//# sourceMappingURL=environment.config.js.map