// src/common/types.ts

// Export new types from parlamentar module
export type { 
  DiscursoParlamentar,
  AparteParlamentar,
  HistoricoAcademico
} from "../modules/parlamentar";

// Export new types from plenario module
export type {
  PautaDaSessao,
  TipoSessao
} from "../modules/plenario";

// Export new types from votacao module
export type {
  TipoVotacao,
  VotoParlamentar
} from "../modules/votacao";

/**
 * Representa uma resposta paginada da API.
 */
export interface PagedResponse<T> {
  // A API do Senado não parece ter um formato de paginação padrão claro e consistente em todos os endpoints.
  // Esta interface pode precisar ser adaptada ou estendida conforme os padrões de cada endpoint são descobertos.
  // Por enquanto, vamos assumir uma estrutura genérica que pode ser preenchida pelos dados retornados.
  Metadados?: {
    TotalPaginas?: number;
    PaginaAtual?: number;
    QuantidadePorPagina?: number;
    TotalRegistros?: number;
    // Outros metadados que a API possa retornar
  };
  Dados: T[]; // Onde T é o tipo dos itens na lista
}

/**
 * Interface base para filtros de consulta.
 * Cada módulo pode estender esta interface para adicionar filtros específicos.
 */
export interface BaseApiFilters {
  [key: string]: any; // Permite filtros genéricos
}

/**
 * Representa um erro padrão da API.
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string; // Código de erro específico da API, se houver
  details?: any; // Detalhes adicionais do erro
}

/**
 * Tipos para os parâmetros de caminho comuns, como códigos e datas.
 */
export type Codigo = string | number;
export type DataString = string; // Formato YYYY-MM-DD ou YYYYMMDD, dependendo do endpoint

