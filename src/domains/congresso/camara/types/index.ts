// src/domains/congresso/camara/types/index.ts

export interface Deputado {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string;
  email?: string;
}

export interface DeputadoDetalhado extends Deputado {
  nomeCivil?: string;
  dataNascimento?: string;
  municipioNascimento?: string;
  ufNascimento?: string;
  escolaridade?: string;
  situacao?: string;
  condicaoEleitoral?: string;
  gabinete?: {
    nome?: string;
    predio?: string;
    andar?: string;
    sala?: string;
    telefone?: string;
    email?: string;
  };
  redesSociais?: string[];
}

export interface Proposicao {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
  autor?: {
    id: number;
    nome: string;
    siglaPartido: string;
    siglaUf: string;
  };
  statusProposicao?: {
    dataHora: string;
    sequencia: number;
    siglaOrgao: string;
    regime: string;
    descricaoTramitacao: string;
    descricaoSituacao: string;
    despacho: string;
  };
}

export interface Votacao {
  id: number;
  data: string;
  hora: string;
  descricao: string;
  proposicao: {
    id: number;
    siglaTipo: string;
    numero: number;
    ano: number;
  };
  votos: Array<{
    deputado: {
      id: number;
      nome: string;
      siglaPartido: string;
      siglaUf: string;
    };
    voto: string;
  }>;
}

export interface Despesa {
  id: number;
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: string;
  tipoDocumento: string;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  urlDocumento?: string;
}

export interface Presenca {
  id: number;
  data: string;
  hora: string;
  deputado: {
    id: number;
    nome: string;
    siglaPartido: string;
    siglaUf: string;
  };
  tipo: 'sessao' | 'comissao';
  presente: boolean;
  justificativa?: string;
}

export interface ApiResponse<T> {
  dados: T;
  links: Array<{
    rel: string;
    href: string;
  }>;
}

export interface ApiPaginatedResponse<T> extends ApiResponse<T> {
  paginacao?: {
    pagina: number;
    total: number;
    itens: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export interface RequestParams {
  [key: string]: string | number | boolean | undefined;
}