/**
 * Processador ETL para Discursos de Deputados da Câmara
 *
 * Implementa o fluxo ETL completo para extrair, transformar e carregar
 * discursos de deputados com suporte a paginação e modo incremental.
 */
import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult, DiscursoDeputado, DeputadoBasico, ETLOptions } from '../types/etl.types';
/**
 * Dados extraídos da API
 */
interface ExtractedData {
    deputados: DeputadoBasico[];
    discursosPorDeputado: Array<{
        deputadoId: string;
        discursos: any[];
        totalDiscursos: number;
        totalPaginas: number;
        erro?: string;
    }>;
    totalProcessados: number;
}
/**
 * Dados transformados
 */
interface TransformedData {
    discursos: DiscursoDeputado[];
    estatisticas: {
        totalDiscursos: number;
        deputadosComDiscursos: number;
        discursosPorAno: Record<number, number>;
        discursosPorTipo: Record<string, number>;
        discursosComTranscricao: number;
        discursosComPalavrasChave: number;
    };
}
/**
 * Processador de Discursos de Deputados
 */
export declare class DiscursosDeputadosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
    private storageManager;
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
     * Valida formato de data
     */
    private isValidDate;
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
     * Extrai discursos de múltiplos deputados
     */
    private extractDiscursosDeputados;
    /**
     * Extrai discursos completos de um deputado
     */
    private extractDiscursosCompletos;
    /**
     * Extrai discursos em modo incremental (últimos 60 dias)
     */
    private extractDiscursosIncremental;
    /**
     * Transformação dos dados extraídos
     */
    transform(data: ExtractedData): Promise<TransformedData>;
    /**
     * Transforma discurso individual
     */
    private transformDiscurso;
    /**
     * Extrai palavras-chave do formato da API
     */
    private extractPalavrasChave;
    /**
     * Carregamento dos dados transformados
     */
    load(data: TransformedData): Promise<BatchResult>;
    /**
     * Agrupa discursos por deputado
     */
    private groupDiscursosByDeputado;
    /**
     * Calcula estatísticas específicas do deputado
     */
    private calculateDeputadoStats;
}
export {};
