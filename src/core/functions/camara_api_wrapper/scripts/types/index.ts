/**
 * Exportações centralizadas dos tipos do sistema ETL
 */

export * from './etl.types';

// Re-exportar tipos específicos para facilitar importação
export type {
  ETLOptions,
  ETLResult,
  ETLError,
  ProcessingContext,
  ProcessingStats,
  ProcessingCache,
  ProcessingMetadata,
  ValidationResult,
  ExportOptions,
  IETLProcessor,
  DeputadoBasico,
  PerfilDeputado,
  SenadorFiltro,
  BatchResult,
  RetryConfig,
  ProgressEvent,
  ProgressCallback
} from './etl.types';

export { ProcessingStatus } from './etl.types';
