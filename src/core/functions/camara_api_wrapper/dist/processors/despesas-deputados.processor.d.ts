/**
 * Processador ETL para Despesas de Deputados da Câmara
 *
 * Implementa o fluxo ETL completo para extrair, transformar e carregar
 * despesas de deputados com suporte a paginação e modo incremental.
 */
import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, DespesaDeputado, DeputadoBasico, ETLOptions, // Importar ProcessingStatus
ETLResult } from '../types/etl.types';
/**
 * Dados extraídos da API
 */
interface ExtractedData {
    deputados: DeputadoBasico[];
    despesasPorDeputado: Array<{
        deputadoId: string;
        despesas: any[];
        totalDespesas: number;
        totalPaginas: number;
        valorTotal: number;
        erro?: string;
    }>;
    totalProcessados: number;
}
/**
 * Dados transformados
 */
interface TransformedData {
    despesas: DespesaDeputado[];
    estatisticas: {
        totalDespesas: number;
        deputadosComDespesas: number;
        valorTotalGeral: number;
        despesasPorAno: Record<number, number>;
        despesasPorTipo: Record<string, number>;
    };
}
/**
 * Processador de Despesas de Deputados
 */
export declare class DespesasDeputadosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
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
     * Extrai despesas de múltiplos deputados
     */
    private extractDespesasDeputados;
    /**
     * Extrai despesas completas de um deputado
     */
    private extractDespesasCompletas;
    /**
     * Extrai despesas em modo incremental (últimos 2 meses)
     */
    private extractDespesasIncremental;
    /**
     * Extrai despesas de um mês específico
     */
    private extractDespesasPorMes;
    /**
     * Transformação dos dados extraídos
     */
    transform(data: ExtractedData): Promise<TransformedData>;
    /**
     * Transforma despesa individual
     */
    private transformDespesa;
    /**
     * Carregamento dos dados transformados
     */
    load(data: TransformedData): Promise<ETLResult>;
    /**
     * Agrupa despesas por deputado
     */
    private groupDespesasByDeputado;
    /**
     * Calcula estatísticas específicas do deputado
     */
    private calculateDeputadoStats;
}
export {};
