import { handleApiError, WrapperError } from "../common/errors";
/**
 * Classe para interagir com os endpoints de Comissão da API do Senado.
 */
export class ComissaoModule {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
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
    async listarComissoes(filtros) {
        let url = "/comissao/lista"; // Declarar url no escopo da função
        try {
            const params = {};
            if (filtros?.tipo) {
                // O endpoint /comissao/lista/{tipo} parece ser específico do Senado.
                // Para o Congresso, os tipos são diferentes (ex: cpmi, mpv).
                // Precisamos de uma lógica mais elaborada aqui ou endpoints mais específicos.
                url = `/comissao/lista/${filtros.tipo}`;
            }
            else if (filtros?.casa === 'CN' && filtros?.ativas) {
                url = `/comissao/lista/mistas`; // Exemplo, pode precisar de ajuste
            }
            else if (filtros?.casa === 'SF' && filtros?.ativas) {
                url = `/comissao/lista/colegiados`;
            }
            else {
                // Endpoint genérico ou padrão? A API não parece ter um "listar todas"
                // Vamos usar /comissao/lista/tiposColegiado como um fallback amplo, mas pode não ser ideal.
                // Este endpoint retorna os tipos, não as comissões em si diretamente.
                // A melhor abordagem seria o usuário especificar o tipo ou casa.
                // Por enquanto, vamos focar em um caso mais simples, como listar por tipo.
                // Se nenhum filtro for passado, talvez listar as ativas do Senado seja um bom padrão.
                url = `/comissao/lista/colegiados`; // Comissões do Senado em atividade
                // TODO: Melhorar a lógica de seleção de endpoint com base nos filtros.
            }
            // A API do Senado frequentemente aninha a lista de comissões.
            // Ex: { ListaColegiados: { Colegiados: { Colegiado: [...] } } }
            // O httpClient já retorna response.data, então precisamos desaninhar aqui.
            const response = await this.httpClient.get(url, { params });
            if (response && response.ListaColegiados && response.ListaColegiados.Colegiados && response.ListaColegiados.Colegiados.Colegiado) {
                return Array.isArray(response.ListaColegiados.Colegiados.Colegiado)
                    ? response.ListaColegiados.Colegiados.Colegiado
                    : [response.ListaColegiados.Colegiados.Colegiado];
            }
            else if (response && response.ComissoesMistasCongresso && response.ComissoesMistasCongresso.Comissoes && response.ComissoesMistasCongresso.Comissoes.Comissao) {
                // Para /comissao/lista/mistas
                return Array.isArray(response.ComissoesMistasCongresso.Comissoes.Comissao)
                    ? response.ComissoesMistasCongresso.Comissoes.Comissao
                    : [response.ComissoesMistasCongresso.Comissoes.Comissao];
            }
            // Adicionar mais casos de desaninhamento conforme necessário para outros endpoints de listagem.
            return []; // Retorna array vazio se a estrutura não for reconhecida
        }
        catch (error) {
            throw handleApiError(error, url); // Agora 'url' está no escopo correto
        }
    }
    /**
     * Lista os tipos de colegiados disponíveis.
     * Endpoint: /comissao/lista/tiposColegiado
     */
    async listarTiposColegiado() {
        const url = "/comissao/lista/tiposColegiado";
        try {
            const response = await this.httpClient.get(url);
            if (response && response.ListaTiposColegiado && response.ListaTiposColegiado.Tipos && response.ListaTiposColegiado.Tipos.Tipo) {
                return Array.isArray(response.ListaTiposColegiado.Tipos.Tipo)
                    ? response.ListaTiposColegiado.Tipos.Tipo
                    : [response.ListaTiposColegiado.Tipos.Tipo];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém os detalhes de uma comissão específica.
     * Endpoint: /comissao/{codigo}
     * @param codigoComissao - O código da comissão.
     */
    async obterDetalhesComissao(codigoComissao) {
        const url = `/comissao/${codigoComissao}`;
        try {
            const response = await this.httpClient.get(url);
            // A resposta pode vir como { DetalheComissao: { Comissao: { ... } } }
            if (response && response.DetalheComissao && response.DetalheComissao.Comissao) {
                return response.DetalheComissao.Comissao;
            }
            return null;
        }
        catch (error) {
            if (error.response && error.response.status === 404) {
                return null; // Recurso não encontrado
            }
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém a composição de uma comissão específica.
     * Endpoints:
     *  - /composicao/comissao/{codigo} (Senado)
     *  - /composicao/comissao/atual/mista/{codigo} (Congresso/Mista)
     * @param codigoComissao - O código da comissão.
     * @param casa - Especificar se é do 'SF' (Senado) ou 'CN' (Congresso/Mista) para o endpoint correto.
     */
    async obterComposicaoComissao(codigoComissao, casa = 'SF') {
        let url = casa === 'SF'
            ? `/composicao/comissao/${codigoComissao}`
            : `/composicao/comissao/atual/mista/${codigoComissao}`;
        try {
            const response = await this.httpClient.get(url);
            // Exemplo de estrutura: { ComposicaoComissao: { IdentificacaoComissao: ..., Membros: { Membro: [...] } } }
            // Ou { UltimaComposicaoComissaoSf: { ComposicaoComissao: { ... } } }
            if (response && response.ComposicaoComissao) {
                return response.ComposicaoComissao;
            }
            else if (response && response.UltimaComposicaoComissaoSf && response.UltimaComposicaoComissaoSf.ComposicaoComissao) {
                return response.UltimaComposicaoComissaoSf.ComposicaoComissao;
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
     * Obtém a agenda de reuniões de comissões.
     * Endpoints:
     *  - /comissao/agenda/{dataInicio}/{dataFim}
     *  - /comissao/agenda/{dataReferencia}
     *  - /comissao/agenda/mes/{mesReferencia} (YYYYMM)
     * @param filtros - Filtros para a agenda, como data de início e fim.
     */
    async obterAgendaComissao(filtros) {
        let url = "";
        if (filtros.dataInicio && filtros.dataFim) {
            url = `/comissao/agenda/${filtros.dataInicio}/${filtros.dataFim}`;
        }
        else if (filtros.dataInicio) { // Assumindo que dataInicio pode ser usado como dataReferencia
            url = `/comissao/agenda/${filtros.dataInicio}`;
        }
        else {
            throw new WrapperError("Para obter a agenda, é necessário fornecer dataInicio e dataFim, ou apenas dataInicio (como dataReferencia).");
        }
        try {
            const response = await this.httpClient.get(url);
            // Exemplo de estrutura: { AgendaComissoes: { Comissao: [...] } } ou similar
            if (response && response.AgendaComissoes && response.AgendaComissoes.Comissao) {
                return Array.isArray(response.AgendaComissoes.Comissao)
                    ? response.AgendaComissoes.Comissao
                    : [response.AgendaComissoes.Comissao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém informações detalhadas de uma reunião de comissão específica.
     * Endpoint: /comissao/reuniao/{codigoReuniao}
     * @param codigoReuniao - O código da reunião.
     */
    async obterDetalhesReuniaoComissao(codigoReuniao) {
        const url = `/comissao/reuniao/${codigoReuniao}`;
        try {
            const response = await this.httpClient.get(url);
            // Exemplo de estrutura: { DetalheReuniaoComissao: { Reuniao: { ... } } }
            if (response && response.DetalheReuniaoComissao && response.DetalheReuniaoComissao.Reuniao) {
                return response.DetalheReuniaoComissao.Reuniao;
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
     * Obtém a agenda de comissões atual no formato iCalendar.
     * Endpoint: /comissao/agenda/atual/iCal
     * Este método retorna um arraystringificado de objetos de agenda
     * devido à natureza do formato iCal.
     */
    async obterAgendaICal() {
        const url = "/comissao/agenda/atual/iCal";
        try {
            // Este endpoint pode retornar um arquivo iCal em vez de JSON
            // Precisamos ajustar a configuração do httpClient para aceitar texto puro
            const response = await this.httpClient.get(url, {
                headers: {
                    Accept: 'text/calendar'
                },
                responseType: 'text'
            });
            return response;
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém a agenda de comissões para um mês específico.
     * Endpoint: /comissao/agenda/mes/{mesReferencia}
     * @param filtros - Filtros com mês de referência no formato YYYYMM.
     */
    async obterAgendaMes(filtros) {
        if (!filtros.mesReferencia || filtros.mesReferencia.length !== 6) {
            throw new WrapperError("O mês de referência deve ser fornecido no formato YYYYMM (ex: 202501).");
        }
        const url = `/comissao/agenda/mes/${filtros.mesReferencia}`;
        try {
            const response = await this.httpClient.get(url);
            if (response && response.AgendaComissoesMes && response.AgendaComissoesMes.Comissao) {
                return Array.isArray(response.AgendaComissoesMes.Comissao)
                    ? response.AgendaComissoesMes.Comissao
                    : [response.AgendaComissoesMes.Comissao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém requerimentos de CPI.
     * Endpoint: /comissao/cpi/{comissao}/requerimentos
     * @param codigoComissao - O código da comissão CPI.
     */
    async obterRequerimentosCPI(codigoComissao) {
        const url = `/comissao/cpi/${codigoComissao}/requerimentos`;
        try {
            const response = await this.httpClient.get(url);
            if (response && response.RequerimentosCPI && response.RequerimentosCPI.Requerimentos && response.RequerimentosCPI.Requerimentos.Requerimento) {
                return Array.isArray(response.RequerimentosCPI.Requerimentos.Requerimento)
                    ? response.RequerimentosCPI.Requerimentos.Requerimento
                    : [response.RequerimentosCPI.Requerimentos.Requerimento];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém documentos de uma comissão específica por tipo.
     * Endpoint: /comissao/reuniao/{sigla}/documento/{tipoDocumento}
     * @param filtros - Filtros com sigla da comissão e tipo de documento.
     */
    async obterDocumentosComissao(filtros) {
        if (!filtros.siglaComissao || !filtros.tipoDocumento) {
            throw new WrapperError("A sigla da comissão e o tipo de documento são obrigatórios.");
        }
        const url = `/comissao/reuniao/${filtros.siglaComissao}/documento/${filtros.tipoDocumento}`;
        try {
            const response = await this.httpClient.get(url);
            if (response && response.DocumentosComissao && response.DocumentosComissao.Documentos && response.DocumentosComissao.Documentos.Documento) {
                return Array.isArray(response.DocumentosComissao.Documentos.Documento)
                    ? response.DocumentosComissao.Documentos.Documento
                    : [response.DocumentosComissao.Documentos.Documento];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém notas taquigráficas de uma reunião de comissão.
     * Endpoint: /comissao/reuniao/notas/{codigoReuniao}
     * @param codigoReuniao - O código da reunião.
     */
    async obterNotasTaquigraficas(codigoReuniao) {
        const url = `/comissao/reuniao/notas/${codigoReuniao}`;
        try {
            const response = await this.httpClient.get(url);
            if (response && response.NotasTaquigraficas && response.NotasTaquigraficas.Reuniao) {
                return response.NotasTaquigraficas.Reuniao;
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
//# sourceMappingURL=comissao.js.map