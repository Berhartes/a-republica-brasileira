/**
 * Processador ETL para Perfis de Deputados da Câmara
 *
 * Implementa o fluxo ETL completo para extrair, transformar e carregar
 * perfis completos de deputados incluindo mandatos, filiações e histórico.
 */
import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, PerfilDeputado, DeputadoBasico, ETLOptions } from '../types/etl.types';
/**
 * Dados extraídos da API
 */
interface ExtractedData {
    deputadosLegislatura: DeputadoBasico[];
    perfisCompletos: any[];
    totalProcessados: number;
}
/**
 * Dados transformados
 */
interface TransformedData {
    perfis: PerfilDeputado[];
    estatisticas: {
        totalPerfis: number;
        comMandatos: number;
        comFiliacoes: number;
        comFotos: number;
    };
}
/**
 * Processador de Perfis de Deputados
 */
export declare class PerfilDeputadosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
    private rawPerfisCompletos;
    constructor(options: ETLOptions);
    /**
     * Nome do processador
     */
    protected getProcessName(): string;
    /**
     * Validação específica do processador
     */
    validate(): Promise<ValidationResult>;
    /**
     * Extração de dados da API da Câmara
     */
    extract(): Promise<ExtractedData>;
    /**
     * Extrai deputado específico
     */
    private extractDeputadoEspecifico;
    /**
     * Extrai lista de deputados da legislatura
     */
    private extractDeputadosLegislatura;
    /**
     * Aplica filtros aos deputados
     */
    private applyFilters;
    /**
     * Remove deputados duplicados baseado no ID
     *
     * A API da Câmara dos Deputados às vezes retorna o mesmo deputado múltiplas vezes
     * na mesma lista (geralmente devido a mudanças de partido). Esta função remove
     * as duplicatas mantendo apenas a primeira ocorrência de cada deputado.
     */
    private deduplicateDeputados;
    /**
     * Extrai perfis completos de deputados
     */
    private extractPerfisCompletos;
    /**
     * Extrai perfil completo de um deputado
     *
     * ⚠️ CORREÇÃO CRÍTICA: Na API da Câmara dos Deputados, os mandatos e filiações
     * vêm DENTRO do perfil básico, não em endpoints separados como no Senado!
     */
    private extractPerfilCompleto;
    /**
     * Extrai órgãos de um deputado
     */
    private extractOrgaos;
    /**
     * Extrai frentes parlamentares de um deputado
     */
    private extractFrentes;
    /**
     * Extrai ocupações de um deputado
     */
    private extractOcupacoes;
    /**
     * Extrai mandatos externos de um deputado
     */
    private extractMandatosExternos;
    /**
     * Extrai histórico de um deputado
     */
    private extractHistorico;
    /**
     * Extrai profissões de um deputado
     */
    private extractProfissoes;
    /**
     * Transformação dos dados extraídos
     */
    transform(data: ExtractedData): Promise<TransformedData>;
    /**
     * Transforma perfil individual
     */
    private transformPerfil;
    /**
     * Carregamento dos dados transformados
     */
    load(data: TransformedData): Promise<any>;
    /**
     * Cria índice por partido
     */
    private createIndexByParty;
    /**
     * Cria índice por UF
     */
    private createIndexByUF;
    /**
     * Cria índice por situação
     */
    private createIndexBySituation;
}
export {};
