import { Timestamp } from 'firebase/firestore';

/**
 * Tipos para integração com Firebase
 */

/**
 * Interface base para documentos do Firestore
 */
export interface FirebaseDocument {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Despesa de um senador registrada no Firestore
 */
export interface FirebaseDespesa extends FirebaseDocument {
  ano: number;
  mes: number;
  tipo: string;
  valor: number;
  fornecedor?: string;
  descricao?: string;
  dataDocumento?: Timestamp;
  urlDocumento?: string;
  senadorId: number;
}

/**
 * Votação registrada no Firestore com os votos de cada senador
 */
export interface FirebaseVotacao extends FirebaseDocument {
  data: Timestamp;
  descricao: string;
  resultado: string;
  materiaId?: string;
  votos: Record<string, FirebaseVoto>;
}

export interface FirebaseVoto {
  voto: string;
  data: Timestamp;
}

/**
 * Matéria legislativa registrada no Firestore
 */
export interface FirebaseMateria extends FirebaseDocument {
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  explicacao?: string;
  autor?: string;
  dataApresentacao?: Timestamp;
  ultimaAtualizacao?: Timestamp;
  status?: string;
}

/**
 * Afastamento de um senador durante um mandato
 */
export interface FirebaseAfastamento {
  inicio: Timestamp;
  fim?: Timestamp;
  causa: string;
  descricao?: string;
}

/**
 * Mandato de um senador
 */
export interface FirebaseMandato {
  inicio: Timestamp;
  fim: Timestamp;
  descricao: string;
  afastamentos?: FirebaseAfastamento[];
}

/**
 * Participação de um senador em uma comissão
 */
export interface FirebaseComissaoParticipacao {
  codigo: string;
  sigla: string;
  nome: string;
  cargo: string;
  dataInicio: Timestamp;
  dataFim?: Timestamp;
  ativa: boolean;
}

/**
 * Rede social de um senador
 */
export interface FirebaseRedeSocial {
  nome: string;
  url: string;
}

/**
 * Senador registrado no Firestore
 */
export interface FirebaseSenador extends FirebaseDocument {
  nome: string;
  nomeCivil: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string;
  email?: string;
  sexo: "M" | "F";
  dataNascimento?: Timestamp;
  naturalidade?: string;
  profissao?: string;
  escolaridade?: string;
  redeSocial?: FirebaseRedeSocial[];
  mandatos?: FirebaseMandato[];
  comissoes?: FirebaseComissaoParticipacao[];
  ultimaAtualizacao: Timestamp;
  ativo: boolean;
}

/**
 * Informação sobre participação em comissão
 */
export interface FirebaseMembroComissao {
  cargo: string;
  dataInicio: Timestamp;
  dataFim?: Timestamp;
}

/**
 * Comissão parlamentar registrada no Firestore
 */
export interface FirebaseComissao extends FirebaseDocument {
  sigla: string;
  nome: string;
  descricao?: string;
  membros: Record<string, FirebaseMembroComissao>;
}

/**
 * Registro de presença de um senador
 */
export interface FirebasePresenca extends FirebaseDocument {
  senadorId: string;
  data: Timestamp;
  tipo: 'sessao' | 'comissao';
  presente: boolean;
  justificativa?: string;
  sessaoId?: string;
  comissaoId?: string;
}

/**
 * Tramitação de uma proposição legislativa
 */
export interface FirebaseTramitacao {
  data: Timestamp;
  local: string;
  status: string;
  descricao: string;
}

/**
 * Proposição legislativa registrada no Firestore
 */
export interface FirebaseProposicao extends Omit<FirebaseDocument, 'id'> {
  id: string;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  autor: string;
  situacao: string;
  dataApresentacao: Timestamp;
  ultimaAtualizacao: Timestamp;
  tramitacoes: FirebaseTramitacao[];
}

/**
 * Metadados de atualização no Firebase
 */
export interface FirebaseMetadata {
  ultimaAtualizacao: {
    deputados?: Timestamp;
    senadores?: Timestamp;
    proposicoes?: Timestamp;
    votacoes?: Timestamp;
    despesas?: Timestamp;
  };
  status?: {
    [operacao: string]: {
      status: 'em_andamento' | 'concluido' | 'erro';
      iniciado: Timestamp;
      concluido?: Timestamp;
      mensagem?: string;
    }
  };
}

/**
 * Configurações do sistema armazenadas no Firebase
 */
export interface FirebaseConfig {
  apiKeys?: {
    camara?: string;
    senado?: string;
  };
  atualizacaoAutomatica?: {
    habilitada: boolean;
    intervalos: {
      deputados: number;
      senadores: number;
      proposicoes: number;
      votacoes: number;
      despesas: number;
    }
  };
}

/**
 * Analytical data stored in Firebase
 */
export interface FirebaseAnalytics {
  id: string;
  tipo: 'votacao' | 'presenca' | 'proposicao' | 'despesa';
  titulo: string;
  descricao: string;
  periodo: {
    inicio: Timestamp;
    fim: Timestamp;
  };
  dados: any; // This could be more specific based on the analysis type
  parametros: Record<string, any>;
  dataGerado: Timestamp;
  dataPeriodoInicio: Timestamp;
  dataPeriodoFim: Timestamp;
}