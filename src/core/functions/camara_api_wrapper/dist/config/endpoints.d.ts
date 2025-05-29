/**
 * Configuração de endpoints da API da Câmara dos Deputados
 *
 * Centraliza todas as URLs e configurações de endpoints
 * da API de Dados Abertos da Câmara dos Deputados.
 */
/**
 * Configuração de endpoint
 */
interface EndpointConfig {
    PATH: string;
    PARAMS: Record<string, any>;
    TIMEOUT?: number;
    RETRY_ATTEMPTS?: number;
    RETRY_DELAY?: number;
    dataInicio?: string;
    dataFim?: string;
}
/**
 * Configurações globais de request
 */
export declare const REQUEST_CONFIG: {
    RETRY_ATTEMPTS: number;
    RETRY_DELAY: number;
    DEFAULT_TIMEOUT: number;
    DEFAULT_ITEMS_PER_PAGE: number;
};
/**
 * Base URL da API (será sobrescrita pela configuração de ambiente)
 */
export declare const BASE_URL = "https://dadosabertos.camara.leg.br/api/v2";
/**
 * Endpoints organizados por categoria
 */
export declare const endpoints: {
    REQUEST: {
        RETRY_ATTEMPTS: number;
        RETRY_DELAY: number;
        DEFAULT_TIMEOUT: number;
        DEFAULT_ITEMS_PER_PAGE: number;
    };
    BASE_URL: string;
    DEPUTADOS: {
        LISTA: EndpointConfig;
        PERFIL: EndpointConfig;
        DESPESAS: EndpointConfig;
        DISCURSOS: EndpointConfig;
        EVENTOS: EndpointConfig;
        ORGAOS: EndpointConfig;
        FRENTES: EndpointConfig;
        MANDATOS_EXTERNOS: EndpointConfig;
        HISTORICO: EndpointConfig;
        PROFISSOES: EndpointConfig;
        OCUPACOES: EndpointConfig;
    };
    PROPOSICOES: {
        LISTA: EndpointConfig;
        DETALHES: EndpointConfig;
        AUTORES: EndpointConfig;
        RELATORES: EndpointConfig;
        TRAMITACOES: EndpointConfig;
        VOTACOES: EndpointConfig;
    };
    VOTACOES: {
        LISTA: EndpointConfig;
        DETALHES: EndpointConfig;
        VOTOS: EndpointConfig;
        ORIENTACOES: EndpointConfig;
    };
    COMISSOES: {
        LISTA: EndpointConfig;
        DETALHES: EndpointConfig;
        MEMBROS: EndpointConfig;
        EVENTOS: EndpointConfig;
        VOTACOES: EndpointConfig;
    };
    EVENTOS: {
        LISTA: EndpointConfig;
        DETALHES: EndpointConfig;
        DEPUTADOS: EndpointConfig;
        PAUTA: EndpointConfig;
    };
    LEGISLATURAS: {
        LISTA: EndpointConfig;
        DETALHES: EndpointConfig;
        MESA: EndpointConfig;
    };
    PARTIDOS: {
        LISTA: EndpointConfig;
        DETALHES: EndpointConfig;
        MEMBROS: EndpointConfig;
    };
    BLOCOS: {
        LISTA: EndpointConfig;
        DETALHES: EndpointConfig;
    };
    LIDERANCAS: {
        LISTA: EndpointConfig;
        DETALHES: EndpointConfig;
    };
    REFERENCIAS: {
        SITUACOES_PROPOSICAO: EndpointConfig;
        TIPOS_PROPOSICAO: EndpointConfig;
        TIPOS_EVENTO: EndpointConfig;
        TIPOS_ORGAO: EndpointConfig;
        UFS: EndpointConfig;
        PARTIDOS: EndpointConfig;
        SITUACOES_DEPUTADO: EndpointConfig;
    };
};
/**
 * Utilitários para trabalhar com endpoints
 */
export declare const endpointUtils: {
    /**
     * Obtém configuração de endpoint por categoria e nome
     */
    getEndpoint(category: string, name: string): EndpointConfig | undefined;
    /**
     * Lista todas as categorias disponíveis
     */
    getCategories(): string[];
    /**
     * Lista endpoints de uma categoria
     */
    getEndpointsInCategory(category: string): string[];
    /**
     * Valida se endpoint existe
     */
    endpointExists(category: string, name: string): boolean;
    /**
     * Obtém URL completa do endpoint
     */
    getFullUrl(category: string, name: string, pathParams?: Record<string, string>): string;
    /**
     * Merge parâmetros com defaults do endpoint
     */
    mergeParams(category: string, name: string, customParams?: Record<string, any>): Record<string, any>;
    /**
     * Obtém timeout específico do endpoint
     */
    getTimeout(category: string, name: string): number;
    /**
     * Valida parâmetros obrigatórios
     */
    validateRequiredParams(category: string, name: string, params: Record<string, any>, requiredParams: string[]): {
        valid: boolean;
        missing: string[];
    };
};
/**
 * Configurações específicas por tipo de processamento
 */
export declare const processingConfigs: {
    perfis: {
        endpoints: string[];
        batchSize: number;
        concurrency: number;
    };
    despesas: {
        endpoints: string[];
        batchSize: number;
        concurrency: number;
        itemsPerPage: number;
    };
    discursos: {
        endpoints: string[];
        batchSize: number;
        concurrency: number;
        itemsPerPage: number;
    };
    comissoes: {
        endpoints: string[];
        batchSize: number;
        concurrency: number;
    };
    votacoes: {
        endpoints: string[];
        batchSize: number;
        concurrency: number;
    };
    proposicoes: {
        endpoints: string[];
        batchSize: number;
        concurrency: number;
    };
};
export {};
