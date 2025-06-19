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
  // Identificação e filtros
  legislatura?: number;
  limite?: number;
  senador?: string;
  
  // Destino dos dados
  destino: 'firestore' | 'emulator' | 'pc';
  
  // Configurações de execução
  verbose?: boolean;
  dryRun?: boolean;
  forceUpdate?: boolean;
  
  // Filtros adicionais
  dataInicio?: string;
  dataFim?: string;
  partido?: string;
  uf?: string;
}

/**
 * Resultado padrão de processamento ETL
 */
export interface ETLResult {
  // Métricas principais
  sucessos: number;
  falhas: number;
  avisos: number;
  
  // Tempos
  tempoProcessamento: number;
  tempoExtracao?: number;
  tempoTransformacao?: number;
  tempoCarregamento?: number;
  
  // Identificação
  destino: string;
  legislatura?: number;
  
  // Detalhes
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
  // Tempos
  inicio: number;
  fim?: number;
  
  // Contadores
  processados: number;
  erros: number;
  avisos: number;
  ignorados: number;
  
  // Detalhes por etapa
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
  detalhes: Array<{
    id: string;
    status: 'sucesso' | 'falha';
    erro?: string;
  }>;
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
export enum ProcessingStatus {
  INICIADO = 'INICIADO',
  EXTRAINDO = 'EXTRAINDO',
  TRANSFORMANDO = 'TRANSFORMANDO',
  CARREGANDO = 'CARREGANDO',
  FINALIZADO = 'FINALIZADO',
  ERRO = 'ERRO',
  CANCELADO = 'CANCELADO'
}

/**
 * Evento de progresso
 */
export interface ProgressEvent {
  status: ProcessingStatus;
  progresso: number; // 0-100
  mensagem: string;
  detalhes?: any;
}

/**
 * Callback de progresso
 */
export type ProgressCallback = (event: ProgressEvent) => void;
