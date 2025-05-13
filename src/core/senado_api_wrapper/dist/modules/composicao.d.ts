import { HttpClient } from "../common/httpClient";
import { BaseApiFilters, Codigo, DataString } from "../common/types";
export interface Partido {
    Codigo: Codigo;
    Sigla: string;
    Nome: string;
    DataCriacao?: string;
    DataExtincao?: string | null;
}
export interface BlocoParlamentar {
    Codigo: Codigo;
    Nome: string;
    DataCriacao?: string;
    DataExtincao?: string | null;
}
export interface DetalheBlocoParlamentar extends BlocoParlamentar {
    Partido?: {
        Codigo: Codigo;
        Sigla: string;
        Nome: string;
    }[];
    Lider?: {
        IdentificacaoParlamentar: {
            CodigoParlamentar: Codigo;
            NomeParlamentar: string;
            SiglaPartido?: string;
            UfParlamentar?: string;
        };
    };
}
export interface Lideranca {
    CodigoLideranca: Codigo;
    DescricaoLideranca: string;
    IdentificacaoParlamentar: {
        CodigoParlamentar: Codigo;
        NomeParlamentar: string;
        SiglaPartido?: string;
        UfParlamentar?: string;
    };
    DescricaoTipoLideranca: string;
    DescricaoUnidadeLideranca: string;
    DataDesignacao: string;
    DataFim?: string | null;
}
export interface TipoLideranca {
    Codigo: Codigo;
    Descricao: string;
}
export interface UnidadeLideranca {
    Codigo: Codigo;
    Descricao: string;
}
export interface TipoCargo {
    Codigo: Codigo;
    Descricao: string;
}
export interface MembroMesa {
    IdentificacaoParlamentar: {
        CodigoParlamentar: Codigo;
        NomeParlamentar: string;
        SiglaPartido?: string;
        UfParlamentar?: string;
    };
    DescricaoCargo: string;
    DataInicioExercicio: string;
    DataFimExercicio?: string | null;
}
export interface ComposicaoMesa {
    IdentificacaoCasa: {
        SiglaCasa: "SF" | "CN";
        NomeCasa: string;
    };
    Membros: {
        Membro: MembroMesa[];
    };
}
export interface ComposicaoComissaoResumida {
    IdentificacaoComissao: {
        CodigoComissao: Codigo;
        SiglaComissao: string;
        NomeComissao: string;
    };
    DataInicio: DataString;
    DataFim?: DataString | null;
    Membros: {
        Titular: {
            IdentificacaoParlamentar: {
                CodigoParlamentar: Codigo;
                NomeParlamentar: string;
                SiglaPartido?: string;
                UfParlamentar?: string;
            };
        }[];
        Suplente: {
            IdentificacaoParlamentar: {
                CodigoParlamentar: Codigo;
                NomeParlamentar: string;
                SiglaPartido?: string;
                UfParlamentar?: string;
            };
        }[];
    };
}
export interface FiltrosListarPartidos extends BaseApiFilters {
    emExercicio?: boolean;
    sigla?: string;
}
export interface FiltrosListarBlocos extends BaseApiFilters {
}
export interface FiltrosListarLiderancas extends BaseApiFilters {
}
export interface FiltrosListarPorTipo extends BaseApiFilters {
    tipo: string;
    casa?: "SF" | "CN";
}
export interface FiltrosComposicaoResumida extends BaseApiFilters {
    codigo: Codigo;
    dataInicio: DataString;
    dataFim: DataString;
}
/**
 * Classe para interagir com os endpoints de Composição da API do Senado.
 * Inclui Partidos, Blocos, Lideranças e Mesa Diretora.
 */
export declare class ComposicaoModule {
    private httpClient;
    constructor(httpClient: HttpClient);
    /**
     * Lista os partidos políticos.
     * Endpoint: /composicao/lista/partidos
     * A API também tem /partido/lista e /partido/{sigla}, mas /composicao/lista/partidos parece ser o mais completo para listagem.
     */
    listarPartidos(filtros?: FiltrosListarPartidos): Promise<Partido[]>;
    /**
     * Lista os blocos parlamentares.
     * Endpoint: /composicao/lista/blocos (Senado)
     */
    listarBlocosParlamentares(filtros?: FiltrosListarBlocos): Promise<BlocoParlamentar[]>;
    /**
     * Obtém detalhes de um bloco parlamentar específico.
     * Endpoint: /composicao/bloco/{codigo}
     * @param codigoBloco - O código do bloco parlamentar.
     */
    obterDetalhesBloco(codigoBloco: Codigo): Promise<DetalheBlocoParlamentar | null>;
    /**
     * Lista as lideranças.
     * Endpoint: /composicao/lideranca
     * Este endpoint parece retornar todas as lideranças (Senado, Congresso, Câmara dos Deputados).
     * Pode ser necessário filtrar no lado do cliente ou verificar se a API aceita filtros por casa.
     */
    listarLiderancas(filtros?: FiltrosListarLiderancas): Promise<Lideranca[]>;
    /**
     * Lista os tipos de liderança disponíveis.
     * Endpoint: /composicao/lideranca/tipos
     */
    listarTiposLideranca(): Promise<TipoLideranca[]>;
    /**
     * Lista as unidades de liderança disponíveis.
     * Endpoint: /composicao/lideranca/tipos-unidade
     */
    listarTiposUnidadeLideranca(): Promise<UnidadeLideranca[]>;
    /**
     * Lista os tipos de cargo disponíveis.
     * Endpoint: /composicao/lista/tiposCargo
     */
    listarTiposCargo(): Promise<TipoCargo[]>;
    /**
     * Lista composição por tipo.
     * Endpoint: /composicao/lista/{tipo}
     * @param filtros - Filtros com tipo de composição.
     */
    listarComposicaoPorTipo(filtros: FiltrosListarPorTipo): Promise<any[]>;
    /**
     * Lista composição por tipo específico do Congresso Nacional.
     * Endpoint: /composicao/lista/cn/{tipo}
     * @param filtros - Filtros com tipo de composição.
     */
    listarComposicaoCNPorTipo(filtros: FiltrosListarPorTipo): Promise<any[]>;
    /**
     * Obtém a composição resumida de uma comissão mista por período.
     * Endpoint: /composicao/comissao/resumida/mista/{codigo}/{dataInicio}/{dataFim}
     * @param filtros - Filtros com código da comissão, data de início e fim.
     */
    obterComposicaoResumidaComissaoMista(filtros: FiltrosComposicaoResumida): Promise<ComposicaoComissaoResumida | null>;
    /**
     * Obtém a composição da Mesa Diretora do Senado Federal ou do Congresso Nacional.
     * Endpoints:
     *  - /composicao/mesaSF
     *  - /composicao/mesaCN
     * @param casa - Especificar se é do Senado ('SF') ou Congresso ('CN').
     */
    obterComposicaoMesa(casa: "SF" | "CN"): Promise<ComposicaoMesa | null>;
}
