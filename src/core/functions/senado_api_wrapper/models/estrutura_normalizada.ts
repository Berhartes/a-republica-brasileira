/**
 * Interfaces para a estrutura normalizada de dados do Senado Federal no Firestore
 * 
 * Este arquivo define as interfaces para a nova estrutura normalizada de dados,
 * seguindo boas práticas de modelagem para o Firestore.
 */

/**
 * Metadados padrão para todos os documentos
 */
export interface Metadados {
  /** Origem dos dados (endpoint da API) */
  origem: string;
  /** Versão da estrutura de dados */
  versaoEstrutura: string;
  /** Timestamp da última atualização */
  ultimaAtualizacao: string;
  /** Script que processou os dados */
  processadoPor: string;
}

/**
 * Senador (documento principal)
 */
export interface Senador {
  /** Código do senador */
  codigo: string;
  /** Nome parlamentar */
  nome: string;
  /** Nome completo */
  nomeCompleto: string;
  /** Gênero */
  genero: string;
  /** URL da foto */
  foto: string;
  /** URL da página oficial */
  paginaOficial: string;
  /** URL da página particular */
  paginaParticular: string;
  /** Email */
  email: string;
  /** Partido atual */
  partido: {
    sigla: string;
    nome: string | null;
  };
  /** Estado */
  uf: string;
  /** Telefones */
  telefones: {
    numero: string;
    tipo: string;
  }[];
  /** Situação atual */
  situacaoAtual: {
    emExercicio: boolean;
    afastado: boolean;
    titular: boolean;
    suplente: boolean;
    cargoMesa: boolean;
    cargoLideranca: boolean;
    motivoAfastamento: string | null;
  };
  /** Dados pessoais */
  dadosPessoais: {
    dataNascimento: string;
    naturalidade: string;
    ufNaturalidade: string;
    enderecoParlamentar: string;
  };
  /** Mandato atual (referência) */
  mandatoAtualId: string | null;
  /** Metadados */
  metadados: Metadados;
}

/**
 * Mandato (subcoleção de senadores)
 */
export interface Mandato {
  /** ID do mandato */
  id: string;
  /** Código do mandato */
  codigo: string;
  /** Tipo de participação (Titular, 1º Suplente, etc.) */
  participacao: string;
  /** Número da legislatura */
  legislatura: string;
  /** Data de início */
  dataInicio: string;
  /** Data de fim (null se ainda em andamento) */
  dataFim: string | null;
  /** Estado */
  uf: string;
  /** Referência ao titular (se for suplente) */
  titularId: string | null;
  /** Referência aos suplentes (se for titular) */
  suplentesIds: string[] | null;
  /** Primeira legislatura */
  primeiraLegislatura: {
    numero: string;
    dataInicio: string;
    dataFim: string;
  };
  /** Segunda legislatura */
  segundaLegislatura: {
    numero: string;
    dataInicio: string;
    dataFim: string;
  };
  /** Metadados */
  metadados: Metadados;
}

/**
 * Exercício (subcoleção de mandatos)
 */
export interface Exercicio {
  /** ID do exercício */
  id: string;
  /** Código do exercício */
  codigo: string;
  /** Data de início */
  dataInicio: string;
  /** Data de fim (null se ainda em andamento) */
  dataFim: string | null;
  /** Causa do afastamento */
  causaAfastamento: string | null;
  /** Descrição da causa do afastamento */
  descricaoCausaAfastamento: string | null;
  /** Metadados */
  metadados: Metadados;
}

/**
 * Comissão (coleção separada)
 */
export interface Comissao {
  /** Código da comissão */
  codigo: string;
  /** Sigla da comissão */
  sigla: string;
  /** Nome completo da comissão */
  nome: string;
  /** Casa legislativa (SF, CD, CN) */
  casa: string;
  /** Metadados */
  metadados: Metadados;
}

/**
 * Cargo (subcoleção de senadores)
 */
export interface Cargo {
  /** ID do cargo */
  id: string;
  /** Tipo de cargo */
  tipo: {
    codigo: string;
    descricao: string;
  };
  /** Referência à comissão */
  comissaoId: string;
  /** Data de início */
  dataInicio: string;
  /** Data de fim (null se ainda em andamento) */
  dataFim: string | null;
  /** Indica se o cargo é atual */
  atual: boolean;
  /** Metadados */
  metadados: Metadados;
}

/**
 * Participação em Comissão (subcoleção de senadores)
 */
export interface ParticipacaoComissao {
  /** ID da participação */
  id: string;
  /** Referência à comissão */
  comissaoId: string;
  /** Tipo de participação (Titular, Suplente) */
  participacao: string;
  /** Data de início */
  dataInicio: string;
  /** Data de fim (null se ainda em andamento) */
  dataFim: string | null;
  /** Indica se a participação é atual */
  atual: boolean;
  /** Metadados */
  metadados: Metadados;
}

/**
 * Filiação Partidária (subcoleção de senadores)
 */
export interface FiliacaoPartidaria {
  /** ID da filiação */
  id: string;
  /** Partido */
  partido: {
    codigo: string;
    sigla: string;
    nome: string;
  };
  /** Data de filiação */
  dataFiliacao: string;
  /** Data de desfiliação (null se ainda filiado) */
  dataDesfiliacao: string | null;
  /** Indica se é a filiação atual */
  atual: boolean;
  /** Metadados */
  metadados: Metadados;
}

/**
 * Licença (subcoleção de senadores)
 */
export interface Licenca {
  /** ID da licença */
  id: string;
  /** Código da licença */
  codigo: string;
  /** Tipo de licença */
  tipo: {
    sigla: string;
    descricao: string;
  };
  /** Data de início */
  dataInicio: string;
  /** Data de fim */
  dataFim: string;
  /** Indica se a licença é atual */
  atual: boolean;
  /** Metadados */
  metadados: Metadados;
}

/**
 * Liderança (subcoleção de senadores)
 */
export interface Lideranca {
  /** ID da liderança */
  id: string;
  /** Código da liderança */
  codigo: number;
  /** Casa legislativa */
  casa: string;
  /** Tipo de unidade */
  tipoUnidade: {
    codigo: number;
    sigla: string;
    descricao: string;
  };
  /** Tipo de liderança */
  tipoLideranca: {
    codigo: string;
    sigla: string;
    descricao: string;
  };
  /** Data de designação */
  dataDesignacao: string;
  /** Data de término (null se ainda em andamento) */
  dataTermino: string | null;
  /** Indica se a liderança é atual */
  atual: boolean;
  /** Partido da liderança */
  partido: {
    codigo: number;
    sigla: string;
    nome: string;
  };
  /** Metadados */
  metadados: Metadados;
}
