/**
 * Tipos para o domínio do Senado
 */

/**
 * Tipo base para um Senador
 */
export interface Senador {
  id: string | number;
  nome: string;
  nomeCivil?: string; // Tornando opcional
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string;
  email?: string;
  emExercicio?: boolean;
  sexo?: string;
  // Propriedade estendida para compatibilidade com a API do Senado
  IdentificacaoParlamentar?: {
    CodigoParlamentar: string;
    NomeParlamentar: string;
    NomeCompletoParlamentar: string;
    SexoParlamentar: string;
    FormaTratamento: string;
    UrlFotoParlamentar: string;
    UrlPaginaParlamentar: string;
    EmailParlamentar: string;
    SiglaPartidoParlamentar: string;
    UfParlamentar: string;
  };
}

/**
 * Tipo para um Mandato
 */
export interface Mandato {
  inicio: Date;
  fim?: Date | null; // Agora aceita null
  tipo: string;
  descricao: string;
  suplentes?: {
    id: string;
    nome: string;
    grau: string | number;
    urlFoto?: string;
  }[];
  afastamentos?: {
    dataInicio: Date;
    dataFim?: Date | null; // Agora aceita null
    motivo: string;
  }[];
}

/**
 * Tipo para uma comissão
 */
export interface Comissao {
  id: string;
  sigla: string;
  nome: string;
  cargo: string;
  dataInicio?: Date | null;
  dataFim?: Date | null;
}

/**
 * Tipo para detalhes do Senador
 */
export interface SenadorDetalhado extends Senador {
  mandatos: Mandato[];
  comissoes?: Comissao[];
  biografia?: string;
  profissao?: string;
  dataNascimento?: Date | null;
  naturalidade?: string;
  ufNascimento?: string;
  redes?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    site?: string;
  };
}

/**
 * Tipo de voto em uma votação
 */
export enum TipoVoto {
  SIM = 'Sim',
  NAO = 'Não',
  ABSTENCAO = 'Abstenção',
  AUSENTE = 'Ausente',
  OBSTRUCAO = 'Obstrução',
  NAO_VOTOU = 'Não Votou',
  PRESIDENTE = 'Presidente (art. 51 RISF)',
  OUTROS = 'Outros'
}

/**
 * Tipo para um voto
 */
export interface Voto {
  senadorId: string;
  voto: string;
  data?: Date | null;
  orientacaoBancada?: string;
  partido?: string;
  uf?: string;
  nome?: string;
}

/**
 * Tipo para uma votação
 */
export interface Votacao {
  id: string;
  descricao: string;
  data: Date;
  resultado: string;
  votos: Voto[];
  siglaMateria?: string;
  numeroMateria?: string;
  anoMateria?: number;
  materia?: {
    id: string;
    sigla: string;
    numero: number;
    ano: number;
    ementa: string;
    autor?: string;
  };
  resumoVotos?: {
    sim: number;
    nao: number;
    abstencao: number;
    ausente: number;
    total: number;
  };
}

/**
 * Tipo para uma matéria legislativa
 */
export interface Materia {
  id: string;
  sigla: string;
  numero: number;
  ano: number;
  ementa: string;
  explicacao?: string;
  autor?: string;
  situacao?: string;
  dataApresentacao?: Date | null;
  ultimaAtualizacao?: Date | null;
  tramitacoes?: {
    data: Date;
    local: string;
    status: string;
    descricao: string;
  }[];
  votacoesIds?: string[];
}

/**
 * Tipo para uma despesa
 */
export interface Despesa {
  id: string;
  tipo: string;
  senadorId: string;
  ano: number;
  mes: number;
  valor: number;
  descricao?: string;
  fornecedor?: string;
  dataDocumento?: Date;
  urlDocumento?: string;
}

/**
 * Tipo para uma presença
 */
export interface Presenca {
  id: string;
  senadorId: string;
  data: Date;
  tipo: 'sessao' | 'comissao';
  presente: boolean;
  justificativa?: string;
  sessaoId?: string;
  comissaoId?: string;
}

/**
 * Tipos para parâmetros de API
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface GetSenadoresParams extends PaginationParams {
  uf?: string;
  partido?: string;
  emExercicio?: boolean;
}

export interface GetVotacoesParams extends PaginationParams {
  senadorId?: string;
  dataInicio?: string | Date;
  dataFim?: string | Date;
  siglaMateria?: string;
}

export interface GetMateriasParams extends PaginationParams {
  senadorId?: string;
  dataInicio?: string | Date;
  dataFim?: string | Date;
  tipo?: string;
  situacao?: string;
}

export interface GetDespesasParams extends PaginationParams {
  senadorId: string;
  ano?: number;
  mes?: number;
  tipo?: string;
}

/**
 * Tipo para respostas paginadas
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Tipo para erros da API
 */
export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

/**
 * Tipo para configuração da API do Senado
 */
export interface SenadoApiConfig {
  baseURL: string;
  timeout: number;
  endpoints: {
    parlamentares: string;
    materias: string;
    votacoes: string;
    despesas: string;
    presencas: string;
  };
  cache: {
    enabled: boolean;
    defaultTTL: number;
    ttlByEntity: Record<string, number>;
  };
}
