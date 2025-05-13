import { HttpClient } from "../common/httpClient";
import { BaseApiFilters, Codigo, DataString } from "../common/types";
export interface SessaoPlenaria {
    CodigoSessao: Codigo;
    NumeroSessao: string;
    TipoSessao: string;
    DataSessao: DataString;
    HoraInicio: string;
    DescricaoPauta?: string;
}
export interface DetalheSessaoPlenaria extends SessaoPlenaria {
    NumeroLegislatura?: number;
    NumeroSessaoLegislativa?: string;
}
export interface PautaItem {
    CodigoMateria?: Codigo;
    SiglaSubtipoMateria?: string;
    NumeroMateria?: string;
    AnoMateria?: string;
    DescricaoEmentaMateria?: string;
    Situacao?: string;
    Resultado?: string;
}
export interface PautaDaSessao {
    Codigo?: Codigo;
    CodigoSessao?: Codigo;
    DataSessao?: DataString;
    ItensPauta?: PautaItem[];
}
export interface ResultadoSessao {
    Codigo?: Codigo;
    CodigoSessao?: Codigo;
    DataSessao?: DataString;
    Resultados?: any[];
}
export interface ResumoSessao {
    Codigo?: Codigo;
    CodigoSessao?: Codigo;
    DataSessao?: DataString;
    Resumo?: string;
    ObservacoesSessao?: string;
}
export interface TipoSessao {
    Codigo: Codigo;
    Sigla: string;
    Descricao: string;
}
export interface TipoComparecimento {
    Codigo: Codigo;
    Sigla: string;
    Descricao: string;
}
export interface Legislatura {
    Codigo: Codigo;
    DataInicio: DataString;
    DataFim: DataString;
    Descricao?: string;
}
export interface DiscursoPlenario {
    CodigoPronunciamento: Codigo;
    IdentificacaoParlamentar?: {
        CodigoParlamentar: Codigo;
        NomeParlamentar: string;
    };
    DataPronunciamento: DataString;
    TipoUsoPalavra: string;
    Sumario?: string;
    UrlTextoIntegral?: string;
}
export interface AgendaEvento {
    Codigo: Codigo;
    DataInicio: DataString;
    HoraInicio: string;
    DataFim?: DataString;
    HoraFim?: string;
    Tipo?: string;
    Titulo?: string;
    Descricao?: string;
    Local?: string;
    Situacao?: string;
}
export interface AgendaCN {
    DataAgenda: DataString;
    Eventos?: AgendaEvento[] | AgendaEvento;
}
export interface FiltrosListarSessoes extends BaseApiFilters {
    dataInicio?: DataString;
    dataFim?: DataString;
    tipoSessao?: string;
    legislatura?: number;
    periodo?: string;
    semana?: string;
}
export interface FiltrosListarDiscursos extends BaseApiFilters {
    dataInicio?: DataString;
    dataFim?: DataString;
    codigoParlamentar?: Codigo;
    tipoSessao?: string;
}
export interface FiltrosAgendaCN extends BaseApiFilters {
    data?: DataString;
    dataInicio?: DataString;
    dataFim?: DataString;
}
/**
 * Classe para interagir com os endpoints de Plenário da API do Senado.
 */
export declare class PlenarioModule {
    private httpClient;
    constructor(httpClient: HttpClient);
    /**
     * Lista as sessões plenárias.
     * Endpoints:
     *  - /plenario/sessoes/{dataInicio}/{dataFim}
     *  - /plenario/sessoes/{dataReferencia}
     *  - /plenario/lista/{legislatura} (DEPRECATED)
     * @param filtros - Filtros para a listagem.
     */
    listarSessoesPlenarias(filtros: FiltrosListarSessoes): Promise<SessaoPlenaria[]>;
    /**
     * Obtém os detalhes de uma sessão plenária específica.
     * Endpoint: /plenario/encontro/{codigo}
     * @param codigoSessao - O código da sessão.
     */
    obterDetalhesSessaoPlenaria(codigoSessao: Codigo): Promise<DetalheSessaoPlenaria | null>;
    /**
     * Obtém a pauta de uma sessão plenária.
     * Endpoint: /plenario/encontro/{codigo}/pauta
     * @param codigoSessao - O código da sessão/encontro.
     */
    obterPautaDaSessao(codigoSessao: Codigo): Promise<PautaDaSessao | null>;
    /**
     * Obtém o resultado de uma sessão plenária.
     * Endpoint: /plenario/encontro/{codigo}/resultado
     * @param codigoSessao - O código da sessão/encontro.
     */
    obterResultadoDaSessao(codigoSessao: Codigo): Promise<ResultadoSessao | null>;
    /**
     * Obtém o resumo de uma sessão plenária.
     * Endpoint: /plenario/encontro/{codigo}/resumo
     * @param codigoSessao - O código da sessão/encontro.
     */
    obterResumoDaSessao(codigoSessao: Codigo): Promise<ResumoSessao | null>;
    /**
     * Lista os discursos em plenário.
     * Endpoint: /plenario/lista/discursos/{dataInicio}/{dataFim}
     * @param filtros - Filtros para a listagem.
     */
    listarDiscursosEmPlenario(filtros: FiltrosListarDiscursos): Promise<DiscursoPlenario[]>;
    /**
     * Lista os tipos de sessões plenárias.
     * Endpoint: /plenario/lista/tiposSessao
     */
    listarTiposSessao(): Promise<TipoSessao[]>;
    /**
     * Obtém a agenda atual em formato iCal.
     * Endpoint: /plenario/agenda/atual/iCal
     * @returns O conteúdo iCal como string.
     */
    obterAgendaAtualICal(): Promise<string>;
    /**
     * Obtém a agenda do Congresso Nacional para uma data específica.
     * Endpoint: /plenario/agenda/cn/{data}
     * @param data - Data no formato YYYYMMDD.
     */
    obterAgendaCNPorData(data: DataString): Promise<AgendaCN | null>;
    /**
     * Obtém a agenda do Congresso Nacional para um período.
     * Endpoint: /plenario/agenda/cn/{inicio}/{fim}
     * @param dataInicio - Data inicial no formato YYYYMMDD.
     * @param dataFim - Data final no formato YYYYMMDD.
     */
    obterAgendaCNPorPeriodo(dataInicio: DataString, dataFim: DataString): Promise<AgendaCN[]>;
    /**
     * Simplificação de acesso à agenda do Congresso Nacional.
     * Este método é uma abstração que decide qual endpoint chamar com base nos filtros.
     * @param filtros - Filtros para a agenda.
     */
    obterAgendaCN(filtros: FiltrosAgendaCN): Promise<AgendaCN | AgendaCN[] | null>;
    /**
     * Obtém a agenda plenária para um dia específico.
     * Endpoint: /plenario/agenda/dia/{data}
     * @param data - Data no formato YYYYMMDD.
     */
    obterAgendaDiaria(data: DataString): Promise<AgendaEvento[]>;
    /**
     * Obtém a agenda plenária para um mês específico.
     * Endpoint: /plenario/agenda/mes/{data}
     * @param data - Data no formato YYYYMM.
     */
    obterAgendaMensal(data: string): Promise<AgendaEvento[]>;
    /**
     * Obtém informações sobre a legislatura para uma data específica.
     * Endpoint: /plenario/legislatura/{data}
     * @param data - Data no formato YYYYMMDD.
     */
    obterLegislatura(data: DataString): Promise<Legislatura | null>;
    /**
     * Lista as legislaturas disponíveis.
     * Endpoint: /plenario/lista/legislaturas
     */
    listarLegislaturas(): Promise<Legislatura[]>;
    /**
     * Lista os tipos de comparecimento possíveis para parlamentares em sessões.
     * Endpoint: /plenario/lista/tiposComparecimento
     */
    listarTiposComparecimento(): Promise<TipoComparecimento[]>;
    /**
     * Lista as sessões plenárias por período legislativo.
     * Endpoint: /plenario/sessoes/periodo/{periodo}
     * @param periodo - O período legislativo no formato esperado pela API (ex: '2023-2024')
     */
    listarSessoesPorPeriodo(periodo: string): Promise<SessaoPlenaria[]>;
    /**
     * Lista as sessões plenárias por semana.
     * Endpoint: /plenario/sessoes/semana/{semana}
     * @param semana - Data no formato YYYYMMDD representando a segunda-feira da semana desejada
     */
    listarSessoesPorSemana(semana: string): Promise<SessaoPlenaria[]>;
    /**
     * Lista as sessões plenárias por tipo de sessão.
     * Endpoint: /plenario/sessoes/tipoSessao/{tipoSessao}
     * @param tipoSessao - O código ou identificador do tipo de sessão
     */
    listarSessoesPorTipoSessao(tipoSessao: string): Promise<SessaoPlenaria[]>;
}
