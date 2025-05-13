import { handleApiError } from "../common/errors";
/**
 * Classe para interagir com os endpoints de Parlamentar da API do Senado.
 */
export class ParlamentarModule {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    /**
     * Lista os parlamentares (senadores) com base nos filtros fornecidos.
     * Endpoints relevantes:
     *  - /senador/lista/atual
     *  - /senador/lista/legislatura/{numeroLegislatura}
     *  - /senador/lista/partido/{siglaPartido}/{numeroLegislatura} (OPCIONAL)
     *  - /senador/lista/uf/{siglaUf}/{numeroLegislatura} (OPCIONAL)
     * @param filtros - Filtros para a listagem.
     */
    async listarParlamentares(filtros) {
        let url = "/senador/lista";
        const params = {};
        if (filtros?.emExercicio) {
            url = "/senador/lista/atual";
        }
        else if (filtros?.legislatura) {
            url = `/senador/lista/legislatura/${filtros.legislatura}`;
            if (filtros.partido) {
                url = `/senador/lista/partido/${filtros.partido}/${filtros.legislatura}`;
            }
            if (filtros.uf) {
                // A API não parece suportar UF e Partido ao mesmo tempo neste formato de URL
                // Priorizar UF se ambos forem fornecidos com legislatura, ou tratar como erro/aviso.
                url = `/senador/lista/uf/${filtros.uf}/${filtros.legislatura}`;
            }
        }
        else {
            // Padrão: listar senadores atuais se nenhum filtro específico de legislatura for fornecido.
            url = "/senador/lista/atual";
        }
        // Adicionar outros filtros como query params se a API suportar (ex: nome)
        if (filtros?.nome) {
            // A API do Senado não tem um endpoint de busca direta por nome que seja óbvio na documentação principal.
            // Isso pode exigir uma busca em todos e filtrar no cliente, ou um endpoint específico não documentado aqui.
            // Por enquanto, este filtro de nome não será aplicado diretamente na URL.
            // O usuário pode filtrar o resultado posteriormente.
            console.warn("Filtro por nome não é diretamente suportado pela API neste método, liste todos e filtre no cliente.");
        }
        try {
            const response = await this.httpClient.get(url, { params });
            // Estrutura comum: { ListaParlamentarEmExercicio: { Parlamentares: { Parlamentar: [...] } } }
            // Ou: { ListaParlamentarLegislatura: { Parlamentares: { Parlamentar: [...] } } }
            let parlamentares = [];
            if (response?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar) {
                parlamentares = response.ListaParlamentarEmExercicio.Parlamentares.Parlamentar;
            }
            else if (response?.ListaParlamentarLegislatura?.Parlamentares?.Parlamentar) {
                parlamentares = response.ListaParlamentarLegislatura.Parlamentares.Parlamentar;
            }
            else if (response?.ListaParlamentarPartido?.Parlamentares?.Parlamentar) {
                parlamentares = response.ListaParlamentarPartido.Parlamentares.Parlamentar;
            }
            else if (response?.ListaParlamentarUf?.Parlamentares?.Parlamentar) {
                parlamentares = response.ListaParlamentarUf.Parlamentares.Parlamentar;
            }
            return Array.isArray(parlamentares) ? parlamentares : (parlamentares ? [parlamentares] : []);
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém os detalhes de um parlamentar (senador) específico.
     * Endpoint: /senador/{codigoParlamentar}
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterDetalhesParlamentar(codigoParlamentar) {
        const url = `/senador/${codigoParlamentar}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { DetalheParlamentar: { Parlamentar: { ... } } }
            if (response?.DetalheParlamentar?.Parlamentar) {
                return response.DetalheParlamentar.Parlamentar;
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
     * Obtém os mandatos de um senador.
     * Endpoint: /senador/{codigoParlamentar}/mandatos
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterMandatosParlamentar(codigoParlamentar) {
        const url = `/senador/${codigoParlamentar}/mandatos`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { MandatoParlamentar: { Parlamentar: ..., Mandatos: { Mandato: [...] } } }
            if (response?.MandatoParlamentar?.Mandatos?.Mandato) {
                return Array.isArray(response.MandatoParlamentar.Mandatos.Mandato)
                    ? response.MandatoParlamentar.Mandatos.Mandato
                    : [response.MandatoParlamentar.Mandatos.Mandato];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém as comissões em que um senador participa ou participou.
     * Endpoint: /senador/comissoes/{codigoParlamentar}
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterComissoesParlamentar(codigoParlamentar) {
        const url = `/senador/comissoes/${codigoParlamentar}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { MembroComissaoParlamentar: { Parlamentar: ..., Comissoes: { Comissao: [...] } } }
            if (response?.MembroComissaoParlamentar?.Comissoes?.Comissao) {
                return Array.isArray(response.MembroComissaoParlamentar.Comissoes.Comissao)
                    ? response.MembroComissaoParlamentar.Comissoes.Comissao
                    : [response.MembroComissaoParlamentar.Comissoes.Comissao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém as lideranças exercidas por um senador.
     * Endpoint: /senador/liderancas/{codigoParlamentar}
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterLiderancasParlamentar(codigoParlamentar) {
        const url = `/senador/liderancas/${codigoParlamentar}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { LiderancaParlamentar: { Parlamentar: ..., Liderancas: { Lideranca: [...] } } }
            if (response?.LiderancaParlamentar?.Liderancas?.Lideranca) {
                return Array.isArray(response.LiderancaParlamentar.Liderancas.Lideranca)
                    ? response.LiderancaParlamentar.Liderancas.Lideranca
                    : [response.LiderancaParlamentar.Liderancas.Lideranca];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém as filiações partidárias de um senador.
     * Endpoint: /senador/filiacoes/{codigoParlamentar}
     */
    async obterFiliacoesPartidarias(codigoParlamentar) {
        const url = `/senador/filiacoes/${codigoParlamentar}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { FiliacaoParlamentar: { Parlamentar: ..., FiliacoesPartidarias: { Filiacao: [...] } } }
            if (response?.FiliacaoParlamentar?.FiliacoesPartidarias?.Filiacao) {
                return Array.isArray(response.FiliacaoParlamentar.FiliacoesPartidarias.Filiacao)
                    ? response.FiliacaoParlamentar.FiliacoesPartidarias.Filiacao
                    : [response.FiliacaoParlamentar.FiliacoesPartidarias.Filiacao];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém as licenças de um senador.
     * Endpoint: /senador/licencas/{codigoParlamentar}
     */
    async obterLicencasParlamentar(codigoParlamentar) {
        const url = `/senador/licencas/${codigoParlamentar}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { LicencaParlamentar: { Parlamentar: ..., Licencas: { Licenca: [...] } } }
            if (response?.LicencaParlamentar?.Licencas?.Licenca) {
                return Array.isArray(response.LicencaParlamentar.Licencas.Licenca)
                    ? response.LicencaParlamentar.Licencas.Licenca
                    : [response.LicencaParlamentar.Licencas.Licenca];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém os discursos proferidos por um senador.
     * Endpoint: /senador/{codigo}/discursos
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterDiscursosParlamentar(codigoParlamentar) {
        const url = `/senador/${codigoParlamentar}/discursos`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { DiscursosParlamentar: { Parlamentar: ..., Pronunciamentos: { Pronunciamento: [...] } } }
            if (response?.DiscursosParlamentar?.Pronunciamentos?.Pronunciamento) {
                return Array.isArray(response.DiscursosParlamentar.Pronunciamentos.Pronunciamento)
                    ? response.DiscursosParlamentar.Pronunciamentos.Pronunciamento
                    : [response.DiscursosParlamentar.Pronunciamentos.Pronunciamento];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém os apartes feitos por um senador.
     * Endpoint: /senador/{codigo}/apartes
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterApartesParlamentar(codigoParlamentar) {
        const url = `/senador/${codigoParlamentar}/apartes`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { ApartesParlamentar: { Parlamentar: ..., Apartes: { Aparte: [...] } } }
            if (response?.ApartesParlamentar?.Apartes?.Aparte) {
                return Array.isArray(response.ApartesParlamentar.Apartes.Aparte)
                    ? response.ApartesParlamentar.Apartes.Aparte
                    : [response.ApartesParlamentar.Apartes.Aparte];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém o histórico acadêmico de um senador.
     * Endpoint: /senador/{codigo}/historicoAcademico
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterHistoricoAcademico(codigoParlamentar) {
        const url = `/senador/${codigoParlamentar}/historicoAcademico`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { HistoricoAcademicoParlamentar: { Parlamentar: ..., HistoricoAcademico: { ... } } }
            if (response?.HistoricoAcademicoParlamentar?.HistoricoAcademico) {
                return response.HistoricoAcademicoParlamentar.HistoricoAcademico;
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
     * Obtém os cargos exercidos por um senador.
     * Endpoint: /senador/{codigo}/cargos
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterCargosParlamentar(codigoParlamentar) {
        const url = `/senador/${codigoParlamentar}/cargos`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { CargoParlamentar: { Parlamentar: ..., Cargos: { Cargo: [...] } } }
            if (response?.CargoParlamentar?.Cargos?.Cargo) {
                return Array.isArray(response.CargoParlamentar.Cargos.Cargo)
                    ? response.CargoParlamentar.Cargos.Cargo
                    : [response.CargoParlamentar.Cargos.Cargo];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Obtém as profissões de um senador.
     * Endpoint: /senador/{codigo}/profissao
     * @param codigoParlamentar - O código do parlamentar.
     */
    async obterProfissaoParlamentar(codigoParlamentar) {
        const url = `/senador/${codigoParlamentar}/profissao`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { ProfissaoParlamentar: { Parlamentar: ..., Profissoes: { ... } } }
            if (response?.ProfissaoParlamentar?.Profissoes) {
                return response.ProfissaoParlamentar.Profissoes;
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
     * Lista os senadores afastados/licenciados.
     * Endpoint: /senador/afastados
     */
    async listarParlamentaresAfastados() {
        const url = `/senador/afastados`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { AfastamentoAtual: { Parlamentares: { Parlamentar: [...] } } }
            if (response?.AfastamentoAtual?.Parlamentares?.Parlamentar) {
                return Array.isArray(response.AfastamentoAtual.Parlamentares.Parlamentar)
                    ? response.AfastamentoAtual.Parlamentares.Parlamentar
                    : [response.AfastamentoAtual.Parlamentares.Parlamentar];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista parlamentares por um período de legislaturas.
     * Endpoint: /senador/lista/legislatura/{legislaturaInicio}/{legislaturaFim}
     * @param legislaturaInicio - Início do período de legislaturas.
     * @param legislaturaFim - Fim do período de legislaturas.
     */
    async listarParlamentaresPorPeriodoLegislatura(legislaturaInicio, legislaturaFim) {
        const url = `/senador/lista/legislatura/${legislaturaInicio}/${legislaturaFim}`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { ListaParlamentarLegislatura: { Parlamentares: { Parlamentar: [...] } } }
            if (response?.ListaParlamentarLegislatura?.Parlamentares?.Parlamentar) {
                return Array.isArray(response.ListaParlamentarLegislatura.Parlamentares.Parlamentar)
                    ? response.ListaParlamentarLegislatura.Parlamentares.Parlamentar
                    : [response.ListaParlamentarLegislatura.Parlamentares.Parlamentar];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
    /**
     * Lista os partidos dos senadores.
     * Endpoint: /senador/partidos
     */
    async listarPartidosParlamentares() {
        const url = `/senador/partidos`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { ListaPartidos: { Partidos: { Partido: [...] } } }
            if (response?.ListaPartidos?.Partidos?.Partido) {
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
     * Lista os tipos de uso da palavra (tipos de discursos).
     * Endpoint: /senador/lista/tiposUsoPalavra
     */
    async listarTiposUsoPalavra() {
        const url = `/senador/lista/tiposUsoPalavra`;
        try {
            const response = await this.httpClient.get(url);
            // Estrutura: { ListaTiposUsoPalavra: { TiposUsoPalavra: { TipoUsoPalavra: [...] } } }
            if (response?.ListaTiposUsoPalavra?.TiposUsoPalavra?.TipoUsoPalavra) {
                return Array.isArray(response.ListaTiposUsoPalavra.TiposUsoPalavra.TipoUsoPalavra)
                    ? response.ListaTiposUsoPalavra.TiposUsoPalavra.TipoUsoPalavra
                    : [response.ListaTiposUsoPalavra.TiposUsoPalavra.TipoUsoPalavra];
            }
            return [];
        }
        catch (error) {
            throw handleApiError(error, url);
        }
    }
}
//# sourceMappingURL=parlamentar.js.map