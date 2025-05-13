import { HttpClient } from "../common/httpClient";
import { BaseApiFilters, Codigo, DataString } from "../common/types";
export interface Votacao {
    CodigoSessao?: Codigo;
    CodigoSessaoVotacao?: Codigo;
    SiglaDescricaoVotacao?: string;
    SequencialVotacao?: number;
    IndicadorVotacaoSecreta?: "Sim" | "Não";
    DescricaoVotacao?: string;
    Resultado?: string;
}
export interface DetalheVotacao extends Votacao {
    DescricaoIdentificacaoMateria?: string;
    CodigoMateria?: Codigo;
    SiglaCasa?: string;
    CodigoCasa?: Codigo;
    Votos?: {
        Parlamentar: VotoParlamentar[];
    };
    TotaisVotos?: {
        TotalSim: number;
        TotalNao: number;
        TotalAbstencao: number;
        TotalObstrucao?: number;
        Presentes?: number;
        Registrados?: number;
    };
}
export interface VotoParlamentar {
    CodigoParlamentar: Codigo;
    NomeParlamentar: string;
    SiglaPartido: string;
    SiglaUf: string;
    DescricaoVoto: "Sim" | "Não" | "Abstenção" | "Obstrução" | "Presidente" | "Não Votou";
}
export interface VotacaoComissao {
    CodigoReuniao: Codigo;
    DataReuniao?: string;
    CodigoComissao: Codigo;
    SiglaComissao?: string;
    NomeComissao?: string;
    Votacoes?: {
        Votacao: Votacao[] | Votacao;
    };
}
export interface TipoVotacao {
    Codigo: Codigo;
    Sigla: string;
    Descricao: string;
    IndicadorVotacaoSecreta?: "Sim" | "Não";
}
export interface FiltrosListarVotacoes extends BaseApiFilters {
    materiaId?: Codigo;
    dataInicio?: DataString;
    dataFim?: DataString;
    comissaoId?: Codigo;
    parlamentarId?: Codigo;
    sessaoId?: Codigo;
}
/**
 * Classe para interagir com os endpoints de Votação da API do Senado.
 */
export declare class VotacaoModule {
    private httpClient;
    constructor(httpClient: HttpClient);
    /**
     * Lista as votações com base nos filtros.
     * Endpoints relevantes:
     *  - /votacao/lista/parlamentar/{codigoParlamentar}/{dataInicio}/{dataFim}
     *  - /votacao/lista/comissao/{codigoComissao}/{dataReferencia}
     *  - /votacao/lista/materia/{codigoMateria}
     *  - /votacao/lista/sessao/{codigoSessao}
     *  - /votacao/lista/plenario/{dataReferencia}
     *  - /votacao/lista/plenario/{dataInicio}/{dataFim}
     * @param filtros - Filtros para a listagem.
     */
    listarVotacoes(filtros: FiltrosListarVotacoes): Promise<Votacao[]>;
    /**
     * Obtém os detalhes de uma votação específica.
     * Endpoint: /votacao/{codigoSessao}/{sequencialVotacao}
     * A API do Senado usa este endpoint para obter detalhes de uma votação específica por sessão e sequencial.
     * Há também o endpoint /votacao/parlamentar/{codigoParlamentar}/{codigoSessao}/{sequencialVotacao} para consultar
     * o voto específico de um parlamentar.
     *
     * A documentação sugere que a combinação de sessão + sequencial é a chave para identificar uma votação.
     * @param codigoSessao - Código da sessão onde ocorreu a votação.
     * @param sequencialVotacao - Número sequencial da votação dentro da sessão.
     */
    obterDetalhesVotacao(codigoSessao: Codigo, sequencialVotacao: number): Promise<DetalheVotacao | null>;
    /**
     * Obtém os votos por parlamentar em uma votação específica.
     * Este método é um alias ou complemento para obterDetalhesVotacao, pois os detalhes já incluem os votos.
     * Se for necessário um endpoint específico apenas para votos, ele precisaria ser identificado.
     * O endpoint /votacao/parlamentar/{codigoParlamentar}/{codigoSessao}/{sequencialVotacao} retorna o voto de UM parlamentar.
     * Para todos os votos, os detalhes da votação são mais adequados.
     * @param codigoSessao - Código da sessão onde ocorreu a votação.
     * @param sequencialVotacao - Número sequencial da votação dentro da sessão.
     */
    obterVotosPorParlamentarNaVotacao(codigoSessao: Codigo, sequencialVotacao: number): Promise<VotoParlamentar[]>;
    /**
     * Obtém as votações realizadas em uma reunião de comissão.
     * Endpoint: /votacao/comissao/{codigoComissao}/{codigoReuniao}
     * @param codigoComissao - Código da comissão.
     * @param codigoReuniao - Código da reunião da comissão.
     */
    obterVotacoesComissao(codigoComissao: Codigo, codigoReuniao: Codigo): Promise<Votacao[]>;
    /**
     * Lista os tipos de votação disponíveis na API.
     * Endpoint: /votacao/tipos
     */
    listarTiposVotacao(): Promise<TipoVotacao[]>;
    /**
     * Obtém o voto específico de um parlamentar em uma votação.
     * Endpoint: /votacao/parlamentar/{codigoParlamentar}/{codigoSessao}/{sequencialVotacao}
     * @param codigoParlamentar - Código do parlamentar.
     * @param codigoSessao - Código da sessão onde ocorreu a votação.
     * @param sequencialVotacao - Número sequencial da votação dentro da sessão.
     */
    obterVotoParlamentar(codigoParlamentar: Codigo, codigoSessao: Codigo, sequencialVotacao: number): Promise<VotoParlamentar | null>;
}
