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
    camara: {
        concurrency: number;
        maxRetries: number;
        timeout: number;
        pauseBetweenRequests: number;
        itemsPerPage?: number;
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
export declare const etlConfig: ETLConfig;
/**
 * Configuração da API da Câmara
 */
export declare const apiConfig: APIConfig;
/**
 * Valida a configuração
 */
export declare function validateConfig(config: ETLConfig): void;
