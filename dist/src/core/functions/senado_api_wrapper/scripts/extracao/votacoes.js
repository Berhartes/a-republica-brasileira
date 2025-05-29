"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.votacoesExtractor = exports.VotacoesExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Módulo de extração de votações de senadores
 * Este módulo é especializado na extração de dados de votações de senadores
 * da API do Senado Federal.
 */
const logger_1 = require("../utils/logging/logger");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../utils/api/endpoints");
const error_handler_1 = require("../utils/logging/error-handler");
/**
 * Classe para extração de dados de votações de senadores
 */
class VotacoesExtractor {
    /**
     * Extrai dados básicos de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Dados básicos do senador
     */
    async extractDadosBasicos(codigoSenador) {
        try {
            logger_1.logger.info(`Extraindo dados básicos do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.PERFIL;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração dados básicos do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logger_1.logger.warn(`Resposta vazia ao buscar dados básicos do senador ${codigoSenador}`);
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
                dados: response,
                metadados: response.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.PERFIL.PATH, { codigo: codigoSenador.toString() });
            logger_1.logger.error(`Erro ao extrair dados básicos do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai votações de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Votações do senador
     */
    async extractVotacoes(codigoSenador) {
        try {
            logger_1.logger.info(`Extraindo votações do senador código ${codigoSenador}`);
            // 1. Extrair dados básicos
            const dadosBasicos = await this.extractDadosBasicos(codigoSenador);
            // Verificar se os dados básicos foram obtidos com sucesso
            if (!dadosBasicos || !dadosBasicos.dados) {
                logger_1.logger.warn(`Dados básicos não obtidos para o senador ${codigoSenador}, abortando extração de votações`);
                return {
                    timestamp: new Date().toISOString(),
                    codigo: codigoSenador,
                    dadosBasicos: dadosBasicos,
                    erro: "Dados básicos não obtidos, extração incompleta"
                };
            }
            // 2. Extrair votações
            const votacoes = await this.extractVotacoesDetalhadas(codigoSenador);
            // 3. Consolidar todos os dados
            const votacaoCompleta = {
                timestamp: new Date().toISOString(),
                codigo: codigoSenador,
                dadosBasicos: dadosBasicos,
                votacoes: votacoes.status === 'fulfilled' ? votacoes.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.VOTACOES.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: votacoes.status === 'rejected' ? votacoes.reason?.message : 'Informação não disponível'
                }
            };
            logger_1.logger.info(`Votações do senador ${codigoSenador} extraídas com sucesso`);
            return votacaoCompleta;
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair votações do senador ${codigoSenador}: ${error.message}`);
            // Retornar objeto mínimo para não quebrar o fluxo
            return {
                timestamp: new Date().toISOString(),
                codigo: codigoSenador,
                dadosBasicos: {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.PERFIL.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    metadados: {},
                    erro: error.message
                },
                erro: error.message
            };
        }
    }
    /**
     * Extrai votações detalhadas de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Votações detalhadas do senador
     */
    async extractVotacoesDetalhadas(codigoSenador) {
        try {
            logger_1.logger.info(`Extraindo votações detalhadas do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.VOTACOES;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const votacoesPromise = (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração votações detalhadas do senador ${codigoSenador}`).then((response) => {
                // Verificação rigorosa da resposta
                if (!response) {
                    logger_1.logger.warn(`Resposta vazia ao buscar votações detalhadas do senador ${codigoSenador}`);
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
                    dados: response,
                    metadados: response.Metadados || {}
                };
            }).catch((error) => {
                logger_1.logger.error(`Erro ao extrair votações detalhadas do senador ${codigoSenador}: ${error.message}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: error.message
                };
            });
            return Promise.allSettled([votacoesPromise]).then(results => results[0]);
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.VOTACOES.PATH, { codigo: codigoSenador.toString() });
            logger_1.logger.error(`Erro ao extrair votações detalhadas do senador ${codigoSenador}: ${error.message}`);
            return Promise.reject(error);
        }
    }
    /**
     * Extrai múltiplas votações de senadores
     * @param codigosSenadores - Lista de códigos de senadores
     * @param concurrency - Número de requisições concorrentes (padrão: 3)
     * @param maxRetries - Número máximo de tentativas por senador (padrão: 3)
     * @returns Lista de votações
     */
    async extractMultiplasVotacoes(codigosSenadores, concurrency = 3, maxRetries = 3) {
        try {
            logger_1.logger.info(`Extraindo votações de ${codigosSenadores.length} senadores (concorrência: ${concurrency})`);
            // Limitar concorrência para não sobrecarregar a API
            const votacoes = [];
            const chunks = [];
            // Dividir em chunks para processar com concorrência limitada
            for (let i = 0; i < codigosSenadores.length; i += concurrency) {
                chunks.push(codigosSenadores.slice(i, i + concurrency));
            }
            // Processar cada chunk
            for (const [index, chunk] of chunks.entries()) {
                // Extrair votações do chunk atual em paralelo
                const chunkVotacoes = await Promise.all(chunk.map(async (codigo) => {
                    try {
                        // Tentar extrair com retry
                        return await (0, error_handler_1.withRetry)(async () => this.extractVotacoes(codigo), maxRetries, 1000, // 1 segundo entre tentativas
                        `Extração votações do senador ${codigo}`);
                    }
                    catch (error) {
                        logger_1.logger.error(`Falha ao extrair votações do senador ${codigo} após ${maxRetries} tentativas: ${error.message}`);
                        // Retornar um objeto de erro em vez de propagar a exceção
                        return {
                            timestamp: new Date().toISOString(),
                            codigo,
                            dadosBasicos: {
                                timestamp: new Date().toISOString(),
                                origem: `Extração votações do senador ${codigo}`,
                                dados: null,
                                metadados: {},
                                erro: error.message
                            },
                            erro: `Falha após ${maxRetries} tentativas: ${error.message}`
                        };
                    }
                }));
                // Adicionar resultados do chunk à lista completa
                votacoes.push(...chunkVotacoes);
                // Mostrar progresso
                logger_1.logger.info(`Progresso: ${Math.min(votacoes.length, codigosSenadores.length)}/${codigosSenadores.length} senadores`);
                // Pausa entre chunks para não sobrecarregar a API
                if (index < chunks.length - 1) {
                    logger_1.logger.info(`Aguardando 3 segundos antes de processar o próximo lote de senadores...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            return votacoes;
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair múltiplas votações: ${error.message}`);
            throw error;
        }
    }
    /**
     * Extrai lista de senadores de uma legislatura específica
     * @param legislaturaNumero - Número da legislatura
     * @returns Lista de senadores da legislatura
     */
    async extractSenadoresLegislatura(legislaturaNumero) {
        try {
            logger_1.logger.info(`Extraindo lista de senadores da legislatura ${legislaturaNumero}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.LISTA_LEGISLATURA;
            const endpoint = api.replacePath(endpointConfig.PATH, {});
            const params = {
                ...endpointConfig.PARAMS,
                legislatura: legislaturaNumero
            };
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, params), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração lista de senadores da legislatura ${legislaturaNumero}`);
            // Verificação rigorosa da resposta
            if (!response || !response.ListaParlamentarLegislatura || !response.ListaParlamentarLegislatura.Parlamentares) {
                logger_1.logger.warn(`Resposta inválida ao buscar lista de senadores da legislatura ${legislaturaNumero}`);
                return {
                    timestamp: new Date().toISOString(),
                    legislatura: legislaturaNumero,
                    senadores: [],
                    erro: "Resposta inválida da API"
                };
            }
            const parlamentares = response.ListaParlamentarLegislatura.Parlamentares.Parlamentar || [];
            const senadores = Array.isArray(parlamentares) ? parlamentares : [parlamentares];
            logger_1.logger.info(`Encontrados ${senadores.length} senadores na legislatura ${legislaturaNumero}`);
            return {
                timestamp: new Date().toISOString(),
                legislatura: legislaturaNumero,
                senadores
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair lista de senadores da legislatura ${legislaturaNumero}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                legislatura: legislaturaNumero,
                senadores: [],
                erro: error.message
            };
        }
    }
}
exports.VotacoesExtractor = VotacoesExtractor;
// Exporta uma instância do extrator
exports.votacoesExtractor = new VotacoesExtractor();
//# sourceMappingURL=votacoes.js.map