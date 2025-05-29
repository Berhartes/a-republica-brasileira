export interface DeputadosLegislaturaResult {
    timestamp: string;
    origem: string;
    deputados: any[];
    metadados: any;
    erro?: string;
}
export interface PerfilDeputadoResult {
    timestamp: string;
    origem: string;
    dados: any;
    metadados: any;
    erro?: string;
}
export interface PerfilCompletoResult {
    timestamp: string;
    codigo: string | number;
    dadosBasicos: PerfilDeputadoResult;
    orgaos?: any;
    frentes?: any;
    ocupacoes?: any;
    mandatosExternos?: any;
    historico?: any;
    profissoes?: any;
    erro?: string;
}
/**
 * Classe para extração de perfis completos de deputados
 */
export declare class PerfilDeputadosExtractor {
    /**
     * Extrai a lista de deputados de uma legislatura específica
     * @param legislatura - Número da legislatura
     * @returns Dados dos deputados da legislatura
     */
    extractDeputadosLegislatura(legislatura: number): Promise<DeputadosLegislaturaResult>;
    /**
     * Extrai perfil completo de um deputado específico
     * @param codigoDeputado - Código do deputado na API
     * @returns Perfil completo do deputado
     */
    extractPerfilCompleto(codigoDeputado: string | number): Promise<PerfilCompletoResult>;
    /**
     * Extrai dados básicos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Dados básicos do deputado
     */
    extractDadosBasicos(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai despesas de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Despesas do deputado
     */
    extractDespesas(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai discursos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @param legislatura - Número da legislatura (opcional)
     * @returns Discursos do deputado
     */
    extractDiscursos(codigoDeputado: string | number, legislatura?: number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai eventos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Eventos do deputado
     */
    extractEventos(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai órgãos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Órgãos do deputado
     */
    extractOrgaos(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai frentes parlamentares de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Frentes do deputado
     */
    extractFrentes(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai ocupações de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Ocupações do deputado
     */
    extractOcupacoes(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai mandatos externos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Mandatos externos do deputado
     */
    extractMandatosExternos(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai histórico de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Histórico do deputado
     */
    extractHistorico(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai profissões de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Profissões do deputado
     */
    extractProfissoes(codigoDeputado: string | number): Promise<PerfilDeputadoResult>;
    /**
     * Extrai perfil completo de múltiplos deputados
     * @param deputados - Lista de códigos de deputados
     * @param concurrency - Número de requisições simultâneas
     * @param maxRetries - Número máximo de retentativas por deputado
     * @returns Perfis completos extraídos
     */
    extractMultiplosPerfis(deputados: (string | number)[], concurrency?: number, maxRetries?: number): Promise<PerfilCompletoResult[]>;
    /**
     * Extrai perfil completo de um deputado com retentativas
     * @param codigoDeputado - Código do deputado
     * @param maxRetries - Número máximo de retentativas
     * @returns Perfil completo
     */
    private extractPerfilCompletoComRetry;
}
