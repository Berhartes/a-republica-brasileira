import { handleApiError, WrapperError } from "../common/errors";
/**
 * Classe para interagir com os endpoints de Plenário da API do Senado.
 */
export class PlenarioModule {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    /**
     * Lista as sessões plenárias.
     * Endpoints:
     *  - /plenario/sessoes/{dataInicio}/{dataFim}
     *  - /plenario/sessoes/{dataReferencia}
     *  - /plenario/lista/{legislatura} (DEPRECATED)
     * @param filtros - Filtros para a listagem.
     */
    async listarSessoesPlenarias(filtros) {
        // Verificar se devemos usar endpoints específicos com base nos filtros
        if (filtros.periodo) {
            return this.listarSessoesPorPeriodo(filtros.periodo);
        }
        else if (filtros.semana) {
            return this.listarSessoesPorSemana(filtros.semana);
        }
        else if (filtros.tipoSessao && !filtros.dataInicio && !filtros.dataFim) {
            // Se temos apenas tipoSessao sem datas, usar o endpoint específico
            return this.listarSessoesPorTipoSessao(filtros.tipoSessao);
        }
        // Caso contrário, usar a lógica original baseada em datas
        let url = "";
        if (filtros.dataInicio && filtros.dataFim) {
            url = `/plenario/sessoes/${filtros.dataInicio}/${filtros.dataFim}`;
        }
        else if (filtros.dataInicio) { // Usar dataInicio como dataReferencia
            url = `/plenario/sessoes/${filtros.dataInicio}`;
        }
        else {
            // A API do Senado não parece ter um endpoint para listar todas as sessões sem data.
            // O endpoint /plenario/lista/{legislatura} está DEPRECATED.
            // Poderia-se usar uma data padrão, como o ano corrente, mas isso deve ser definido.
            throw new WrapperError("Para listar sessões plenárias, forneça dataInicio e dataFim, ou apenas dataInicio (como dataReferencia); ou use filtros específicos como periodo, semana, ou tipoSessao.");
        }
        const params = {};
        if (filtros.tipoSessao) {
            // A API não parece aceitar tipoSessao como query param nesses endpoints de data.
            // O filtro por tipoSessao pode precisar ser feito no lado do cliente.
            console.warn("Filtro por tipoSessao pode não ser aplicado diretamente pela API neste endpoint.");
        }
        try {
            const response = await this.httpClient.get(url, { params });
            // Estrutura: { SessaoPlenariaLista: { Sessoes: { Sessao: [...] } } }
            if (response?.SessaoPlenariaLista?.Sessoes?.Sessao) {
                return Array.isArray(response.SessaoPlenariaLista.Sessoes.Sessao)
                    ? response.SessaoPlenariaLista.Sessoes.Sessao
                    : [response.SessaoPlenariaLista.Sessoes.Sessao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém os detalhes de uma sessão plenária específica.
     * Endpoint: /plenario/encontro/{codigo}
     * @param codigoSessao - O código da sessão.
     */
    async obterDetalhesSessaoPlenaria(codigoSessao) {
        const url = `/plenario/encontro/${codigoSessao}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { SessaoPlenaria: { DetalhesSessao: { ... } } }
            if (response?.SessaoPlenaria?.DetalhesSessao) {
                return response.SessaoPlenaria.DetalhesSessao;
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
     * Obtém a pauta de uma sessão plenária.
     * Endpoint: /plenario/encontro/{codigo}/pauta
     * @param codigoSessao - O código da sessão/encontro.
     */
    async obterPautaDaSessao(codigoSessao) {
        const url = `/plenario/encontro/${codigoSessao}/pauta`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { PautaSessao: { Codigo, CodigoSessao, DataSessao, Materias: { Materia: [...] } } }
            if (response?.PautaSessao) {
                const pautaSessao = {
                    Codigo: response.PautaSessao.Codigo,
                    CodigoSessao: response.PautaSessao.CodigoSessao,
                    DataSessao: response.PautaSessao.DataSessao,
                    ItensPauta: []
                };
                if (response.PautaSessao.Materias && response.PautaSessao.Materias.Materia) {
                    const materias = Array.isArray(response.PautaSessao.Materias.Materia)
                        ? response.PautaSessao.Materias.Materia
                        : [response.PautaSessao.Materias.Materia];
                    pautaSessao.ItensPauta = materias.map((materia) => ({
                        CodigoMateria: materia.Codigo,
                        SiglaSubtipoMateria: materia.Sigla,
                        NumeroMateria: materia.Numero,
                        AnoMateria: materia.Ano,
                        DescricaoEmentaMateria: materia.Ementa,
                        Situacao: materia.Situacao,
                        Resultado: materia.Resultado
                    }));
                }
                return pautaSessao;
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
     * Obtém o resultado de uma sessão plenária.
     * Endpoint: /plenario/encontro/{codigo}/resultado
     * @param codigoSessao - O código da sessão/encontro.
     */
    async obterResultadoDaSessao(codigoSessao) {
        const url = `/plenario/encontro/${codigoSessao}/resultado`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { ResultadoSessao: { Codigo, CodigoSessao, DataSessao, Resultados: { ... } } }
            if (response?.ResultadoSessao) {
                const resultadoSessao = {
                    Codigo: response.ResultadoSessao.Codigo,
                    CodigoSessao: response.ResultadoSessao.CodigoSessao,
                    DataSessao: response.ResultadoSessao.DataSessao,
                    Resultados: []
                };
                if (response.ResultadoSessao.Resultados) {
                    // A estrutura exata dos resultados pode variar, por isso mantemos genérico
                    resultadoSessao.Resultados = response.ResultadoSessao.Resultados;
                }
                return resultadoSessao;
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
     * Obtém o resumo de uma sessão plenária.
     * Endpoint: /plenario/encontro/{codigo}/resumo
     * @param codigoSessao - O código da sessão/encontro.
     */
    async obterResumoDaSessao(codigoSessao) {
        const url = `/plenario/encontro/${codigoSessao}/resumo`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { ResumoSessao: { Codigo, CodigoSessao, DataSessao, Resumo, ObservacoesSessao } }
            if (response?.ResumoSessao) {
                return {
                    Codigo: response.ResumoSessao.Codigo,
                    CodigoSessao: response.ResumoSessao.CodigoSessao,
                    DataSessao: response.ResumoSessao.DataSessao,
                    Resumo: response.ResumoSessao.Resumo,
                    ObservacoesSessao: response.ResumoSessao.ObservacoesSessao
                };
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
     * Lista os discursos em plenário.
     * Endpoint: /plenario/lista/discursos/{dataInicio}/{dataFim}
     * @param filtros - Filtros para a listagem.
     */
    async listarDiscursosEmPlenario(filtros) {
        if (!filtros.dataInicio || !filtros.dataFim) {
            throw new WrapperError("Para listar discursos, dataInicio e dataFim são obrigatórios.");
        }
        const url = `/plenario/lista/discursos/${filtros.dataInicio}/${filtros.dataFim}`;
        const params = {};
        if (filtros.codigoParlamentar)
            params.parlamentar = filtros.codigoParlamentar;
        // A API não parece aceitar tipoSessao como query param neste endpoint.
        try {
            const response = await this.httpClient.get(url, { params });
            // Estrutura: { ListaDiscursosSenador: { Discursos: { Discurso: [...] } } } ou similar
            if (response?.ListaDiscursosSenador?.Discursos?.Discurso) {
                return Array.isArray(response.ListaDiscursosSenador.Discursos.Discurso)
                    ? response.ListaDiscursosSenador.Discursos.Discurso
                    : [response.ListaDiscursosSenador.Discursos.Discurso];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista os tipos de sessões plenárias.
     * Endpoint: /plenario/lista/tiposSessao
     */
    async listarTiposSessao() {
        const url = `/plenario/lista/tiposSessao`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { TiposSessaoPlenaria: { TipoSessao: [...] } }
            if (response?.TiposSessaoPlenaria?.TipoSessao) {
                return Array.isArray(response.TiposSessaoPlenaria.TipoSessao)
                    ? response.TiposSessaoPlenaria.TipoSessao
                    : [response.TiposSessaoPlenaria.TipoSessao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém a agenda atual em formato iCal.
     * Endpoint: /plenario/agenda/atual/iCal
     * @returns O conteúdo iCal como string.
     */
    async obterAgendaAtualICal() {
        const url = `/plenario/agenda/atual/iCal`;
        try {
            // Para este endpoint, a resposta é texto/ical, não JSON
            const response = await this.httpClient.get(url, {
                headers: {
                    'Accept': 'text/calendar'
                }
            });
            return response;
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém a agenda do Congresso Nacional para uma data específica.
     * Endpoint: /plenario/agenda/cn/{data}
     * @param data - Data no formato YYYYMMDD.
     */
    async obterAgendaCNPorData(data) {
        const url = `/plenario/agenda/cn/${data}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { AgendaCongresso: { DataAgenda, Eventos: { Evento: [...] } } }
            if (response?.AgendaCongresso) {
                const agendaCN = {
                    DataAgenda: response.AgendaCongresso.DataAgenda
                };
                if (response.AgendaCongresso.Eventos && response.AgendaCongresso.Eventos.Evento) {
                    const eventos = Array.isArray(response.AgendaCongresso.Eventos.Evento)
                        ? response.AgendaCongresso.Eventos.Evento
                        : [response.AgendaCongresso.Eventos.Evento];
                    agendaCN.Eventos = eventos;
                }
                return agendaCN;
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
     * Obtém a agenda do Congresso Nacional para um período.
     * Endpoint: /plenario/agenda/cn/{inicio}/{fim}
     * @param dataInicio - Data inicial no formato YYYYMMDD.
     * @param dataFim - Data final no formato YYYYMMDD.
     */
    async obterAgendaCNPorPeriodo(dataInicio, dataFim) {
        const url = `/plenario/agenda/cn/${dataInicio}/${dataFim}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { AgendaCongressoPeriodo: { Agendas: { Agenda: [...] } } }
            if (response?.AgendaCongressoPeriodo?.Agendas?.Agenda) {
                const agendas = Array.isArray(response.AgendaCongressoPeriodo.Agendas.Agenda)
                    ? response.AgendaCongressoPeriodo.Agendas.Agenda
                    : [response.AgendaCongressoPeriodo.Agendas.Agenda];
                return agendas.map((agenda) => {
                    const agendaCN = {
                        DataAgenda: agenda.DataAgenda
                    };
                    if (agenda.Eventos && agenda.Eventos.Evento) {
                        const eventos = Array.isArray(agenda.Eventos.Evento)
                            ? agenda.Eventos.Evento
                            : [agenda.Eventos.Evento];
                        agendaCN.Eventos = eventos;
                    }
                    return agendaCN;
                });
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Simplificação de acesso à agenda do Congresso Nacional.
     * Este método é uma abstração que decide qual endpoint chamar com base nos filtros.
     * @param filtros - Filtros para a agenda.
     */
    async obterAgendaCN(filtros) {
        if (filtros.dataInicio && filtros.dataFim) {
            return this.obterAgendaCNPorPeriodo(filtros.dataInicio, filtros.dataFim);
        }
        else if (filtros.data || filtros.dataInicio) {
            const data = filtros.data || filtros.dataInicio;
            if (!data) {
                throw new WrapperError("Data inválida para obter agenda do CN.");
            }
            return this.obterAgendaCNPorData(data);
        }
        else {
            throw new WrapperError("Para obter a agenda do CN, forneça data, ou dataInicio e dataFim.");
        }
    }
    /**
     * Obtém a agenda plenária para um dia específico.
     * Endpoint: /plenario/agenda/dia/{data}
     * @param data - Data no formato YYYYMMDD.
     */
    async obterAgendaDiaria(data) {
        const url = `/plenario/agenda/dia/${data}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { AgendaPlenario: { DataAgenda, Eventos: { Evento: [...] } } }
            if (response?.AgendaPlenario?.Eventos?.Evento) {
                const eventos = Array.isArray(response.AgendaPlenario.Eventos.Evento)
                    ? response.AgendaPlenario.Eventos.Evento
                    : [response.AgendaPlenario.Eventos.Evento];
                return eventos;
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém a agenda plenária para um mês específico.
     * Endpoint: /plenario/agenda/mes/{data}
     * @param data - Data no formato YYYYMM.
     */
    async obterAgendaMensal(data) {
        const url = `/plenario/agenda/mes/${data}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { AgendaPlenarioMes: { DataAgenda, Eventos: { Evento: [...] } } }
            if (response?.AgendaPlenarioMes?.Eventos?.Evento) {
                const eventos = Array.isArray(response.AgendaPlenarioMes.Eventos.Evento)
                    ? response.AgendaPlenarioMes.Eventos.Evento
                    : [response.AgendaPlenarioMes.Eventos.Evento];
                return eventos;
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém informações sobre a legislatura para uma data específica.
     * Endpoint: /plenario/legislatura/{data}
     * @param data - Data no formato YYYYMMDD.
     */
    async obterLegislatura(data) {
        const url = `/plenario/legislatura/${data}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { LegislaturaAtual: { Codigo, DataInicio, DataFim, Descricao } }
            if (response?.LegislaturaAtual) {
                return {
                    Codigo: response.LegislaturaAtual.Codigo,
                    DataInicio: response.LegislaturaAtual.DataInicio,
                    DataFim: response.LegislaturaAtual.DataFim,
                    Descricao: response.LegislaturaAtual.Descricao
                };
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
     * Lista as legislaturas disponíveis.
     * Endpoint: /plenario/lista/legislaturas
     */
    async listarLegislaturas() {
        const url = `/plenario/lista/legislaturas`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { ListaLegislaturas: { Legislaturas: { Legislatura: [...] } } }
            if (response?.ListaLegislaturas?.Legislaturas?.Legislatura) {
                const legislaturas = Array.isArray(response.ListaLegislaturas.Legislaturas.Legislatura)
                    ? response.ListaLegislaturas.Legislaturas.Legislatura
                    : [response.ListaLegislaturas.Legislaturas.Legislatura];
                return legislaturas;
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista os tipos de comparecimento possíveis para parlamentares em sessões.
     * Endpoint: /plenario/lista/tiposComparecimento
     */
    async listarTiposComparecimento() {
        const url = `/plenario/lista/tiposComparecimento`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura esperada: { TiposComparecimento: { TipoComparecimento: [...] } }
            if (response?.TiposComparecimento?.TipoComparecimento) {
                const tipos = Array.isArray(response.TiposComparecimento.TipoComparecimento)
                    ? response.TiposComparecimento.TipoComparecimento
                    : [response.TiposComparecimento.TipoComparecimento];
                return tipos;
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista as sessões plenárias por período legislativo.
     * Endpoint: /plenario/sessoes/periodo/{periodo}
     * @param periodo - O período legislativo no formato esperado pela API (ex: '2023-2024')
     */
    async listarSessoesPorPeriodo(periodo) {
        const url = `/plenario/sessoes/periodo/${periodo}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura esperada similar a outros endpoints de sessão
            if (response?.SessaoPlenariaLista?.Sessoes?.Sessao) {
                return Array.isArray(response.SessaoPlenariaLista.Sessoes.Sessao)
                    ? response.SessaoPlenariaLista.Sessoes.Sessao
                    : [response.SessaoPlenariaLista.Sessoes.Sessao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista as sessões plenárias por semana.
     * Endpoint: /plenario/sessoes/semana/{semana}
     * @param semana - Data no formato YYYYMMDD representando a segunda-feira da semana desejada
     */
    async listarSessoesPorSemana(semana) {
        const url = `/plenario/sessoes/semana/${semana}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura esperada similar a outros endpoints de sessão
            if (response?.SessaoPlenariaLista?.Sessoes?.Sessao) {
                return Array.isArray(response.SessaoPlenariaLista.Sessoes.Sessao)
                    ? response.SessaoPlenariaLista.Sessoes.Sessao
                    : [response.SessaoPlenariaLista.Sessoes.Sessao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista as sessões plenárias por tipo de sessão.
     * Endpoint: /plenario/sessoes/tipoSessao/{tipoSessao}
     * @param tipoSessao - O código ou identificador do tipo de sessão
     */
    async listarSessoesPorTipoSessao(tipoSessao) {
        const url = `/plenario/sessoes/tipoSessao/${tipoSessao}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura esperada similar a outros endpoints de sessão
            if (response?.SessaoPlenariaLista?.Sessoes?.Sessao) {
                return Array.isArray(response.SessaoPlenariaLista.Sessoes.Sessao)
                    ? response.SessaoPlenariaLista.Sessoes.Sessao
                    : [response.SessaoPlenariaLista.Sessoes.Sessao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
}
//# sourceMappingURL=plenario.js.map