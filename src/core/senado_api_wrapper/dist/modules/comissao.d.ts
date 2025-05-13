import { HttpClient } from "../common/httpClient";
import { BaseApiFilters, Codigo, DataString } from "../common/types";
export interface Comissao {
    Codigo: Codigo;
    Sigla: string;
    Nome: string;
    NomeCasa?: string;
    TipoComissao?: string;
    DataInicio?: DataString;
    DataFim?: DataString | null;
}
export interface DetalhesComissao extends Comissao {
    Descricao?: string;
    Telefone?: string;
    Email?: string;
    Site?: string;
    Local?: string;
}
export interface MembroComissao {
    IdentificacaoParlamentar: {
        CodigoParlamentar: Codigo;
        NomeParlamentar: string;
        SiglaPartido?: string;
        UfParlamentar?: string;
    };
    DescricaoParticipacao: string;
    DataInicioParticipacao?: DataString;
    DataFimParticipacao?: DataString | null;
}
export interface ComposicaoComissao {
    IdentificacaoComissao: {
        CodigoComissao: Codigo;
        SiglaComissao: string;
        NomeComissao: string;
    };
    Membros: {
        Membro: MembroComissao[];
    };
}
export interface ReuniaoComissao {
    CodigoReuniao: Codigo;
    DescricaoPauta?: string;
    DataReuniao?: DataString;
    HoraReuniao?: string;
    Local?: string;
    Status?: string;
}
export interface AgendaComissao {
    DescricaoIdentificacaoReuniao: string;
    DataAgenda: DataString;
    HoraAgenda: string;
    DescricaoLocal: string;
    CodigoReuniao: Codigo;
}
export interface TipoColegiado {
    Codigo: Codigo;
    Sigla: string;
    Descricao: string;
}
export interface DocumentoComissao {
    Codigo: Codigo;
    Tipo: string;
    Descricao: string;
    Data: DataString;
    Url?: string;
}
export interface RequerimentoCPI {
    Codigo: Codigo;
    NumeroRequerimento: string;
    DataApresentacao: DataString;
    Ementa: string;
    Autores?: string[];
    SituacaoAtual?: string;
}
export interface NotaTaquigrafica {
    Codigo: Codigo;
    DataPublicacao: DataString;
    Texto: string;
    Url?: string;
}
export interface AgendaICalItem {
    Identificacao: string;
    DataHora: string;
    Local: string;
    Descricao: string;
    URL?: string;
}
export interface FiltrosListarComissoes extends BaseApiFilters {
    tipo?: "permanente" | "temporaria" | "cpi" | "mista" | "especial" | "representacao" | "conselho" | "outros";
    casa?: "SF" | "CN" | "CD";
    ativas?: boolean;
    sigla?: string;
}
export interface FiltrosAgendaComissao extends BaseApiFilters {
    dataInicio?: DataString;
    dataFim?: DataString;
    comissaoId?: Codigo;
}
export interface FiltrosAgendaMesComissao extends BaseApiFilters {
    mesReferencia: string;
    comissaoId?: Codigo;
}
export interface FiltrosDocumentoComissao extends BaseApiFilters {
    siglaComissao: string;
    tipoDocumento: string;
}
/**
 * Classe para interagir com os endpoints de Comissão da API do Senado.
 */
export declare class ComissaoModule {
    private httpClient;
    constructor(httpClient: HttpClient);
    /**
     * Lista as comissões com base nos filtros fornecidos.
     * A API do Senado tem vários endpoints para listar comissões (por tipo, por casa, todas ativas, etc.).
     * Esta função tentará abstrair isso, mas pode precisar de refinamento.
     *
     * Endpoints relevantes:
     *  - /comissao/lista/{tipo} (SF)
     *  - /comissao/lista/colegiados (SF em atividade)
     *  - /comissao/lista/mistas (CN em atividade)
     *  - /comissao/lista/tiposColegiado (SF e CN)
     */
    listarComissoes(filtros?: FiltrosListarComissoes): Promise<Comissao[]>;
    /**
     * Lista os tipos de colegiados disponíveis.
     * Endpoint: /comissao/lista/tiposColegiado
     */
    listarTiposColegiado(): Promise<TipoColegiado[]>;
    /**
     * Obtém os detalhes de uma comissão específica.
     * Endpoint: /comissao/{codigo}
     * @param codigoComissao - O código da comissão.
     */
    obterDetalhesComissao(codigoComissao: Codigo): Promise<DetalhesComissao | null>;
    /**
     * Obtém a composição de uma comissão específica.
     * Endpoints:
     *  - /composicao/comissao/{codigo} (Senado)
     *  - /composicao/comissao/atual/mista/{codigo} (Congresso/Mista)
     * @param codigoComissao - O código da comissão.
     * @param casa - Especificar se é do 'SF' (Senado) ou 'CN' (Congresso/Mista) para o endpoint correto.
     */
    obterComposicaoComissao(codigoComissao: Codigo, casa?: 'SF' | 'CN'): Promise<ComposicaoComissao | null>;
    /**
     * Obtém a agenda de reuniões de comissões.
     * Endpoints:
     *  - /comissao/agenda/{dataInicio}/{dataFim}
     *  - /comissao/agenda/{dataReferencia}
     *  - /comissao/agenda/mes/{mesReferencia} (YYYYMM)
     * @param filtros - Filtros para a agenda, como data de início e fim.
     */
    obterAgendaComissao(filtros: FiltrosAgendaComissao): Promise<AgendaComissao[]>;
    /**
     * Obtém informações detalhadas de uma reunião de comissão específica.
     * Endpoint: /comissao/reuniao/{codigoReuniao}
     * @param codigoReuniao - O código da reunião.
     */
    obterDetalhesReuniaoComissao(codigoReuniao: Codigo): Promise<ReuniaoComissao | null>;
    /**
     * Obtém a agenda de comissões atual no formato iCalendar.
     * Endpoint: /comissao/agenda/atual/iCal
     * Este método retorna um arraystringificado de objetos de agenda
     * devido à natureza do formato iCal.
     */
    obterAgendaICal(): Promise<string>;
    /**
     * Obtém a agenda de comissões para um mês específico.
     * Endpoint: /comissao/agenda/mes/{mesReferencia}
     * @param filtros - Filtros com mês de referência no formato YYYYMM.
     */
    obterAgendaMes(filtros: FiltrosAgendaMesComissao): Promise<AgendaComissao[]>;
    /**
     * Obtém requerimentos de CPI.
     * Endpoint: /comissao/cpi/{comissao}/requerimentos
     * @param codigoComissao - O código da comissão CPI.
     */
    obterRequerimentosCPI(codigoComissao: Codigo): Promise<RequerimentoCPI[]>;
    /**
     * Obtém documentos de uma comissão específica por tipo.
     * Endpoint: /comissao/reuniao/{sigla}/documento/{tipoDocumento}
     * @param filtros - Filtros com sigla da comissão e tipo de documento.
     */
    obterDocumentosComissao(filtros: FiltrosDocumentoComissao): Promise<DocumentoComissao[]>;
    /**
     * Obtém notas taquigráficas de uma reunião de comissão.
     * Endpoint: /comissao/reuniao/notas/{codigoReuniao}
     * @param codigoReuniao - O código da reunião.
     */
    obterNotasTaquigraficas(codigoReuniao: Codigo): Promise<NotaTaquigrafica | null>;
}
