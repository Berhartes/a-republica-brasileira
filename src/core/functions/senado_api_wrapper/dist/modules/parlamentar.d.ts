import { HttpClient } from "../common/httpClient";
import { BaseApiFilters, Codigo, DataString } from "../common/types";
export interface IdentificacaoBasicaParlamentar {
    CodigoParlamentar: Codigo;
    NomeParlamentar: string;
    NomeCompletoParlamentar?: string;
    SexoParlamentar?: string;
    FormaTratamento?: string;
    UrlFotoParlamentar?: string;
    UrlPaginaParlamentar?: string;
    EmailParlamentar?: string;
    SiglaPartidoParlamentar?: string;
    UfParlamentar?: string;
}
export interface Mandato {
    CodigoMandato: Codigo;
    DescricaoParticipacao: string;
    IdentificacaoParlamentar: IdentificacaoBasicaParlamentar;
    PrimeiraLegislaturaDoMandato: {
        NumeroLegislatura: number;
        DataInicio: DataString;
        DataFim: DataString;
    };
    SegundaLegislaturaDoMandato?: {
        NumeroLegislatura: number;
        DataInicio: DataString;
        DataFim: DataString;
    } | null;
    DescricaoExercicios?: string[];
}
export interface DetalheParlamentar extends IdentificacaoBasicaParlamentar {
    DataNascimento?: DataString;
    Naturalidade?: string;
    UfNaturalidade?: string;
    MandatoAtual?: Mandato;
}
export interface FiliacaoPartidaria {
    Partido: {
        Codigo: Codigo;
        Sigla: string;
        Nome: string;
    };
    DataFiliacao?: DataString;
    DataDesfiliacao?: DataString | null;
}
export interface Licenca {
    Codigo: Codigo;
    TipoLicenca: string;
    DataInicio: DataString;
    DataFim?: DataString | null;
    DescricaoMotivo?: string;
}
export interface DiscursoParlamentar {
    CodigoPronunciamento: Codigo;
    DataPronunciamento: DataString;
    UrlTextoIntegral?: string;
    Sumario?: string;
    TipoUsoPalavra?: string;
    SessaoPlenaria?: {
        CodigoSessao: Codigo;
        DataSessao: DataString;
        TipoSessao: string;
    };
}
export interface AparteParlamentar {
    CodigoAparte: Codigo;
    DataAparte: DataString;
    Sumario?: string;
    SessaoPlenaria?: {
        CodigoSessao: Codigo;
        DataSessao: DataString;
        TipoSessao: string;
    };
    ParlamentarAparteado?: {
        CodigoParlamentar: Codigo;
        NomeParlamentar: string;
    };
}
export interface HistoricoAcademico {
    FormacaoAcademica?: {
        Formacao: {
            Curso: string;
            Instituicao?: string;
            Ano?: string;
            Grau?: string;
        }[] | {
            Curso: string;
            Instituicao?: string;
            Ano?: string;
            Grau?: string;
        };
    };
    OutrasInformacoes?: string;
}
export interface CargoParlamentar {
    CodigoCargo: Codigo;
    DescricaoCargo: string;
    DataInicio: DataString;
    DataFim?: DataString | null;
    Instituicao?: string;
}
export interface ProfissaoParlamentar {
    Profissao: {
        CodigoProfissao: Codigo;
        NomeProfissao: string;
    }[] | {
        CodigoProfissao: Codigo;
        NomeProfissao: string;
    };
}
export interface TipoUsoPalavra {
    Codigo: Codigo;
    Sigla: string;
    Descricao: string;
}
export interface PartidoInfo {
    Codigo: Codigo;
    Sigla: string;
    Nome: string;
    DataCriacao?: DataString;
    DataExtincao?: DataString | null;
    NumeroSenadores?: number;
}
export interface FiltrosListarParlamentares extends BaseApiFilters {
    legislatura?: number;
    uf?: string;
    partido?: string;
    emExercicio?: boolean;
    nome?: string;
}
export interface FiltrosDiscursosParlamentar extends BaseApiFilters {
    dataInicio?: DataString;
    dataFim?: DataString;
    tipoDiscurso?: string;
    ordenacao?: 'ASC' | 'DESC';
}
export interface FiltrosApartesParlamentar extends BaseApiFilters {
    dataInicio?: DataString;
    dataFim?: DataString;
    ordenacao?: 'ASC' | 'DESC';
}
/**
 * Classe para interagir com os endpoints de Parlamentar da API do Senado.
 */
export declare class ParlamentarModule {
    private httpClient;
    constructor(httpClient: HttpClient);
    /**
     * Lista os parlamentares (senadores) com base nos filtros fornecidos.
     * Endpoints relevantes:
     *  - /senador/lista/atual
     *  - /senador/lista/legislatura/{numeroLegislatura}
     *  - /senador/lista/partido/{siglaPartido}/{numeroLegislatura} (OPCIONAL)
     *  - /senador/lista/uf/{siglaUf}/{numeroLegislatura} (OPCIONAL)
     * @param filtros - Filtros para a listagem.
     */
    listarParlamentares(filtros?: FiltrosListarParlamentares): Promise<IdentificacaoBasicaParlamentar[]>;
    /**
     * Obtém os detalhes de um parlamentar (senador) específico.
     * Endpoint: /senador/{codigoParlamentar}
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterDetalhesParlamentar(codigoParlamentar: Codigo): Promise<DetalheParlamentar | null>;
    /**
     * Obtém os mandatos de um senador.
     * Endpoint: /senador/{codigoParlamentar}/mandatos
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterMandatosParlamentar(codigoParlamentar: Codigo): Promise<Mandato[]>;
    /**
     * Obtém as comissões em que um senador participa ou participou.
     * Endpoint: /senador/comissoes/{codigoParlamentar}
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterComissoesParlamentar(codigoParlamentar: Codigo): Promise<any[]>;
    /**
     * Obtém as lideranças exercidas por um senador.
     * Endpoint: /senador/liderancas/{codigoParlamentar}
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterLiderancasParlamentar(codigoParlamentar: Codigo): Promise<any[]>;
    /**
     * Obtém as filiações partidárias de um senador.
     * Endpoint: /senador/filiacoes/{codigoParlamentar}
     */
    obterFiliacoesPartidarias(codigoParlamentar: Codigo): Promise<FiliacaoPartidaria[]>;
    /**
     * Obtém as licenças de um senador.
     * Endpoint: /senador/licencas/{codigoParlamentar}
     */
    obterLicencasParlamentar(codigoParlamentar: Codigo): Promise<Licenca[]>;
    /**
     * Obtém os discursos proferidos por um senador.
     * Endpoint: /senador/{codigo}/discursos
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterDiscursosParlamentar(codigoParlamentar: Codigo): Promise<DiscursoParlamentar[]>;
    /**
     * Obtém os apartes feitos por um senador.
     * Endpoint: /senador/{codigo}/apartes
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterApartesParlamentar(codigoParlamentar: Codigo): Promise<AparteParlamentar[]>;
    /**
     * Obtém o histórico acadêmico de um senador.
     * Endpoint: /senador/{codigo}/historicoAcademico
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterHistoricoAcademico(codigoParlamentar: Codigo): Promise<HistoricoAcademico | null>;
    /**
     * Obtém os cargos exercidos por um senador.
     * Endpoint: /senador/{codigo}/cargos
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterCargosParlamentar(codigoParlamentar: Codigo): Promise<CargoParlamentar[]>;
    /**
     * Obtém as profissões de um senador.
     * Endpoint: /senador/{codigo}/profissao
     * @param codigoParlamentar - O código do parlamentar.
     */
    obterProfissaoParlamentar(codigoParlamentar: Codigo): Promise<ProfissaoParlamentar | null>;
    /**
     * Lista os senadores afastados/licenciados.
     * Endpoint: /senador/afastados
     */
    listarParlamentaresAfastados(): Promise<IdentificacaoBasicaParlamentar[]>;
    /**
     * Lista parlamentares por um período de legislaturas.
     * Endpoint: /senador/lista/legislatura/{legislaturaInicio}/{legislaturaFim}
     * @param legislaturaInicio - Início do período de legislaturas.
     * @param legislaturaFim - Fim do período de legislaturas.
     */
    listarParlamentaresPorPeriodoLegislatura(legislaturaInicio: number, legislaturaFim: number): Promise<IdentificacaoBasicaParlamentar[]>;
    /**
     * Lista os partidos dos senadores.
     * Endpoint: /senador/partidos
     */
    listarPartidosParlamentares(): Promise<PartidoInfo[]>;
    /**
     * Lista os tipos de uso da palavra (tipos de discursos).
     * Endpoint: /senador/lista/tiposUsoPalavra
     */
    listarTiposUsoPalavra(): Promise<TipoUsoPalavra[]>;
}
