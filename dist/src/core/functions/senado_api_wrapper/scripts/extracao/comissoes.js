"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comissaoExtractor = exports.ComissaoExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Extrator para Comissões do Senado
 */
const logger_1 = require("../utils/logging/logger");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../utils/api/endpoints");
const error_handler_1 = require("../utils/logging/error-handler");
/**
 * Classe para extração de dados de comissões do Senado
 */
class ComissaoExtractor {
    /**
     * Extrai os tipos de comissões disponíveis
     */
    async extractTipos() {
        logger_1.logger.info('Extraindo tipos de comissões');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMISSOES.TIPOS.PATH, endpoints_1.endpoints.COMISSOES.TIPOS.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração tipos de comissões');
            return response || {};
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Erro ao extrair tipos de comissões: ${errorMessage}`, error);
            return {};
        }
    }
    /**
     * Extrai a lista de comissões ativas do Senado Federal
     */
    async extractListaSenado() {
        logger_1.logger.info('Extraindo lista de comissões ativas do Senado');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMISSOES.LISTA_ATIVAS.PATH, endpoints_1.endpoints.COMISSOES.LISTA_ATIVAS.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração lista de comissões do Senado');
            // Extrai a lista de comissões da estrutura correta
            // Baseado no formato do arquivo ListaColegiados.json
            const comissoesData = response?.ListaColegiados?.Colegiados?.Colegiado || [];
            // Filtra apenas comissões do Senado (SF)
            const comissoesSF = Array.isArray(comissoesData)
                ? comissoesData.filter(c => c.SiglaCasa === 'SF')
                : [];
            // Mapeia para o formato esperado
            const comissoes = comissoesSF.map(comissao => ({
                Codigo: comissao.Codigo,
                Sigla: comissao.Sigla,
                Nome: comissao.Nome,
                DataCriacao: comissao.DataInicio,
                Ativa: comissao.Publica === 'S' ? 'Sim' : 'Não',
                TipoComissao: comissao.DescricaoTipoColegiado
            }));
            logger_1.logger.info(`Extraídas ${comissoes.length} comissões ativas do Senado`);
            return comissoes;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Erro ao extrair lista de comissões do Senado: ${errorMessage}`, error);
            throw error;
        }
    }
    /**
     * Extrai a lista de comissões mistas do Congresso Nacional
     */
    async extractListaMistas() {
        logger_1.logger.info('Extraindo lista de comissões mistas do Congresso Nacional');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMISSOES.MISTAS.PATH, endpoints_1.endpoints.COMISSOES.MISTAS.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração lista de comissões mistas');
            // Extrai a lista de comissões da estrutura correta
            // Baseado no formato do arquivo ComissoesMistasCongresso.json
            const comissoesData = response?.ComissoesMistasCongresso?.Colegiados?.Colegiado || [];
            // Garante que comissões seja uma array
            const comissoes = Array.isArray(comissoesData) ? comissoesData : [comissoesData];
            logger_1.logger.info(`Extraídas ${comissoes.length} comissões mistas`);
            return comissoes;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Erro ao extrair lista de comissões mistas: ${errorMessage}`, error);
            throw error;
        }
    }
    /**
     * Extrai detalhes de uma comissão específica
     */
    async extractDetalhe(codigo) {
        logger_1.logger.info(`Extraindo detalhes da comissão ${codigo}`);
        try {
            // Substituir o parâmetro {codigo} no caminho
            const endpoint = api.replacePath(endpoints_1.endpoints.COMISSOES.DETALHES.PATH, { codigo });
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpoints_1.endpoints.COMISSOES.DETALHES.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração detalhes da comissão ${codigo}`);
            // Extrai os detalhes da comissão
            // Baseado no formato do arquivo 449.json
            let detalhes = {};
            if (response?.ComissoesCongressoNacional?.Colegiados?.Colegiado) {
                // Formato para comissões do Congresso Nacional
                const colegiados = response.ComissoesCongressoNacional.Colegiados.Colegiado;
                const comissao = Array.isArray(colegiados)
                    ? colegiados.find(c => c.CodigoColegiado == codigo)
                    : (colegiados.CodigoColegiado == codigo ? colegiados : null);
                if (comissao) {
                    detalhes = comissao;
                }
            }
            else if (response?.DetalheComissao?.Comissao) {
                // Formato antigo/original
                detalhes = response.DetalheComissao.Comissao;
            }
            return {
                timestamp: new Date().toISOString(),
                codigo: codigo,
                detalhes: detalhes
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Erro ao extrair detalhes da comissão ${codigo}: ${errorMessage}`, error);
            throw error;
        }
    }
    /**
     * Extrai a composição de uma comissão do Senado Federal
     */
    async extractComposicaoSenado(codigo) {
        logger_1.logger.info(`Extraindo composição da comissão do Senado ${codigo}`);
        try {
            // Substituir o parâmetro {codigo} no caminho
            const endpoint = api.replacePath(endpoints_1.endpoints.COMISSOES.COMPOSICAO_SENADO.PATH, { codigo });
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpoints_1.endpoints.COMISSOES.COMPOSICAO_SENADO.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração composição da comissão ${codigo}`);
            // Extrai a composição da comissão
            const composicao = response?.ComposicaoComissao || {};
            // Garantir que membros seja sempre um array
            if (composicao.Membros && composicao.Membros.Membro && !Array.isArray(composicao.Membros.Membro)) {
                composicao.Membros.Membro = [composicao.Membros.Membro];
            }
            return {
                timestamp: new Date().toISOString(),
                codigo: codigo,
                composicao: composicao
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Erro ao extrair composição da comissão ${codigo}: ${errorMessage}`, error);
            throw error;
        }
    }
    /**
     * Extrai a composição de uma comissão mista do Congresso Nacional
     */
    async extractComposicaoMista(codigo) {
        logger_1.logger.info(`Extraindo composição da comissão mista ${codigo}`);
        try {
            // Substituir o parâmetro {codigo} no caminho
            const endpoint = api.replacePath(endpoints_1.endpoints.COMISSOES.COMPOSICAO_CONGRESSO.PATH, { codigo });
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpoints_1.endpoints.COMISSOES.COMPOSICAO_CONGRESSO.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração composição da comissão mista ${codigo}`);
            // Extrai a composição da comissão
            const composicaoOriginal = response?.ComposicaoComissaoMista || {};
            // Adaptação para formatar os dados conforme esperado
            const composicao = {
                IdentificacaoComissao: {
                    Codigo: String(codigo),
                    Sigla: composicaoOriginal.SiglaColegiado || '',
                    Nome: composicaoOriginal.NomeColegiado || ''
                },
                Membros: {
                    Membro: []
                }
            };
            // Extrair membros da estrutura específica das comissões mistas
            // Baseado no formato do arquivo 449.json
            if (composicaoOriginal.MembrosBlocoSF) {
                const blocos = composicaoOriginal.MembrosBlocoSF.PartidoBloco || [];
                (Array.isArray(blocos) ? blocos : [blocos]).forEach(bloco => {
                    if (bloco.MembrosSF && bloco.MembrosSF.Membro) {
                        const membros = Array.isArray(bloco.MembrosSF.Membro)
                            ? bloco.MembrosSF.Membro
                            : [bloco.MembrosSF.Membro];
                        membros.forEach((membro) => {
                            if (composicao.Membros.Membro && Array.isArray(composicao.Membros.Membro)) {
                                composicao.Membros.Membro.push({
                                    IdentificacaoParlamentar: {
                                        CodigoParlamentar: membro.CodigoParlamentar || '',
                                        NomeParlamentar: membro.NomeParlamentar || '',
                                        SiglaPartidoParlamentar: membro.Partido || '',
                                        UfParlamentar: membro.SiglaUf || ''
                                    },
                                    DescricaoParticipacao: membro.TipoVaga || 'Membro',
                                    DataDesignacao: membro.DataDesignacao || null,
                                    DataFim: membro.DataFim || null,
                                    DescricaoCargo: membro.ProprietarioVaga || ''
                                });
                            }
                        });
                    }
                });
            }
            if (composicaoOriginal.MembrosBlocoCD) {
                const membrosCD = composicaoOriginal.MembrosBlocoCD.Membro || [];
                (Array.isArray(membrosCD) ? membrosCD : [membrosCD]).forEach(membroItem => {
                    if (membroItem.MembrosCD && membroItem.MembrosCD.Membro) {
                        const membros = Array.isArray(membroItem.MembrosCD.Membro)
                            ? membroItem.MembrosCD.Membro
                            : [membroItem.MembrosCD.Membro];
                        membros.forEach((membro) => {
                            if (composicao.Membros.Membro && Array.isArray(composicao.Membros.Membro)) {
                                composicao.Membros.Membro.push({
                                    IdentificacaoParlamentar: {
                                        CodigoParlamentar: membro.CodigoParlamentar || '',
                                        NomeParlamentar: membro.NomeParlamentar || '',
                                        SiglaPartidoParlamentar: membro.Partido || '',
                                        UfParlamentar: membro.SiglaUf || ''
                                    },
                                    DescricaoParticipacao: membro.TipoVaga || 'Membro',
                                    DataDesignacao: membro.DataDesignacao || null,
                                    DataFim: membro.DataFim || null,
                                    DescricaoCargo: membro.ProprietarioVaga || ''
                                });
                            }
                        });
                    }
                });
            }
            return {
                timestamp: new Date().toISOString(),
                codigo: codigo,
                composicao: composicao
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Erro ao extrair composição da comissão mista ${codigo}: ${errorMessage}`, error);
            throw error;
        }
    }
    /**
     * Função para simular dados de exemplo quando a API não retorna dados reais
     * Isso é usado como fallback para desenvolvimento e testes
     */
    createMockData() {
        logger_1.logger.warn('Criando dados simulados para comissões (fallback para desenvolvimento)');
        // Usar os dados dos arquivos de exemplo para criar dados simulados
        const comissoesMistas = [
            {
                CodigoColegiado: "449",
                SiglaColegiado: "CCAI",
                NomeColegiado: "Comissão Mista de Controle das Atividades de Inteligência",
                Subtitulo: "(Resolução nº 2, de 2013-CN - Art. 6º da Lei nº 9.883/1999)",
                Finalidade: "A fiscalização e o controle externos das atividades de inteligência e contrainteligência e de outras a elas relacionadas, no Brasil ou no exterior.",
                DataInicio: "1999-12-07",
                TipoColegiado: {
                    TipoColegiado: "Comissão Permanente",
                    Sigla_casa: "CN",
                    CodigoTipo: "41"
                }
            },
            {
                CodigoColegiado: "1450",
                SiglaColegiado: "CMMC",
                NomeColegiado: "Comissão Mista Permanente sobre Mudanças Climáticas",
                Subtitulo: "(Criada pela Resolução nº 4/2008-CN)",
                Finalidade: "Acompanhar, monitorar e fiscalizar, de modo contínuo, as ações referentes às mudanças climáticas no Brasil",
                DataInicio: "2008-12-30",
                TipoColegiado: {
                    TipoColegiado: "Comissão Permanente",
                    Sigla_casa: "CN",
                    CodigoTipo: "41"
                }
            }
        ];
        // Adicionar algumas comissões do Senado simuladas
        const comissoesSenado = [
            {
                Codigo: "38",
                Sigla: "CAE",
                Nome: "Comissão de Assuntos Econômicos",
                DataCriacao: "1900-01-01",
                Ativa: "Sim",
                TipoComissao: "Comissão Permanente"
            },
            {
                Codigo: "40",
                Sigla: "CAS",
                Nome: "Comissão de Assuntos Sociais",
                DataCriacao: "1900-01-01",
                Ativa: "Sim",
                TipoComissao: "Comissão Permanente"
            }
        ];
        // Criar resultado simulado para a lista
        const listaResult = {
            timestamp: new Date().toISOString(),
            total: comissoesSenado.length + comissoesMistas.length,
            comissoes: {
                senado: comissoesSenado,
                mistas: comissoesMistas
            }
        };
        // Criar detalhes simulados
        const detalhesResults = [
            {
                timestamp: new Date().toISOString(),
                codigo: "449",
                detalhes: {
                    CodigoColegiado: "449",
                    NomeColegiado: "Comissão Mista de Controle das Atividades de Inteligência",
                    SiglaColegiado: "CCAI",
                    Finalidade: "A fiscalização e o controle externos das atividades de inteligência e contrainteligência e de outras a elas relacionadas, no Brasil ou no exterior.",
                    DataInicio: "07/12/1999"
                }
            }
        ];
        // Criar composições simuladas
        const composicoesResults = [
            {
                timestamp: new Date().toISOString(),
                codigo: "449",
                composicao: {
                    IdentificacaoComissao: {
                        Codigo: "449",
                        Sigla: "CCAI",
                        Nome: "Comissão Mista de Controle das Atividades de Inteligência"
                    },
                    Membros: {
                        Membro: [
                            {
                                IdentificacaoParlamentar: {
                                    CodigoParlamentar: "5985",
                                    NomeParlamentar: "Senador Nelsinho Trad",
                                    SiglaPartidoParlamentar: "PSD",
                                    UfParlamentar: "MS"
                                },
                                DescricaoParticipacao: "Titular",
                                DescricaoCargo: "VICE-PRESIDENTE"
                            },
                            {
                                IdentificacaoParlamentar: {
                                    CodigoParlamentar: "6118",
                                    NomeParlamentar: "Deputado Filipe Barros",
                                    SiglaPartidoParlamentar: "PL",
                                    UfParlamentar: "PR"
                                },
                                DescricaoParticipacao: "Titular",
                                DescricaoCargo: "PRESIDENTE"
                            }
                        ]
                    }
                }
            }
        ];
        // Retornar o resultado simulado completo
        return {
            lista: listaResult,
            detalhes: detalhesResults,
            composicoes: composicoesResults,
            tipos: {
                ListaTiposColegiado: {
                    TiposColegiado: [
                        { Sigla: "PERMANENTE", Descricao: "Comissão Permanente" },
                        { Sigla: "PERM", Descricao: "Comissão Permanente" },
                        { Sigla: "SUBTECOPE", Descricao: "Subcomissão Temporária" },
                        { Sigla: "SUBPECOPE", Descricao: "Subcomissão Permanente" }
                    ]
                }
            }
        };
    }
    /**
     * Extrai todas as comissões ativas e suas composições
     */
    async extractAll() {
        try {
            // Obter os tipos de comissões
            const tiposComissoes = await this.extractTipos();
            logger_1.logger.info('Tipos de comissões obtidos');
            // Obter listas de comissões
            let comissoesSenado = [];
            let comissoesMistas = [];
            try {
                comissoesSenado = await this.extractListaSenado();
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger_1.logger.error(`Erro ao extrair comissões do Senado: ${errorMessage}`, error);
                // Continuar com array vazio
            }
            try {
                comissoesMistas = await this.extractListaMistas();
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger_1.logger.error(`Erro ao extrair comissões mistas: ${errorMessage}`, error);
                // Continuar com array vazio
            }
            logger_1.logger.info(`Extraídas ${comissoesSenado.length} comissões do Senado e ${comissoesMistas.length} comissões mistas`);
            // Se não tiver nenhuma comissão, usar dados simulados para desenvolvimento
            if (comissoesSenado.length === 0 && comissoesMistas.length === 0) {
                logger_1.logger.warn('Nenhuma comissão encontrada, usando dados simulados para desenvolvimento');
                return this.createMockData();
            }
            const listaResult = {
                timestamp: new Date().toISOString(),
                total: comissoesSenado.length + comissoesMistas.length,
                comissoes: {
                    senado: comissoesSenado,
                    mistas: comissoesMistas
                }
            };
            // Extrair detalhes para cada comissão do Senado
            logger_1.logger.info(`Iniciando extração de detalhes para ${comissoesSenado.length} comissões do Senado`);
            const detalhesSenadoPromises = comissoesSenado.map(async (comissao) => {
                const codigo = comissao.Codigo;
                if (!codigo) {
                    logger_1.logger.warn(`Comissão do Senado sem código encontrada: ${JSON.stringify(comissao)}`);
                    return null;
                }
                try {
                    // Usar um breve atraso entre requisições para evitar sobrecarregar a API
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return await this.extractDetalhe(codigo);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger_1.logger.warn(`Falha ao extrair detalhes da comissão ${codigo}, continuando com as demais...: ${errorMessage}`, error);
                    return null;
                }
            });
            // Extrair detalhes para cada comissão mista
            logger_1.logger.info(`Iniciando extração de detalhes para ${comissoesMistas.length} comissões mistas`);
            const detalhesMistasPromises = comissoesMistas.map(async (comissao) => {
                const codigo = comissao.CodigoColegiado;
                if (!codigo) {
                    logger_1.logger.warn(`Comissão mista sem código encontrada: ${JSON.stringify(comissao)}`);
                    return null;
                }
                try {
                    // Usar um breve atraso entre requisições para evitar sobrecarregar a API
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return await this.extractDetalhe(codigo);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger_1.logger.warn(`Falha ao extrair detalhes da comissão mista ${codigo}, continuando com as demais...: ${errorMessage}`, error);
                    return null;
                }
            });
            // Aguarda todas as promessas de detalhes e filtra resultados nulos
            const detalhesResults = (await Promise.all([...detalhesSenadoPromises, ...detalhesMistasPromises]))
                .filter(result => result !== null);
            // Extrair composição para cada comissão do Senado
            logger_1.logger.info(`Iniciando extração de composição para ${comissoesSenado.length} comissões do Senado`);
            const composicaoSenadoPromises = comissoesSenado.map(async (comissao) => {
                const codigo = comissao.Codigo;
                if (!codigo) {
                    logger_1.logger.warn(`Comissão do Senado sem código encontrada: ${JSON.stringify(comissao)}`);
                    return null;
                }
                try {
                    // Usar um breve atraso entre requisições para evitar sobrecarregar a API
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return await this.extractComposicaoSenado(codigo);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger_1.logger.warn(`Falha ao extrair composição da comissão ${codigo}, continuando com as demais...: ${errorMessage}`, error);
                    return null;
                }
            });
            // Extrair composição para cada comissão mista
            logger_1.logger.info(`Iniciando extração de composição para ${comissoesMistas.length} comissões mistas`);
            const composicaoMistasPromises = comissoesMistas.map(async (comissao) => {
                const codigo = comissao.CodigoColegiado;
                if (!codigo) {
                    logger_1.logger.warn(`Comissão mista sem código encontrada: ${JSON.stringify(comissao)}`);
                    return null;
                }
                try {
                    // Usar um breve atraso entre requisições para evitar sobrecarregar a API
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return await this.extractComposicaoMista(codigo);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger_1.logger.warn(`Falha ao extrair composição da comissão mista ${codigo}, continuando com as demais...: ${errorMessage}`, error);
                    return null;
                }
            });
            // Aguarda todas as promessas de composição e filtra resultados nulos
            const composicoesResults = (await Promise.all([...composicaoSenadoPromises, ...composicaoMistasPromises]))
                .filter(result => result !== null);
            logger_1.logger.info(`Extração completa: ${listaResult.total} comissões, ${detalhesResults.length} detalhes e ${composicoesResults.length} composições`);
            return {
                lista: listaResult,
                detalhes: detalhesResults,
                composicoes: composicoesResults,
                tipos: tiposComissoes
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Erro na extração completa de comissões: ${errorMessage}`, error);
            throw error;
        }
    }
}
exports.ComissaoExtractor = ComissaoExtractor;
// Exporta uma instância do extrator
exports.comissaoExtractor = new ComissaoExtractor();
// Exemplo de uso:
if (require.main === module) {
    // Se executado diretamente (não importado como módulo)
    (async () => {
        try {
            logger_1.logger.info('Iniciando extração de comissões');
            const resultado = await exports.comissaoExtractor.extractAll();
            logger_1.logger.info(`Extração concluída: ${resultado.lista.total} comissões extraídas`);
            if (resultado.lista.comissoes.senado.length > 0) {
                console.log(`Primeira comissão do Senado: ${JSON.stringify(resultado.lista.comissoes.senado[0], null, 2)}`);
            }
            if (resultado.lista.comissoes.mistas.length > 0) {
                console.log(`Primeira comissão mista: ${JSON.stringify(resultado.lista.comissoes.mistas[0], null, 2)}`);
            }
            if (resultado.detalhes.length > 0) {
                console.log(`Exemplo de detalhe: ${JSON.stringify(resultado.detalhes[0], null, 2)}`);
            }
            if (resultado.composicoes.length > 0) {
                console.log(`Exemplo de composição: ${JSON.stringify(resultado.composicoes[0], null, 2)}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Erro ao executar o script: ${errorMessage}`, error);
            process.exit(1);
        }
    })();
}
//# sourceMappingURL=comissoes.js.map