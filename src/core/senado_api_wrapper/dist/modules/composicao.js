import { handleApiError, WrapperError } from "../common/errors";
/**
 * Classe para interagir com os endpoints de Composição da API do Senado.
 * Inclui Partidos, Blocos, Lideranças e Mesa Diretora.
 */
export class ComposicaoModule {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    /**
     * Lista os partidos políticos.
     * Endpoint: /composicao/lista/partidos
     * A API também tem /partido/lista e /partido/{sigla}, mas /composicao/lista/partidos parece ser o mais completo para listagem.
     */
    async listarPartidos(filtros) {
        const url = "/composicao/lista/partidos";
        try {
            const response = await this.httpClient.get(url, { params: filtros });
            // Estrutura: { ListaPartidos: { Partidos: { Partido: [...] } } }
            if (response && response.ListaPartidos && response.ListaPartidos.Partidos && response.ListaPartidos.Partidos.Partido) {
                return Array.isArray(response.ListaPartidos.Partidos.Partido)
                    ? response.ListaPartidos.Partidos.Partido
                    : [response.ListaPartidos.Partidos.Partido];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista os blocos parlamentares.
     * Endpoint: /composicao/lista/blocos (Senado)
     */
    async listarBlocosParlamentares(filtros) {
        const url = "/composicao/lista/blocos"; // Aparentemente focado no Senado
        try {
            const response = await this.httpClient.get(url, { params: filtros });
            // Estrutura: { ListaBlocosParlamentares: { Blocos: { BlocoParlamentar: [...] } } }
            if (response && response.ListaBlocosParlamentares && response.ListaBlocosParlamentares.Blocos && response.ListaBlocosParlamentares.Blocos.BlocoParlamentar) {
                return Array.isArray(response.ListaBlocosParlamentares.Blocos.BlocoParlamentar)
                    ? response.ListaBlocosParlamentares.Blocos.BlocoParlamentar
                    : [response.ListaBlocosParlamentares.Blocos.BlocoParlamentar];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém detalhes de um bloco parlamentar específico.
     * Endpoint: /composicao/bloco/{codigo}
     * @param codigoBloco - O código do bloco parlamentar.
     */
    async obterDetalhesBloco(codigoBloco) {
        const url = `/composicao/bloco/${codigoBloco}`;
        try {
            const response = await this.httpClient.get(url);
            if (response && response.DetalheBloco && response.DetalheBloco.Bloco) {
                return response.DetalheBloco.Bloco;
            }
            return null;
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista as lideranças.
     * Endpoint: /composicao/lideranca
     * Este endpoint parece retornar todas as lideranças (Senado, Congresso, Câmara dos Deputados).
     * Pode ser necessário filtrar no lado do cliente ou verificar se a API aceita filtros por casa.
     */
    async listarLiderancas(filtros) {
        const url = "/composicao/lideranca";
        try {
            const response = await this.httpClient.get(url, { params: filtros });
            // Estrutura: { Liderancas: { Lideranca: [...] } }
            if (response && response.Liderancas && response.Liderancas.Lideranca) {
                return Array.isArray(response.Liderancas.Lideranca)
                    ? response.Liderancas.Lideranca
                    : [response.Liderancas.Lideranca];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista os tipos de liderança disponíveis.
     * Endpoint: /composicao/lideranca/tipos
     */
    async listarTiposLideranca() {
        const url = "/composicao/lideranca/tipos";
        try {
            const response = await this.httpClient.get(url);
            if (response && response.TiposLideranca && response.TiposLideranca.Tipo) {
                return Array.isArray(response.TiposLideranca.Tipo)
                    ? response.TiposLideranca.Tipo
                    : [response.TiposLideranca.Tipo];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista as unidades de liderança disponíveis.
     * Endpoint: /composicao/lideranca/tipos-unidade
     */
    async listarTiposUnidadeLideranca() {
        const url = "/composicao/lideranca/tipos-unidade";
        try {
            const response = await this.httpClient.get(url);
            if (response && response.TiposUnidadeLideranca && response.TiposUnidadeLideranca.Tipo) {
                return Array.isArray(response.TiposUnidadeLideranca.Tipo)
                    ? response.TiposUnidadeLideranca.Tipo
                    : [response.TiposUnidadeLideranca.Tipo];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista os tipos de cargo disponíveis.
     * Endpoint: /composicao/lista/tiposCargo
     */
    async listarTiposCargo() {
        const url = "/composicao/lista/tiposCargo";
        try {
            const response = await this.httpClient.get(url);
            if (response && response.TiposCargo && response.TiposCargo.Tipo) {
                return Array.isArray(response.TiposCargo.Tipo)
                    ? response.TiposCargo.Tipo
                    : [response.TiposCargo.Tipo];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista composição por tipo.
     * Endpoint: /composicao/lista/{tipo}
     * @param filtros - Filtros com tipo de composição.
     */
    async listarComposicaoPorTipo(filtros) {
        if (!filtros.tipo) {
            throw new WrapperError("O tipo de composição é obrigatório.");
        }
        const url = `/composicao/lista/${filtros.tipo}`;
        try {
            const response = await this.httpClient.get(url, { params: filtros });
            // A estrutura da resposta pode variar de acordo com o tipo
            // Precisamos examinar a resposta e verificar qual nó contém os dados
            // Este é um método genérico que retorna qualquer estrutura
            const keys = Object.keys(response);
            for (const key of keys) {
                if (response[key] && typeof response[key] === 'object') {
                    // Procura por arrays ou objetos que podem conter os dados
                    const subKeys = Object.keys(response[key]);
                    for (const subKey of subKeys) {
                        if (Array.isArray(response[key][subKey])) {
                            return response[key][subKey];
                        }
                        else if (typeof response[key][subKey] === 'object' && response[key][subKey] !== null) {
                            const subSubKeys = Object.keys(response[key][subKey]);
                            for (const subSubKey of subSubKeys) {
                                if (Array.isArray(response[key][subKey][subSubKey])) {
                                    return response[key][subKey][subSubKey];
                                }
                            }
                        }
                    }
                }
            }
            // Se não conseguiu encontrar um array estruturado, retorna o objeto inteiro
            return [response];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista composição por tipo específico do Congresso Nacional.
     * Endpoint: /composicao/lista/cn/{tipo}
     * @param filtros - Filtros com tipo de composição.
     */
    async listarComposicaoCNPorTipo(filtros) {
        if (!filtros.tipo) {
            throw new WrapperError("O tipo de composição é obrigatório.");
        }
        const url = `/composicao/lista/cn/${filtros.tipo}`;
        try {
            const response = await this.httpClient.get(url, { params: filtros });
            // A estrutura da resposta pode variar de acordo com o tipo
            // Similar ao método listarComposicaoPorTipo, mas focado no Congresso Nacional
            const keys = Object.keys(response);
            for (const key of keys) {
                if (response[key] && typeof response[key] === 'object') {
                    const subKeys = Object.keys(response[key]);
                    for (const subKey of subKeys) {
                        if (Array.isArray(response[key][subKey])) {
                            return response[key][subKey];
                        }
                        else if (typeof response[key][subKey] === 'object' && response[key][subKey] !== null) {
                            const subSubKeys = Object.keys(response[key][subKey]);
                            for (const subSubKey of subSubKeys) {
                                if (Array.isArray(response[key][subKey][subSubKey])) {
                                    return response[key][subKey][subSubKey];
                                }
                            }
                        }
                    }
                }
            }
            return [response];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém a composição resumida de uma comissão mista por período.
     * Endpoint: /composicao/comissao/resumida/mista/{codigo}/{dataInicio}/{dataFim}
     * @param filtros - Filtros com código da comissão, data de início e fim.
     */
    async obterComposicaoResumidaComissaoMista(filtros) {
        if (!filtros.codigo || !filtros.dataInicio || !filtros.dataFim) {
            throw new WrapperError("É necessário fornecer o código da comissão, data de início e data de fim.");
        }
        const url = `/composicao/comissao/resumida/mista/${filtros.codigo}/${filtros.dataInicio}/${filtros.dataFim}`;
        try {
            const response = await this.httpClient.get(url);
            if (response && response.ComposicaoComissaoResumida) {
                return response.ComposicaoComissaoResumida;
            }
            return null;
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém a composição da Mesa Diretora do Senado Federal ou do Congresso Nacional.
     * Endpoints:
     *  - /composicao/mesaSF
     *  - /composicao/mesaCN
     * @param casa - Especificar se é do Senado ('SF') ou Congresso ('CN').
     */
    async obterComposicaoMesa(casa) {
        const url = casa === "SF" ? "/composicao/mesaSF" : "/composicao/mesaCN";
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { MesaSenadoFederal: { ComposicaoMesa: { ... } } } ou { MesaCongressoNacional: { ComposicaoMesa: { ... } } }
            if (casa === "SF" && response && response.MesaSenadoFederal && response.MesaSenadoFederal.ComposicaoMesa) {
                return response.MesaSenadoFederal.ComposicaoMesa;
            }
            else if (casa === "CN" && response && response.MesaCongressoNacional && response.MesaCongressoNacional.ComposicaoMesa) {
                return response.MesaCongressoNacional.ComposicaoMesa;
            }
            return null;
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw handleApiError(error, url);
        }
    }
}
//# sourceMappingURL=composicao.js.map