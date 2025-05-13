export type { DiscursoParlamentar, AparteParlamentar, HistoricoAcademico } from "../modules/parlamentar";
export type { PautaDaSessao, TipoSessao } from "../modules/plenario";
export type { TipoVotacao, VotoParlamentar } from "../modules/votacao";
/**
 * Representa uma resposta paginada da API.
 */
export interface PagedResponse<T> {
    Metadados?: {
        TotalPaginas?: number;
        PaginaAtual?: number;
        QuantidadePorPagina?: number;
        TotalRegistros?: number;
    };
    Dados: T[];
}
/**
 * Interface base para filtros de consulta.
 * Cada módulo pode estender esta interface para adicionar filtros específicos.
 */
export interface BaseApiFilters {
    [key: string]: any;
}
/**
 * Representa um erro padrão da API.
 */
export interface ApiError {
    message: string;
    status?: number;
    code?: string;
    details?: any;
}
/**
 * Tipos para os parâmetros de caminho comuns, como códigos e datas.
 */
export type Codigo = string | number;
export type DataString = string;
