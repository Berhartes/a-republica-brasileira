/**
 * Tipos relacionados ao domínio do Senado
 */

/**
 * Tipo base para um Senador
 */
export interface Senador {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
}

/**
 * Tipo para um Senador com detalhes completos
 */
export interface SenadorDetalhado extends Senador {
  nomeCivil: string;
  email?: string;
  urlFoto?: string;
  sexo: 'M' | 'F';
  biografia?: string;
  dataNascimento?: string;
  naturalidade?: string;
  mandatos: Mandato[];
  comissoes: Comissao[];
  redesSociais?: RedeSocial[];
  profissoes?: string[];
}

/**
 * Tipo para um Mandato de Senador
 */
export interface Mandato {
  inicio: string;
  fim: string;
  descricao: string;
  afastamentos?: Afastamento[];
}

/**
 * Tipo para Afastamento durante um Mandato
 */
export interface Afastamento {
  inicio: string;
  fim?: string;
  causa: string;
  descricao?: string;
}

/**
 * Tipo para Comissão Parlamentar
 */
export interface Comissao {
  id: string;
  sigla: string;
  nome: string;
  cargo: string;
  dataInicio: string;
  dataFim?: string;
  ativa: boolean;
}

/**
 * Tipo para Rede Social
 */
export interface RedeSocial {
  nome: string;
  url: string;
}

/**
 * Tipo para Proposição Legislativa
 */
export interface Proposicao {
  id: number | string;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  autor: string;
  situacao: string;
  dataApresentacao: string;
  urlDocumento?: string;
}

/**
 * Tipo para Votação
 */
export interface Votacao {
  id: string;
  data: string;
  descricao: string;
  resultado: string;
  materiaId?: string;
  votos: Voto[];
  detalhes?: {
    votosSim: number;
    votosNao: number;
    abstencoes: number;
    ausencias: number;
  };
}

/**
 * Tipo para Voto em Votação
 */
export interface Voto {
  senadorId: number | string;
  voto: 'Sim' | 'Não' | 'Abstenção' | 'Ausente';
  data: string;
}

/**
 * Tipo para Despesa
 */
export interface Despesa {
  id: string;
  senadorId: number;
  tipo: string;
  valor: number;
  data: string;
  fornecedor?: string;
  descricao?: string;
  urlDocumento?: string;
}

/**
 * Props para componentes base
 */
export interface BaseComponentProps {
  senadorId: number;
  ano?: number;
}

/**
 * Props para componente ProposicoesCard
 */
export interface ProposicoesCardProps extends BaseComponentProps {
  limite?: number;
  initialData?: Proposicao[] | null;
}

/**
 * Props para componente VotacoesPanel
 */
export interface VotacoesPanelProps extends BaseComponentProps {
  stats?: SenadorStats['votacoes'];
}

/**
 * Props para componente DespesasVisualizador
 */
export interface DespesasVisualizadorProps {
  senadorId: number;
  stats?: SenadorStats['despesas'];
}

/**
 * Props para componente PresencaChart
 */
export interface PresencaChartProps extends BaseComponentProps {
  stats?: SenadorStats['votacoes'];
}

/**
 * Estatísticas de um Senador
 */
export interface SenadorStats {
  proposicoes: {
    total: number;
    aprovadas: number;
    emTramitacao: number;
    arquivadas: number;
  };
  votacoes: {
    total: number;
    participacao: number;
    percentualSim: number;
    percentualNao: number;
  };
  despesas: {
    total: number;
    media: number;
    maiorDespesa: number;
    totalPorTipo: Record<string, number>;
  };
  comissoes: {
    total: number;
    ativas: number;
    presidencias: number;
  };
}

/**
 * Configuração de Ranking
 */
export interface RankingConfig {
  criterio: RankingCriterio;
  ordem: 'asc' | 'desc';
  limite?: number;
  filtros?: RankingFiltros;
}

/**
 * Filtros para Ranking
 */
export interface RankingFiltros {
  partido?: string;
  estado?: string;
  periodo?: {
    inicio: string;
    fim: string;
  };
  metrica?: 'despesas' | 'presenca' | 'proposicoes';
  ordenacao?: 'maior' | 'menor';
}

/**
 * Critérios para Ranking
 */
export type RankingCriterio = 
  | 'presenca'
  | 'proposicoes'
  | 'votacoes'
  | 'despesas'
  | 'economia'
  | 'transparencia';

/**
 * Item de Ranking
 */
export interface RankingItem {
  senador: Senador;
  pontuacao: number;
  detalhes: {
    [key: string]: number | string;
  };
  posicao: number;
  variacaoPosicao?: number;
}

/**
 * Resultado de Ranking
 */
export interface RankingResult {
  criterio: RankingCriterio;
  periodo: {
    inicio: string;
    fim: string;
  };
  itens: RankingItem[];
  estatisticas: {
    total: number;
    media: number;
    mediana: number;
    maximo: number;
    minimo: number;
  };
  atualizadoEm: string;
}