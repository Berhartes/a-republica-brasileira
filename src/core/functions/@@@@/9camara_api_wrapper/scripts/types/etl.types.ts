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
  deputado?: string; // Adicionado para filtro de deputado específico

  // Opções de extração de dados complementares
  mandatos?: boolean;
  filiacoes?: boolean;
  fotos?: boolean;
  orgaos?: boolean;
  frentes?: boolean;

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

  // Concorrência para extração de perfis
  concorrencia?: number;
  [key: string]: any; // Assinatura de índice para permitir propriedades dinâmicas
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
  detalhes?: any; // Flexibilizado para aceitar diferentes estruturas de detalhes
  erros?: ETLError[];
}

// Manter DespesasETLResultDetails para uso interno do processador de despesas, se necessário,
// mas não será mais o tipo direto de ETLResult.detalhes.
// export interface DespesasETLResultDetails {
//   despesasSalvas?: number;
//   deputadosProcessados?: number;
//   metadadosSalvos?: boolean;
//   batchResults?: Array<{
//     id: string;
//     status: 'sucesso' | 'falha';
//     erro?: string;
//   }>;
// }

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
  // Dados pessoais
  cpf?: string;
  sexo?: string;
  dataNascimento?: string;
  dataFalecimento?: string;
  municipioNascimento?: string;
  ufNascimento?: string;
  escolaridade?: string;

  // Dados de contato
  email?: string;

  // Dados políticos
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
    nomePartido?: string; // Adicionado para incluir o nome do partido
    dataInicio?: string;
    dataFim?: string;
  }>;

  // Dados complementares
  orgaos?: any[];
  frentes?: any[];
  ocupacoes?: any[];
  mandatosExternos?: any[];
  historico?: any[];
  profissoes?: any[];

  // Metadados
  dataUltimaAtualizacao?: string;
  dataExtracao?: string;
}

/**
 * Tipos específicos para discursos de deputados
 */
export interface DiscursoDeputado {
  // Dados básicos
  id: string; // ID único do discurso
  idDeputado: string; // ID do deputado que proferiu o discurso
  dataHoraInicio: string; // Data e hora de início do discurso
  dataHoraFim?: string; // Data e hora de fim do discurso (opcional)
  tipoDiscurso: string; // Tipo de discurso (ex: "Pronunciamento em Plenário")

  // Conteúdo
  sumario?: string; // Resumo ou sumário do discurso
  transcricao?: string; // Transcrição completa do discurso
  palavrasChave?: string[]; // Palavras-chave associadas ao discurso

  // Evento/Contexto
  faseEvento?: string; // Fase do evento em que o discurso ocorreu (ex: "Orador Inscrito")
  tipoEvento?: string; // Tipo de evento (ex: "Sessão Deliberativa")
  codEvento?: string; // Código do evento associado

  // URLs e recursos
  urlAudio?: string; // URL para o áudio do discurso
  urlTexto?: string; // URL para o texto do discurso (se houver)

  // Metadados
  dataExtracao: string; // Data em que o dado foi extraído
  anoDiscurso: number; // Ano do discurso (extraído da dataHoraInicio)
  mesDiscurso: number; // Mês do discurso (extraído da dataHoraInicio)
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
  codDocumento?: string; // Alterado para string
  tipoDespesa?: string;
  valorLiquido?: number;
  valorRestituicao?: number;
  numRessarcimento?: string;
  codLote?: number;
  codTipoDocumento?: string; // Alterado para string
  numDocumento?: string; // Adicionado
  valorGlosa?: number; // Adicionado
  parcela?: number; // Adicionado
  dataExtracao?: string;
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
  tempoOperacao?: number; // Adicionado para incluir o tempo de operação do batch
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
