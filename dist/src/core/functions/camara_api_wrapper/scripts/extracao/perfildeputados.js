"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilDeputadosExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Extrator especializado para perfis de deputados da API da Câmara dos Deputados
 * Este módulo trata especificamente da extração de perfis completos de deputados
 */
const logger_1 = require("../utils/logging/logger");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../config/endpoints");
const error_handler_1 = require("../utils/logging/error-handler");
/**
 * Classe para extração de perfis completos de deputados
 */
class PerfilDeputadosExtractor {
    /**
     * Extrai a lista de deputados de uma legislatura específica
     * @param legislatura - Número da legislatura
     * @returns Dados dos deputados da legislatura
     */
    async extractDeputadosLegislatura(legislatura) {
        try {
            logger_1.logger.info(`Extraindo lista de deputados da legislatura ${legislatura}`);
            // Obter a lista de deputados da legislatura específica
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.LISTA;
            const params = { ...endpointConfig.PARAMS };
            // Substituir o placeholder da legislatura
            if (params.idLegislatura) {
                params.idLegislatura = params.idLegislatura.replace('{legislatura}', legislatura.toString());
            }
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpointConfig.PATH, params), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração lista de deputados da legislatura ${legislatura}`);
            // Verificação cuidadosa da estrutura de resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia para lista de deputados da legislatura ${legislatura}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpointConfig.PATH,
                    deputados: [],
                    metadados: {}
                };
            }
            // Extrair a lista de deputados
            const deputados = response.dados || [];
            logger_1.logger.info(`Encontrados ${deputados.length} deputados na legislatura ${legislatura}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpointConfig.PATH,
                deputados: deputados,
                metadados: response.links || {}
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair lista de deputados da legislatura ${legislatura}: ${error.message}`);
            // Retornar objeto vazio em vez de lançar erro
            return {
                timestamp: new Date().toISOString(),
                origem: endpoints_1.endpoints.DEPUTADOS.LISTA.PATH,
                deputados: [],
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai perfil completo de um deputado específico
     * @param codigoDeputado - Código do deputado na API
     * @returns Perfil completo do deputado
     */
    async extractPerfilCompleto(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo perfil completo do deputado código ${codigoDeputado}`);
            // 1. Extrair dados básicos
            const dadosBasicos = await this.extractDadosBasicos(codigoDeputado);
            // Verificar se os dados básicos foram obtidos com sucesso
            if (!dadosBasicos || !dadosBasicos.dados) {
                logger_1.logger.warn(`Dados básicos não obtidos para o deputado ${codigoDeputado}, abortando perfil completo`);
                return {
                    timestamp: new Date().toISOString(),
                    codigo: codigoDeputado,
                    dadosBasicos: dadosBasicos,
                    erro: "Dados básicos não obtidos, perfil incompleto"
                };
            }
            // 2. Extrair dados complementares (paralelização)
            const [orgaos, frentes, ocupacoes, mandatosExternos, historico, profissoes] = await Promise.allSettled([
                this.extractOrgaos(codigoDeputado),
                this.extractFrentes(codigoDeputado),
                this.extractOcupacoes(codigoDeputado),
                this.extractMandatosExternos(codigoDeputado),
                this.extractHistorico(codigoDeputado),
                this.extractProfissoes(codigoDeputado)
            ]);
            // 3. Consolidar todos os dados
            const perfilCompleto = {
                timestamp: new Date().toISOString(),
                codigo: codigoDeputado,
                dadosBasicos: dadosBasicos,
                orgaos: orgaos.status === 'fulfilled' ? orgaos.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.DEPUTADOS.ORGAOS.PATH, { codigo: codigoDeputado.toString() }),
                    dados: null,
                    erro: orgaos.status === 'rejected' ? orgaos.reason?.message : 'Informação não disponível'
                },
                frentes: frentes.status === 'fulfilled' ? frentes.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.DEPUTADOS.FRENTES.PATH, { codigo: codigoDeputado.toString() }),
                    dados: null,
                    erro: frentes.status === 'rejected' ? frentes.reason?.message : 'Informação não disponível'
                },
                ocupacoes: ocupacoes.status === 'fulfilled' ? ocupacoes.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.DEPUTADOS.OCUPACOES.PATH, { codigo: codigoDeputado.toString() }),
                    dados: null,
                    erro: ocupacoes.status === 'rejected' ? ocupacoes.reason?.message : 'Informação não disponível'
                },
                mandatosExternos: mandatosExternos.status === 'fulfilled' ? mandatosExternos.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.DEPUTADOS.MANDATOS_EXTERNOS.PATH, { codigo: codigoDeputado.toString() }),
                    dados: null,
                    erro: mandatosExternos.status === 'rejected' ? mandatosExternos.reason?.message : 'Informação não disponível'
                },
                historico: historico.status === 'fulfilled' ? historico.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.DEPUTADOS.HISTORICO.PATH, { codigo: codigoDeputado.toString() }),
                    dados: null,
                    erro: historico.status === 'rejected' ? historico.reason?.message : 'Informação não disponível'
                },
                profissoes: profissoes.status === 'fulfilled' ? profissoes.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.DEPUTADOS.PROFISSOES.PATH, { codigo: codigoDeputado.toString() }),
                    dados: null,
                    erro: profissoes.status === 'rejected' ? profissoes.reason?.message : 'Informação não disponível'
                }
            };
            logger_1.logger.info(`Perfil completo do deputado ${codigoDeputado} extraído com sucesso`);
            return perfilCompleto;
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair perfil completo do deputado ${codigoDeputado}: ${error.message}`);
            // Retornar objeto mínimo para não quebrar o fluxo
            return {
                timestamp: new Date().toISOString(),
                codigo: codigoDeputado,
                dadosBasicos: {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.DEPUTADOS.PERFIL.PATH, { codigo: codigoDeputado.toString() }),
                    dados: null,
                    metadados: {},
                    erro: error.message
                },
                erro: error.message
            };
        }
    }
    /**
     * Extrai dados básicos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Dados básicos do deputado
     */
    async extractDadosBasicos(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo dados básicos do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.PERFIL;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração dados básicos do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia para o deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Verificar se a resposta tem a estrutura esperada
            if (!response.dados) {
                logger_1.logger.warn(`Estrutura de dados inválida para o deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de dados inválida"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados,
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.PERFIL.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair dados básicos do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai despesas de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Despesas do deputado
     */
    async extractDespesas(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo despesas do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.DESPESAS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração despesas do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar despesas do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.DESPESAS.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair despesas do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai discursos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @param legislatura - Número da legislatura (opcional)
     * @returns Discursos do deputado
     */
    async extractDiscursos(codigoDeputado, legislatura) {
        try {
            logger_1.logger.info(`Extraindo discursos do deputado código ${codigoDeputado}${legislatura ? ` da legislatura ${legislatura}` : ''}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.DISCURSOS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            // Adicionar parâmetro de legislatura se fornecido
            const params = { ...endpointConfig.PARAMS };
            if (legislatura) {
                params.idLegislatura = legislatura.toString();
            }
            // Tentar primeiro com a URL base padrão
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, params), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração discursos do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar discursos do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.DISCURSOS.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair discursos do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai eventos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Eventos do deputado
     */
    async extractEventos(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo eventos do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.EVENTOS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração eventos do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar eventos do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.EVENTOS.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair eventos do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai órgãos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Órgãos do deputado
     */
    async extractOrgaos(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo órgãos do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.ORGAOS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração órgãos do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar órgãos do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.ORGAOS.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair órgãos do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai frentes parlamentares de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Frentes do deputado
     */
    async extractFrentes(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo frentes do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.FRENTES;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração frentes do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar frentes do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.FRENTES.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair frentes do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai ocupações de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Ocupações do deputado
     */
    async extractOcupacoes(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo ocupações do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.OCUPACOES;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração ocupações do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar ocupações do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.OCUPACOES.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair ocupações do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai mandatos externos de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Mandatos externos do deputado
     */
    async extractMandatosExternos(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo mandatos externos do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.MANDATOS_EXTERNOS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração mandatos externos do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar mandatos externos do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.MANDATOS_EXTERNOS.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair mandatos externos do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai histórico de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Histórico do deputado
     */
    async extractHistorico(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo histórico do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.HISTORICO;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração histórico do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar histórico do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.HISTORICO.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair histórico do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai profissões de um deputado
     * @param codigoDeputado - Código do deputado na API
     * @returns Profissões do deputado
     */
    async extractProfissoes(codigoDeputado) {
        try {
            logger_1.logger.info(`Extraindo profissões do deputado código ${codigoDeputado}`);
            const endpointConfig = endpoints_1.endpoints.DEPUTADOS.PROFISSOES;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoDeputado.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração profissões do deputado ${codigoDeputado}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar profissões do deputado ${codigoDeputado}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.dados || [],
                metadados: response.links || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.DEPUTADOS.PROFISSOES.PATH, { codigo: codigoDeputado.toString() });
            logger_1.logger.error(`Erro ao extrair profissões do deputado ${codigoDeputado}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai perfil completo de múltiplos deputados
     * @param deputados - Lista de códigos de deputados
     * @param concurrency - Número de requisições simultâneas
     * @param maxRetries - Número máximo de retentativas por deputado
     * @returns Perfis completos extraídos
     */
    async extractMultiplosPerfis(deputados, concurrency = 3, maxRetries = 3) {
        logger_1.logger.info(`Extraindo perfis completos de ${deputados.length} deputados (concorrência: ${concurrency})`);
        const resultados = [];
        const totalDeputados = deputados.length;
        // Processar em lotes para controlar a concorrência
        for (let i = 0; i < totalDeputados; i += concurrency) {
            const lote = deputados.slice(i, i + concurrency);
            // Adicionar um atraso maior entre lotes para evitar sobrecarga na API
            if (i > 0) {
                logger_1.logger.info(`Aguardando 3 segundos antes de processar o próximo lote de deputados...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            // Extrair perfis do lote em paralelo
            const promessas = lote.map(codigo => {
                // Adiciona retentativas para cada deputado
                return this.extractPerfilCompletoComRetry(codigo, maxRetries);
            });
            try {
                // Aguardar conclusão do lote
                const resultadosLote = await Promise.allSettled(promessas);
                // Filtrar apenas os resultados bem-sucedidos
                resultadosLote.forEach(resultado => {
                    if (resultado.status === 'fulfilled' && resultado.value) {
                        resultados.push(resultado.value);
                    }
                    else if (resultado.status === 'rejected') {
                        logger_1.logger.warn(`Falha ao extrair perfil: ${resultado.reason}`);
                    }
                });
                logger_1.logger.info(`Progresso: ${Math.min(i + concurrency, totalDeputados)}/${totalDeputados} deputados`);
            }
            catch (error) {
                logger_1.logger.error(`Erro ao processar lote de deputados: ${error.message}`);
                // Continua o processamento mesmo com erro
            }
        }
        logger_1.logger.info(`Extração concluída: ${resultados.length}/${totalDeputados} perfis extraídos com sucesso`);
        return resultados;
    }
    /**
     * Extrai perfil completo de um deputado com retentativas
     * @param codigoDeputado - Código do deputado
     * @param maxRetries - Número máximo de retentativas
     * @returns Perfil completo
     */
    async extractPerfilCompletoComRetry(codigoDeputado, maxRetries = 3) {
        let tentativas = 0;
        while (tentativas < maxRetries) {
            try {
                tentativas++;
                return await this.extractPerfilCompleto(codigoDeputado);
            }
            catch (error) {
                logger_1.logger.warn(`Tentativa ${tentativas}/${maxRetries} falhou para deputado ${codigoDeputado}: ${error.message}`);
                if (tentativas >= maxRetries) {
                    // Retorna objeto mínimo em vez de lançar erro depois de todas as tentativas
                    return {
                        timestamp: new Date().toISOString(),
                        codigo: codigoDeputado,
                        dadosBasicos: {
                            timestamp: new Date().toISOString(),
                            origem: api.replacePath(endpoints_1.endpoints.DEPUTADOS.PERFIL.PATH, { codigo: codigoDeputado.toString() }),
                            dados: null,
                            metadados: {},
                            erro: error.message
                        },
                        erro: `Falha após ${maxRetries} tentativas: ${error.message}`
                    };
                }
                // Espera antes de tentar novamente (tempo crescente entre tentativas)
                const tempoEspera = 2000 * tentativas;
                logger_1.logger.info(`Aguardando ${tempoEspera / 1000} segundos antes de tentar novamente para o deputado ${codigoDeputado}...`);
                await new Promise(resolve => setTimeout(resolve, tempoEspera));
            }
        }
        // Isso nunca deve ser alcançado por causa da condicional acima,
        // mas o TypeScript precisa de um retorno explícito
        throw new Error(`Não foi possível extrair o perfil do deputado ${codigoDeputado} após ${maxRetries} tentativas`);
    }
}
exports.PerfilDeputadosExtractor = PerfilDeputadosExtractor;
//# sourceMappingURL=perfildeputados.js.map