/**
 * Tipos centralizados para o sistema ETL do Senado Federal
 *
 * Este arquivo define todas as interfaces e tipos utilizados
 * em todo o sistema ETL, garantindo consistência e type safety.
 */
import { ETLConfig } from '../config/etl.config';
import { logger } from '../utils/logging';
/**
 * Opções comuns para todos os processadores ETL
 */
export interface ETLOptions {
    legislatura?: number;
    limite?: number;
    senador?: string;
    deputado?: string;
    mandatos?: boolean;
    filiacoes?: boolean;
    fotos?: boolean;
    orgaos?: boolean;
    frentes?: boolean;
    destino: 'firestore' | 'emulator' | 'pc';
    verbose?: boolean;
    dryRun?: boolean;
    forceUpdate?: boolean;
    dataInicio?: string;
    dataFim?: string;
    partido?: string;
    uf?: string;
    concorrencia?: number;
    [key: string]: any;
}
/**
 * Resultado padrão de processamento ETL
 */
export interface ETLResult {
    sucessos: number;
    falhas: number;
    avisos: number;
    tempoProcessamento: number;
    tempoExtracao?: number;
    tempoTransformacao?: number;
    tempoCarregamento?: number;
    destino: string;
    legislatura?: number;
    detalhes?: any;
    erros?: ETLError[];
}
/**
 * Erro estruturado do ETL
 */
export interface ETLError {
    codigo: string;
    mensagem: string;
    contexto?: any;
    timestamp: string;
    stack?: string;
}
/**
 * Contexto de processamento compartilhado
 */
export interface ProcessingContext {
    options: ETLOptions;
    config: ETLConfig;
    logger: typeof logger;
    stats: ProcessingStats;
    cache?: ProcessingCache;
}
/**
 * Estatísticas de processamento
 */
export interface ProcessingStats {
    inicio: number;
    fim?: number;
    processados: number;
    erros: number;
    avisos: number;
    ignorados: number;
    extracao: {
        total: number;
        sucesso: number;
        falha: number;
    };
    transformacao: {
        total: number;
        sucesso: number;
        falha: number;
    };
    carregamento: {
        total: number;
        sucesso: number;
        falha: number;
    };
}
/**
 * Cache de processamento para evitar reprocessamento
 */
export interface ProcessingCache {
    has(key: string): boolean;
    get(key: string): any;
    set(key: string, value: any): void;
    clear(): void;
}
/**
 * Metadados de processamento
 */
export interface ProcessingMetadata {
    versao: string;
    timestamp: string;
    fonte: string;
    hash?: string;
}
/**
 * Resultado de validação
 */
export interface ValidationResult {
    valido: boolean;
    erros: string[];
    avisos: string[];
}
/**
 * Opções de exportação de dados
 */
export interface ExportOptions {
    formato: 'json' | 'csv' | 'excel';
    comprimir: boolean;
    incluirMetadados: boolean;
    caminhoPersonalizado?: string;
}
/**
 * Interface para processadores ETL
 */
export interface IETLProcessor<TExtracted, TTransformed> {
    process(): Promise<ETLResult>;
    validate(): Promise<ValidationResult>;
    extract(): Promise<TExtracted>;
    transform(data: TExtracted): Promise<TTransformed>;
    load(data: TTransformed): Promise<any>;
}
/**
 * Tipos específicos para deputados
 */
export interface DeputadoBasico {
    id: string;
    nome: string;
    nomeCivil?: string;
    siglaPartido: string;
    siglaUf: string;
    idLegislatura: number;
    urlFoto?: string;
}
export interface PerfilDeputado extends DeputadoBasico {
    cpf?: string;
    sexo?: string;
    dataNascimento?: string;
    dataFalecimento?: string;
    municipioNascimento?: string;
    ufNascimento?: string;
    escolaridade?: string;
    email?: string;
    mandatos?: Array<{
        idLegislatura: number;
        dataInicio?: string;
        dataFim?: string;
        siglaPartido: string;
        siglaUf: string;
        condicaoEleitoral?: string;
        situacao?: string;
    }>;
    filiacoes?: Array<{
        siglaPartido: string;
        nomePartido?: string;
        dataInicio?: string;
        dataFim?: string;
    }>;
    orgaos?: any[];
    frentes?: any[];
    ocupacoes?: any[];
    mandatosExternos?: any[];
    historico?: any[];
    profissoes?: any[];
    dataUltimaAtualizacao?: string;
    dataExtracao?: string;
}
/**
 * Tipos específicos para despesas de deputados
 */
export interface DespesaDeputado {
    idDocumento: string;
    idDeputado: string;
    mes: number;
    ano: number;
    tipoDocumento: string;
    dataDocumento: string;
    valorDocumento: number;
    nomeFornecedor: string;
    cnpjCpfFornecedor: string;
    urlDocumento?: string;
    codDocumento?: string;
    tipoDespesa?: string;
    valorLiquido?: number;
    valorRestituicao?: number;
    numRessarcimento?: string;
    codLote?: number;
    codTipoDocumento?: string;
    numDocumento?: string;
    valorGlosa?: number;
    parcela?: number;
    dataExtracao?: string;
}
/**
 * Tipos específicos para discursos de deputados
 */
export interface DiscursoDeputado {
    id: string;
    dataHoraInicio: string;
    dataHoraFim: string;
    tipoDiscurso: string;
    sumario: string;
    transcricao: string;
    palavrasChave: string[];
    faseEvento: string;
    tipoEvento: string;
    codEvento: string;
    urlAudio: string;
    urlTexto: string;
    idDeputado: string;
    dataExtracao: string;
    anoDiscurso: number;
    mesDiscurso: number;
}
/**
 * Tipos específicos para senadores
 */
export interface SenadorFiltro {
    codigo?: string;
    nome?: string;
    partido?: string;
    uf?: string;
    emExercicio?: boolean;
}
/**
 * Resultado de operação em batch
 */
export interface BatchResult {
    total: number;
    processados: number;
    sucessos: number;
    falhas: number;
    tempoOperacao?: number;
    detalhes?: any;
}
/**
 * Detalhes específicos para o resultado do processador de discursos
 */
export interface DiscursosBatchResultDetails {
    discursosSalvos: number;
    deputadosProcessados: number;
    metadadosSalvos: boolean;
    batchResults: BatchResult[];
}
/**
 * Configuração de retry
 */
export interface RetryConfig {
    maxAttempts: number;
    delay: number;
    backoff: 'linear' | 'exponential';
    shouldRetry?: (error: any, attempt: number) => boolean;
}
/**
 * Status de processamento
 */
export declare enum ProcessingStatus {
    INICIADO = "INICIADO",
    EXTRAINDO = "EXTRAINDO",
    TRANSFORMANDO = "TRANSFORMANDO",
    CARREGANDO = "CARREGANDO",
    FINALIZADO = "FINALIZADO",
    ERRO = "ERRO",
    CANCELADO = "CANCELADO"
}
/**
 * Evento de progresso
 */
export interface ProgressEvent {
    status: ProcessingStatus;
    progresso: number;
    mensagem: string;
    detalhes?: any;
}
/**
 * Callback de progresso
 */
export type ProgressCallback = (event: ProgressEvent) => void;
