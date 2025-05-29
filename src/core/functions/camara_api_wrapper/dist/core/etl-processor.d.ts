/**
 * Processador base para ETL do Senado Federal
 *
 * Esta classe abstrata implementa o padrão Template Method para
 * garantir um fluxo ETL consistente em todos os processadores.
 */
import { ETLOptions, ETLResult, ProcessingContext, ValidationResult, ProcessingStatus, ProgressCallback, IETLProcessor } from '../types/etl.types';
/**
 * Classe base abstrata para processadores ETL
 */
export declare abstract class ETLProcessor<TExtracted, TTransformed> implements IETLProcessor<TExtracted, TTransformed> {
    protected context: ProcessingContext;
    private progressCallbacks;
    constructor(options: ETLOptions);
    /**
     * Inicializa as estatísticas de processamento
     */
    private initializeStats;
    /**
     * Registra as configurações atuais
     */
    private logConfiguration;
    /**
     * Registra um callback de progresso
     */
    onProgress(callback: ProgressCallback): void;
    /**
     * Emite um evento de progresso
     */
    protected emitProgress(status: ProcessingStatus, progresso: number, mensagem: string, detalhes?: any): void;
    /**
     * Obtém emoji para o status
     */
    private getStatusEmoji;
    /**
     * Processa o fluxo ETL completo
     */
    process(): Promise<ETLResult>;
    /**
     * Finaliza execução em modo dry-run
     */
    private finalizeDryRun;
    /**
     * Finaliza o processamento e prepara o resultado
     */
    protected finalize(loadResult: any, tempoExtracao: number, tempoTransformacao: number, tempoCarregamento: number): ETLResult;
    /**
     * Registra o resultado do processamento
     */
    private logResultado;
    /**
     * Métodos abstratos que devem ser implementados pelas subclasses
     */
    /**
     * Retorna o nome do processo para logs
     */
    protected abstract getProcessName(): string;
    /**
     * Valida as opções e configurações antes de processar
     */
    abstract validate(): Promise<ValidationResult>;
    /**
     * Extrai os dados da fonte
     */
    abstract extract(): Promise<TExtracted>;
    /**
     * Transforma os dados extraídos
     */
    abstract transform(data: TExtracted): Promise<TTransformed>;
    /**
     * Carrega os dados transformados no destino
     */
    abstract load(data: TTransformed): Promise<any>;
    /**
     * Métodos auxiliares para as subclasses
     */
    /**
     * Incrementa contador de processados
     */
    protected incrementProcessed(count?: number): void;
    /**
     * Incrementa contador de erros
     */
    protected incrementErrors(count?: number): void;
    /**
     * Incrementa contador de avisos
     */
    protected incrementWarnings(count?: number): void;
    /**
     * Registra estatísticas de extração
     */
    protected updateExtractionStats(total: number, sucesso: number, falha: number): void;
    /**
     * Registra estatísticas de transformação
     */
    protected updateTransformationStats(total: number, sucesso: number, falha: number): void;
    /**
     * Registra estatísticas de carregamento
     */
    protected updateLoadStats(total: number, sucesso: number, falha: number): void;
    /**
     * Incrementa contador de sucessos na extração
     */
    protected incrementSucessos(count?: number): void;
    /**
     * Incrementa contador de falhas na extração
     */
    protected incrementFalhas(count?: number): void;
    /**
     * Validação comum de parâmetros para todos os processadores
     */
    protected validateCommonParams(): ValidationResult;
}
