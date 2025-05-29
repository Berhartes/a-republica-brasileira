/**
 * Interface para a estrutura de uma Legislatura
 */
export interface Legislatura {
    NumeroLegislatura: string;
    DataInicio: string;
    DataFim: string;
    DataEleicao?: string;
    SessoesLegislativas?: {
        SessaoLegislativa: Array<{
            NumeroSessaoLegislativa: string;
            TipoSessaoLegislativa: string;
            DataInicio: string;
            DataFim: string;
            DataInicioIntervalo?: string;
            DataFimIntervalo?: string;
        }> | {
            NumeroSessaoLegislativa: string;
            TipoSessaoLegislativa: string;
            DataInicio: string;
            DataFim: string;
            DataInicioIntervalo?: string;
            DataFimIntervalo?: string;
        };
    };
}
/**
 * Obtém a legislatura atual baseada na data informada
 * @param data - Data no formato YYYYMMDD. Se não informada, usa a data atual
 */
export declare function obterLegislaturaAtual(data?: string): Promise<Legislatura | null>;
/**
 * Obtém o período (DataInicio e DataFim) de uma legislatura a partir do arquivo XML.
 * @param numeroLegislatura - O número da legislatura desejada.
 * @returns Um objeto contendo DataInicio e DataFim, ou null se a legislatura não for encontrada.
 */
export declare function obterPeriodoLegislatura(numeroLegislatura: number): Promise<{
    DataInicio: string;
    DataFim: string;
} | null>;
/**
 * Obtém o número da legislatura atual
 */
export declare function obterNumeroLegislaturaAtual(data?: string): Promise<number | null>;
