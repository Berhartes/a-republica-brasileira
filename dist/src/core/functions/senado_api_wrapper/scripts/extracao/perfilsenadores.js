"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfilSenadoresExtractor = exports.PerfilSenadoresExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Extrator especializado para perfis de senadores da API do Senado Federal
 * Este módulo trata especificamente da extração de perfis completos,
 * complementando o extrator básico de senadores
 */
const logging_1 = require("../utils/logging");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../utils/api/endpoints");
const error_handler_1 = require("../utils/logging/error-handler");
/**
 * Classe para extração de perfis completos de senadores
 */
class PerfilSenadoresExtractor {
    /**
     * Extrai a lista de senadores de uma legislatura específica
     * @param legislatura - Número da legislatura
     * @returns Dados dos senadores da legislatura
     */
    async extractSenadoresLegislatura(legislatura) {
        try {
            logging_1.logger.info(`Extraindo lista de senadores da legislatura ${legislatura}`);
            // Obter a lista de senadores da legislatura específica
            const endpointConfig = endpoints_1.endpoints.SENADORES.LISTA_LEGISLATURA;
            const endpoint = api.replacePath(endpointConfig.PATH, { legislatura: legislatura.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração lista de senadores da legislatura ${legislatura}`);
            // Verificação cuidadosa da estrutura de resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia para lista de senadores da legislatura ${legislatura}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    senadores: [],
                    metadados: {}
                };
            }
            // Extrai a lista de parlamentares, lidando com diferentes estruturas possíveis
            let parlamentares = [];
            // Verificar cada nível da estrutura com segurança
            if (response.ListaParlamentarLegislatura &&
                response.ListaParlamentarLegislatura.Parlamentares) {
                parlamentares = response.ListaParlamentarLegislatura.Parlamentares.Parlamentar || [];
            }
            // Garantir que seja um array
            parlamentares = Array.isArray(parlamentares) ? parlamentares : [parlamentares];
            // Filtrar itens nulos ou indefinidos
            parlamentares = parlamentares.filter(p => p);
            logging_1.logger.info(`Encontrados ${parlamentares.length} senadores na legislatura ${legislatura}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                senadores: parlamentares,
                metadados: response.ListaParlamentarLegislatura?.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.LISTA_LEGISLATURA.PATH, { legislatura: legislatura.toString() });
            logging_1.logger.error(`Erro ao extrair lista de senadores da legislatura ${legislatura}: ${error.message}`);
            // Retornar objeto vazio em vez de lançar erro
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                senadores: [],
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai perfil completo de um senador específico
     * @param codigoSenador - Código do senador na API
     * @returns Perfil completo do senador
     */
    async extractPerfilCompleto(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo perfil completo do senador código ${codigoSenador}`);
            // 1. Extrair dados básicos
            const dadosBasicos = await this.extractDadosBasicos(codigoSenador);
            // Verificar se os dados básicos foram obtidos com sucesso
            if (!dadosBasicos || !dadosBasicos.dados) {
                logging_1.logger.warn(`Dados básicos não obtidos para o senador ${codigoSenador}, abortando perfil completo`);
                return {
                    timestamp: new Date().toISOString(),
                    codigo: codigoSenador,
                    dadosBasicos: dadosBasicos,
                    erro: "Dados básicos não obtidos, perfil incompleto"
                };
            }
            // 2. Extrair dados complementares (paralelização)
            const [mandatos, cargos, comissoes, filiacoes, historicoAcademico, licencas, profissao, liderancas // Adicionado lideranças
            ] = await Promise.allSettled([
                this.extractMandatos(codigoSenador),
                this.extractCargos(codigoSenador),
                this.extractComissoes(codigoSenador),
                this.extractFiliacoes(codigoSenador),
                this.extractHistoricoAcademico(codigoSenador),
                this.extractLicencas(codigoSenador),
                this.extractProfissao(codigoSenador),
                this.extractLiderancas(codigoSenador) // Adicionado método para extrair lideranças
            ]);
            // 3. Consolidar todos os dados
            const perfilCompleto = {
                timestamp: new Date().toISOString(),
                codigo: codigoSenador,
                dadosBasicos: dadosBasicos,
                mandatos: mandatos.status === 'fulfilled' ? mandatos.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.MANDATOS.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: mandatos.status === 'rejected' ? mandatos.reason?.message : 'Informação não disponível'
                },
                cargos: cargos.status === 'fulfilled' ? cargos.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.CARGOS.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: cargos.status === 'rejected' ? cargos.reason?.message : 'Informação não disponível'
                },
                comissoes: comissoes.status === 'fulfilled' ? comissoes.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.COMISSOES.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: comissoes.status === 'rejected' ? comissoes.reason?.message : 'Informação não disponível'
                },
                filiacoes: filiacoes.status === 'fulfilled' ? filiacoes.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.FILIACOES.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: filiacoes.status === 'rejected' ? filiacoes.reason?.message : 'Informação não disponível'
                },
                historicoAcademico: historicoAcademico.status === 'fulfilled' ? historicoAcademico.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.HISTORICO_ACADEMICO.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: historicoAcademico.status === 'rejected' ? historicoAcademico.reason?.message : 'Informação não disponível'
                },
                licencas: licencas.status === 'fulfilled' ? licencas.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.LICENCAS.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: licencas.status === 'rejected' ? licencas.reason?.message : 'Informação não disponível'
                },
                profissao: profissao.status === 'fulfilled' ? profissao.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.PROFISSAO.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: profissao.status === 'rejected' ? profissao.reason?.message : 'Informação não disponível'
                },
                liderancas: liderancas.status === 'fulfilled' ? liderancas.value : {
                    timestamp: new Date().toISOString(),
                    origem: endpoints_1.endpoints.SENADORES.LIDERANCAS.PATH,
                    dados: null,
                    erro: liderancas.status === 'rejected' ? liderancas.reason?.message : 'Informação não disponível'
                }
            };
            logging_1.logger.info(`Perfil completo do senador ${codigoSenador} extraído com sucesso`);
            return perfilCompleto;
        }
        catch (error) {
            logging_1.logger.error(`Erro ao extrair perfil completo do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai dados básicos de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Dados básicos do senador
     */
    async extractDadosBasicos(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo dados básicos do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.PERFIL;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração dados básicos do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Verificar se a resposta tem a estrutura esperada
            if (!response.DetalheParlamentar) {
                logging_1.logger.warn(`Estrutura de dados inválida para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de dados inválida"
                };
            }
            // Verificar e logar a estrutura de telefones
            if (response.DetalheParlamentar.Parlamentar) {
                const parlamentar = response.DetalheParlamentar.Parlamentar;
                // Verificar telefones diretamente no parlamentar
                if (parlamentar.Telefones) {
                    logging_1.logger.debug(`Telefones encontrados diretamente no parlamentar: ${JSON.stringify(parlamentar.Telefones)}`);
                    // Adicionar log detalhado para depuração
                    if (parlamentar.Telefones.Telefone) {
                        const telefones = Array.isArray(parlamentar.Telefones.Telefone)
                            ? parlamentar.Telefones.Telefone
                            : [parlamentar.Telefones.Telefone];
                        telefones.forEach((tel, index) => {
                            logging_1.logger.debug(`Telefone ${index + 1}: ${JSON.stringify(tel)}`);
                        });
                    }
                }
                // Verificar telefones na identificação do parlamentar
                if (parlamentar.IdentificacaoParlamentar && parlamentar.IdentificacaoParlamentar.Telefones) {
                    logging_1.logger.debug(`Telefones encontrados na identificação do parlamentar: ${JSON.stringify(parlamentar.IdentificacaoParlamentar.Telefones)}`);
                    // Adicionar log detalhado para depuração
                    if (parlamentar.IdentificacaoParlamentar.Telefones.Telefone) {
                        const telefones = Array.isArray(parlamentar.IdentificacaoParlamentar.Telefones.Telefone)
                            ? parlamentar.IdentificacaoParlamentar.Telefones.Telefone
                            : [parlamentar.IdentificacaoParlamentar.Telefones.Telefone];
                        telefones.forEach((tel, index) => {
                            logging_1.logger.debug(`Telefone na identificação ${index + 1}: ${JSON.stringify(tel)}`);
                        });
                    }
                }
                // Verificar gênero do parlamentar
                if (parlamentar.IdentificacaoParlamentar && parlamentar.IdentificacaoParlamentar.SexoParlamentar) {
                    logging_1.logger.debug(`Gênero do senador ${codigoSenador}: ${parlamentar.IdentificacaoParlamentar.SexoParlamentar}`);
                }
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.DetalheParlamentar,
                metadados: response.DetalheParlamentar.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.PERFIL.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair dados básicos do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai mandatos de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Mandatos do senador
     */
    async extractMandatos(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo mandatos do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.MANDATOS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração mandatos do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar mandatos do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Verificar estrutura da resposta
            if (!response.MandatoParlamentar) {
                logging_1.logger.warn(`Estrutura de mandatos não encontrada para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de mandatos não encontrada"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.MandatoParlamentar,
                metadados: response.MandatoParlamentar.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.MANDATOS.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair mandatos do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai cargos de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Cargos do senador
     */
    async extractCargos(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo cargos do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.CARGOS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração cargos do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar cargos do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Verificar estrutura da resposta
            if (!response.CargoParlamentar) {
                logging_1.logger.warn(`Estrutura de cargos não encontrada para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de cargos não encontrada"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.CargoParlamentar,
                metadados: response.CargoParlamentar.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.CARGOS.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair cargos do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai comissões de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Comissões do senador
     */
    async extractComissoes(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo comissões do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.COMISSOES;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração comissões do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar comissões do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Verificar estrutura da resposta
            if (!response.MembroComissaoParlamentar) {
                logging_1.logger.warn(`Estrutura de comissões não encontrada para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de comissões não encontrada"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.MembroComissaoParlamentar,
                metadados: response.MembroComissaoParlamentar.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.COMISSOES.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair comissões do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai filiações partidárias de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Filiações do senador
     */
    async extractFiliacoes(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo filiações do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.FILIACOES;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração filiações do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar filiações do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Verificar estrutura da resposta
            if (!response.FiliacaoParlamentar) {
                logging_1.logger.warn(`Estrutura de filiações não encontrada para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de filiações não encontrada"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.FiliacaoParlamentar,
                metadados: response.FiliacaoParlamentar.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.FILIACOES.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair filiações do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai histórico acadêmico de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Histórico acadêmico do senador
     */
    async extractHistoricoAcademico(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo histórico acadêmico do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.HISTORICO_ACADEMICO;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração histórico acadêmico do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar histórico acadêmico do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Verificar estrutura da resposta
            if (!response.HistoricoAcademicoParlamentar) {
                logging_1.logger.warn(`Estrutura de histórico acadêmico não encontrada para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de histórico acadêmico não encontrada"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.HistoricoAcademicoParlamentar,
                metadados: response.HistoricoAcademicoParlamentar.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.HISTORICO_ACADEMICO.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair histórico acadêmico do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai licenças de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Licenças do senador
     */
    async extractLicencas(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo licenças do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.LICENCAS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração licenças do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar licenças do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Verificar estrutura da resposta
            if (!response.LicencaParlamentar) {
                logging_1.logger.warn(`Estrutura de licenças não encontrada para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de licenças não encontrada"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response.LicencaParlamentar,
                metadados: response.LicencaParlamentar.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.LICENCAS.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair licenças do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai profissão de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Profissão do senador
     */
    async extractProfissao(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo profissão do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.PROFISSAO;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração profissão do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar profissão do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // A API pode retornar a estrutura errada (na documentação é ProfissaoParlamentar mas pode vir como HistoricoAcademicoParlamentar)
            // Então temos que lidar com os dois casos
            const dadosProfissao = response.ProfissaoParlamentar || response.HistoricoAcademicoParlamentar;
            // Verificar estrutura da resposta
            if (!dadosProfissao) {
                logging_1.logger.warn(`Estrutura de profissão não encontrada para o senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de profissão não encontrada"
                };
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: dadosProfissao,
                metadados: dadosProfissao.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.PROFISSAO.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair profissão do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai apartes de um senador
     * @param codigoSenador - Código do senador na API
     * @param dataInicio - Data de início no formato YYYYMMDD (opcional)
     * @param dataFim - Data de fim no formato YYYYMMDD (opcional)
     * @returns Apartes do senador
     */
    async extractApartes(codigoSenador, dataInicio, dataFim) {
        try {
            if (dataInicio && dataFim) {
                logging_1.logger.info(`Extraindo apartes do senador código ${codigoSenador} no período de ${dataInicio} a ${dataFim}`);
            }
            else {
                logging_1.logger.info(`Extraindo apartes do senador código ${codigoSenador} (sem período específico)`);
            }
            const endpointConfig = endpoints_1.endpoints.SENADORES.APARTES;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            // Adicionar parâmetros de data se fornecidos
            const params = { ...endpointConfig.PARAMS };
            if (dataInicio)
                params.dataInicio = dataInicio;
            if (dataFim)
                params.dataFim = dataFim;
            // Construir a URL completa para verificação
            const urlCompleta = `${endpoints_1.endpoints.BASE_URL}${endpoint}?${Object.entries(params)
                .map(([key, value]) => `${key}=${value}`)
                .join('&')}`;
            logging_1.logger.debug(`URL completa para apartes: ${urlCompleta}`);
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, params), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração apartes do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar apartes do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Log detalhado para debug
            logging_1.logger.debug(`Estrutura da resposta de apartes: ${JSON.stringify(Object.keys(response))}`);
            // Verificar estrutura da resposta
            if (!response.ApartesParlamentar) {
                logging_1.logger.warn(`Estrutura de apartes não encontrada para o senador ${codigoSenador}`);
                logging_1.logger.debug(`Conteúdo da resposta: ${JSON.stringify(response).substring(0, 500)}...`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoint,
                    dados: null,
                    metadados: {},
                    erro: "Estrutura de apartes não encontrada"
                };
            }
            // Verificar se há apartes na resposta
            if (response.ApartesParlamentar.Parlamentar &&
                response.ApartesParlamentar.Parlamentar.Apartes) {
                const apartes = response.ApartesParlamentar.Parlamentar.Apartes.Aparte;
                if (apartes) {
                    const numApartes = Array.isArray(apartes) ? apartes.length : 1;
                    logging_1.logger.info(`Encontrados ${numApartes} apartes para o senador ${codigoSenador}`);
                }
                else {
                    logging_1.logger.info(`Nenhum aparte encontrado para o senador ${codigoSenador}`);
                    logging_1.logger.debug(`Estrutura de Apartes: ${JSON.stringify(response.ApartesParlamentar.Parlamentar.Apartes)}`);
                }
            }
            else {
                logging_1.logger.info(`Estrutura de Apartes não encontrada para o senador ${codigoSenador}`);
                if (response.ApartesParlamentar.Parlamentar) {
                    logging_1.logger.debug(`Chaves em Parlamentar: ${JSON.stringify(Object.keys(response.ApartesParlamentar.Parlamentar))}`);
                }
            }
            // Log detalhado da resposta para debug
            logging_1.logger.debug(`Estrutura da resposta de apartes: ${JSON.stringify(Object.keys(response))}`);
            // Verificar se a resposta contém o campo ApartesParlamentar
            if (response.ApartesParlamentar) {
                logging_1.logger.debug(`Estrutura de ApartesParlamentar: ${JSON.stringify(Object.keys(response.ApartesParlamentar))}`);
                // Verificar se a resposta contém o campo Parlamentar
                if (response.ApartesParlamentar.Parlamentar) {
                    logging_1.logger.debug(`Estrutura de Parlamentar: ${JSON.stringify(Object.keys(response.ApartesParlamentar.Parlamentar))}`);
                    // Verificar se a resposta contém o campo Apartes
                    if (response.ApartesParlamentar.Parlamentar.Apartes) {
                        logging_1.logger.debug(`Estrutura de Apartes: ${JSON.stringify(Object.keys(response.ApartesParlamentar.Parlamentar.Apartes))}`);
                        // Verificar se a resposta contém o campo Aparte
                        if (response.ApartesParlamentar.Parlamentar.Apartes.Aparte) {
                            const apartes = response.ApartesParlamentar.Parlamentar.Apartes.Aparte;
                            logging_1.logger.debug(`Apartes encontrados: ${Array.isArray(apartes) ? apartes.length : 1}`);
                            // Se for um único aparte, verificar a estrutura
                            if (!Array.isArray(apartes)) {
                                logging_1.logger.debug(`Estrutura do aparte: ${JSON.stringify(Object.keys(apartes))}`);
                                // Verificar se o aparte contém o campo TextoResumo
                                if (apartes.TextoResumo) {
                                    logging_1.logger.debug(`TextoResumo encontrado: ${apartes.TextoResumo}`);
                                }
                                else {
                                    logging_1.logger.debug(`TextoResumo não encontrado no aparte`);
                                    // Listar todos os campos do aparte para debug
                                    Object.keys(apartes).forEach(key => {
                                        logging_1.logger.debug(`Campo ${key}: ${typeof apartes[key] === 'string' ? apartes[key] : JSON.stringify(apartes[key])}`);
                                    });
                                }
                            }
                            else if (apartes.length > 0) {
                                // Se for um array, verificar a estrutura do primeiro aparte
                                logging_1.logger.debug(`Estrutura do primeiro aparte: ${JSON.stringify(Object.keys(apartes[0]))}`);
                                // Verificar se o primeiro aparte contém o campo TextoResumo
                                if (apartes[0].TextoResumo) {
                                    logging_1.logger.debug(`TextoResumo encontrado no primeiro aparte: ${apartes[0].TextoResumo}`);
                                }
                                else {
                                    logging_1.logger.debug(`TextoResumo não encontrado no primeiro aparte`);
                                    // Listar todos os campos do primeiro aparte para debug
                                    Object.keys(apartes[0]).forEach(key => {
                                        logging_1.logger.debug(`Campo ${key}: ${typeof apartes[0][key] === 'string' ? apartes[0][key] : JSON.stringify(apartes[0][key])}`);
                                    });
                                }
                            }
                        }
                        else {
                            logging_1.logger.debug(`Aparte não encontrado na resposta`);
                        }
                    }
                    else {
                        logging_1.logger.debug(`Apartes não encontrado na resposta`);
                    }
                }
                else {
                    logging_1.logger.debug(`Parlamentar não encontrado na resposta`);
                }
            }
            else {
                logging_1.logger.debug(`ApartesParlamentar não encontrado na resposta`);
            }
            // Retornar a resposta completa para processamento posterior
            // Importante: Manter a estrutura esperada pelo consolidarApartesPorPeriodo
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response, // Retornar a resposta completa sem modificações
                metadados: response.ApartesParlamentar?.Metadados || {}
            };
        }
        catch (error) {
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.APARTES.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair apartes do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai apartes de um senador por período de mandato
     * @param codigoSenador - Código do senador na API
     * @param dataInicioMandato - Data de início do mandato (formato YYYY-MM-DD)
     * @param dataFimMandato - Data de fim do mandato (formato YYYY-MM-DD)
     * @param concurrency - Número de requisições concorrentes (padrão: 3)
     * @returns Apartes do senador durante o período de mandato
     */
    async extractApartesPorPeriodoMandato(codigoSenador, dataInicioMandato, dataFimMandato, concurrency = 3) {
        try {
            logging_1.logger.info(`Extraindo apartes do senador ${codigoSenador} durante o mandato (${dataInicioMandato} a ${dataFimMandato}) com concorrência ${concurrency}`);
            // Converter datas para objetos Date
            const dataInicio = new Date(dataInicioMandato);
            // Se a data de fim for futura, usar a data atual
            const hoje = new Date();
            const dataFim = new Date(dataFimMandato);
            const dataFimEfetiva = dataFim > hoje ? hoje : dataFim;
            // Dividir o período em intervalos de 30 dias
            const intervalos = this.gerarIntervalos30Dias(dataInicio, dataFimEfetiva);
            logging_1.logger.info(`Período dividido em ${intervalos.length} intervalos de 30 dias para apartes`);
            // Extrair apartes para cada intervalo com concorrência limitada
            const resultados = [];
            // Dividir intervalos em chunks para processar com concorrência limitada
            const chunks = [];
            for (let i = 0; i < intervalos.length; i += concurrency) {
                chunks.push(intervalos.slice(i, i + concurrency));
            }
            // Processar cada chunk de intervalos em paralelo
            for (const [chunkIndex, chunk] of chunks.entries()) {
                logging_1.logger.info(`Processando chunk de apartes ${chunkIndex + 1}/${chunks.length} (${chunk.length} intervalos)`);
                // Processar intervalos do chunk atual em paralelo
                const chunkResultados = await Promise.all(chunk.map(async (intervalo, idx) => {
                    const intervaloIndex = chunkIndex * concurrency + idx;
                    logging_1.logger.info(`Processando intervalo de apartes ${intervaloIndex + 1}/${intervalos.length}: ${intervalo.inicio.toISOString().slice(0, 10)} a ${intervalo.fim.toISOString().slice(0, 10)}`);
                    // Formatar datas para o formato esperado pela API (YYYYMMDD)
                    const dataInicioFormatada = this.formatarDataParaAPI(intervalo.inicio);
                    const dataFimFormatada = this.formatarDataParaAPI(intervalo.fim);
                    try {
                        // Extrair apartes do intervalo
                        const resultado = await this.extractApartes(codigoSenador, dataInicioFormatada, dataFimFormatada);
                        // Retornar resultado apenas se houver dados
                        if (resultado && resultado.dados) {
                            return resultado;
                        }
                        return null;
                    }
                    catch (error) {
                        logging_1.logger.error(`Erro ao extrair apartes do intervalo ${intervaloIndex + 1}: ${error.message}`);
                        return null;
                    }
                }));
                // Adicionar resultados válidos do chunk ao array de resultados
                resultados.push(...chunkResultados.filter(Boolean));
                // Pausa entre chunks para não sobrecarregar a API
                if (chunkIndex < chunks.length - 1) {
                    logging_1.logger.info(`Aguardando 2 segundos antes de processar o próximo chunk de intervalos de apartes...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            logging_1.logger.info(`Extração de apartes por período concluída: ${resultados.length} intervalos com dados`);
            return resultados;
        }
        catch (error) {
            logging_1.logger.error(`Erro ao extrair apartes por período do senador ${codigoSenador}: ${error.message}`);
            throw error;
        }
    }
    /**
     * Extrai lideranças de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Lideranças do senador
     */
    async extractLiderancas(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo lideranças do senador código ${codigoSenador}`);
            // Usar o endpoint de composição/lideranca com filtro por parlamentar
            const endpointConfig = endpoints_1.endpoints.SENADORES.LIDERANCAS;
            // Não precisamos substituir o path, mas adicionamos o parâmetro codigoParlamentar
            const params = {
                ...endpointConfig.PARAMS,
                codigoParlamentar: codigoSenador.toString()
            };
            // Adicionar log para verificar a URL e os parâmetros
            logging_1.logger.debug(`URL para lideranças: ${endpointConfig.PATH}`);
            logging_1.logger.debug(`Parâmetros para lideranças: ${JSON.stringify(params)}`);
            // Construir a URL completa para verificação
            const urlCompleta = `${endpoints_1.endpoints.BASE_URL}${endpointConfig.PATH}?${Object.entries(params)
                .map(([key, value]) => `${key}=${value}`)
                .join('&')}`;
            logging_1.logger.debug(`URL completa para lideranças: ${urlCompleta}`);
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpointConfig.PATH, params), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração lideranças do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar lideranças do senador ${codigoSenador}`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpointConfig.PATH,
                    dados: null,
                    metadados: {},
                    erro: "Resposta vazia da API"
                };
            }
            // Adicionar log para verificar a estrutura completa da resposta
            logging_1.logger.debug(`Estrutura completa da resposta de lideranças: ${JSON.stringify(Object.keys(response))}`);
            // Verificar diferentes estruturas possíveis na resposta
            let dadosLiderancas = null;
            if (response.LiderancaParlamentar) {
                logging_1.logger.debug(`Estrutura encontrada: LiderancaParlamentar`);
                dadosLiderancas = response.LiderancaParlamentar;
            }
            else if (response.ListaLiderancas) {
                logging_1.logger.debug(`Estrutura encontrada: ListaLiderancas`);
                dadosLiderancas = response.ListaLiderancas;
            }
            else if (response.liderancas) {
                logging_1.logger.debug(`Estrutura encontrada: liderancas`);
                dadosLiderancas = response.liderancas;
            }
            else if (Array.isArray(response)) {
                // Se a resposta for diretamente um array de lideranças
                logging_1.logger.debug(`Estrutura encontrada: Array de lideranças`);
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpointConfig.PATH,
                    dados: { liderancas: response }, // Encapsular o array em um objeto para padronização
                    metadados: {}
                };
            }
            else {
                // Tentar encontrar a chave que contém os dados de lideranças
                const possiveisChaves = Object.keys(response);
                for (const chave of possiveisChaves) {
                    if (typeof response[chave] === 'object' && response[chave] !== null) {
                        logging_1.logger.debug(`Verificando chave: ${chave}`);
                        if (response[chave].Lideranca || response[chave].lideranca ||
                            (Array.isArray(response[chave]) && response[chave].length > 0)) {
                            logging_1.logger.debug(`Estrutura de lideranças encontrada em: ${chave}`);
                            dadosLiderancas = response[chave];
                            break;
                        }
                    }
                }
            }
            // Se não encontrou estrutura específica, mas a resposta parece ser os dados de liderança
            if (!dadosLiderancas && Object.keys(response).length > 0) {
                logging_1.logger.debug(`Usando a resposta completa como dados de lideranças`);
                dadosLiderancas = response;
            }
            // Adicionar log para verificar a estrutura dos dados de lideranças
            if (dadosLiderancas) {
                logging_1.logger.debug(`Estrutura de lideranças para o senador ${codigoSenador}: ${JSON.stringify(Object.keys(dadosLiderancas))}`);
            }
            return {
                timestamp: new Date().toISOString(),
                origem: endpointConfig.PATH,
                dados: dadosLiderancas || response, // Usar dados estruturados se encontrados, ou a resposta completa
                metadados: dadosLiderancas?.Metadados || {}
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao extrair lideranças do senador ${codigoSenador}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoints_1.endpoints.SENADORES.LIDERANCAS.PATH,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai perfil completo de múltiplos senadores
     * @param senadores - Lista de códigos de senadores
     * @param concurrency - Número de requisições simultâneas
     * @param maxRetries - Número máximo de retentativas por senador
     * @returns Perfis completos extraídos
     */
    async extractMultiplosPerfis(senadores, concurrency = 3, maxRetries = 3) {
        logging_1.logger.info(`Extraindo perfis completos de ${senadores.length} senadores (concorrência: ${concurrency})`);
        const resultados = [];
        const totalSenadores = senadores.length;
        // Processar em lotes para controlar a concorrência
        for (let i = 0; i < totalSenadores; i += concurrency) {
            const lote = senadores.slice(i, i + concurrency);
            // Adicionar um atraso maior entre lotes para evitar sobrecarga na API
            if (i > 0) {
                logging_1.logger.info(`Aguardando 3 segundos antes de processar o próximo lote de senadores...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            // Extrair perfis do lote em paralelo
            const promessas = lote.map(codigo => {
                // Adiciona retentativas para cada senador
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
                        logging_1.logger.warn(`Falha ao extrair perfil: ${resultado.reason}`);
                    }
                });
                logging_1.logger.info(`Progresso: ${Math.min(i + concurrency, totalSenadores)}/${totalSenadores} senadores`);
            }
            catch (error) {
                logging_1.logger.error(`Erro ao processar lote de senadores: ${error.message}`);
                // Continua o processamento mesmo com erro
            }
        }
        logging_1.logger.info(`Extração concluída: ${resultados.length}/${totalSenadores} perfis extraídos com sucesso`);
        return resultados;
    }
    /**
     * Extrai perfil completo de um senador com retentativas
     * @param codigoSenador - Código do senador
     * @param maxRetries - Número máximo de retentativas
     * @returns Perfil completo
     */
    async extractPerfilCompletoComRetry(codigoSenador, maxRetries = 3) {
        let tentativas = 0;
        while (tentativas < maxRetries) {
            try {
                tentativas++;
                return await this.extractPerfilCompleto(codigoSenador);
            }
            catch (error) {
                logging_1.logger.warn(`Tentativa ${tentativas}/${maxRetries} falhou para senador ${codigoSenador}: ${error.message}`);
                if (tentativas >= maxRetries) {
                    // Retorna objeto mínimo em vez de lançar erro depois de todas as tentativas
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
                        erro: `Falha após ${maxRetries} tentativas: ${error.message}`
                    };
                }
                // Espera antes de tentar novamente (tempo crescente entre tentativas)
                const tempoEspera = 2000 * tentativas;
                logging_1.logger.info(`Aguardando ${tempoEspera / 1000} segundos antes de tentar novamente para o senador ${codigoSenador}...`);
                await new Promise(resolve => setTimeout(resolve, tempoEspera));
            }
        }
        // Isso nunca deve ser alcançado por causa da condicional acima,
        // mas o TypeScript precisa de um retorno explícito
        throw new Error(`Não foi possível extrair o perfil do senador ${codigoSenador} após ${maxRetries} tentativas`);
    }
    /**
     * Extrai discursos e apartes de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Discursos e apartes do senador
     */
    async extractDiscursos(codigoSenador) {
        try {
            logging_1.logger.info(`Extraindo discursos do senador código ${codigoSenador}`);
            // 1. Extrair dados básicos
            const dadosBasicos = await this.extractDadosBasicos(codigoSenador);
            // Verificar se os dados básicos foram obtidos com sucesso
            if (!dadosBasicos || !dadosBasicos.dados) {
                logging_1.logger.warn(`Dados básicos não obtidos para o senador ${codigoSenador}, abortando extração de discursos`);
                return {
                    timestamp: new Date().toISOString(),
                    codigo: codigoSenador,
                    dadosBasicos: dadosBasicos,
                    erro: "Dados básicos não obtidos, extração incompleta"
                };
            }
            // 2. Extrair discursos (sem apartes)
            const discursosPromise = await Promise.allSettled([
                this.extractDiscursosDetalhados(codigoSenador)
            ]);
            const discursos = discursosPromise[0];
            // 3. Consolidar todos os dados
            const discursoCompleto = {
                timestamp: new Date().toISOString(),
                codigo: codigoSenador,
                dadosBasicos: dadosBasicos,
                discursos: discursos.status === 'fulfilled' ? discursos.value : {
                    timestamp: new Date().toISOString(),
                    origem: api.replacePath(endpoints_1.endpoints.SENADORES.DISCURSOS.PATH, { codigo: codigoSenador.toString() }),
                    dados: null,
                    erro: discursos.status === 'rejected' ? discursos.reason?.message : 'Informação não disponível'
                }
            };
            logging_1.logger.info(`Discursos do senador ${codigoSenador} extraídos com sucesso`);
            return discursoCompleto;
        }
        catch (error) {
            logging_1.logger.error(`Erro ao extrair discursos do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai discursos detalhados de um senador
     * @param codigoSenador - Código do senador na API
     * @param dataInicio - Data de início no formato YYYYMMDD (opcional)
     * @param dataFim - Data de fim no formato YYYYMMDD (opcional)
     * @returns Discursos detalhados do senador
     */
    async extractDiscursosDetalhados(codigoSenador, dataInicio, dataFim) {
        try {
            if (dataInicio && dataFim) {
                logging_1.logger.info(`Extraindo discursos detalhados do senador código ${codigoSenador} no período de ${dataInicio} a ${dataFim}`);
            }
            else {
                logging_1.logger.info(`Extraindo discursos detalhados do senador código ${codigoSenador} (sem período específico)`);
            }
            const endpointConfig = endpoints_1.endpoints.SENADORES.DISCURSOS;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            // Adicionar parâmetros de data se fornecidos
            const params = { ...endpointConfig.PARAMS };
            if (dataInicio)
                params.dataInicio = dataInicio;
            if (dataFim)
                params.dataFim = dataFim;
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, params), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração discursos detalhados do senador ${codigoSenador}`);
            // Verificação rigorosa da resposta
            if (!response) {
                logging_1.logger.warn(`Resposta vazia ao buscar discursos detalhados do senador ${codigoSenador}`);
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
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.DISCURSOS.PATH, { codigo: codigoSenador.toString() });
            logging_1.logger.error(`Erro ao extrair discursos detalhados do senador ${codigoSenador}: ${error.message}`);
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
     * Extrai discursos de um senador por período de mandato
     * @param codigoSenador - Código do senador na API
     * @param dataInicioMandato - Data de início do mandato (formato YYYY-MM-DD)
     * @param dataFimMandato - Data de fim do mandato (formato YYYY-MM-DD)
     * @param concurrency - Número de requisições concorrentes (padrão: 3)
     * @returns Discursos do senador durante o período de mandato
     */
    async extractDiscursosPorPeriodoMandato(codigoSenador, dataInicioMandato, dataFimMandato, concurrency = 3) {
        try {
            logging_1.logger.info(`Extraindo discursos do senador ${codigoSenador} durante o mandato (${dataInicioMandato} a ${dataFimMandato}) com concorrência ${concurrency}`);
            // Converter datas para objetos Date
            const dataInicio = new Date(dataInicioMandato);
            // Se a data de fim for futura, usar a data atual
            const hoje = new Date();
            const dataFim = new Date(dataFimMandato);
            const dataFimEfetiva = dataFim > hoje ? hoje : dataFim;
            // Dividir o período em intervalos de 30 dias
            const intervalos = this.gerarIntervalos30Dias(dataInicio, dataFimEfetiva);
            logging_1.logger.info(`Período dividido em ${intervalos.length} intervalos de 30 dias`);
            // Extrair discursos para cada intervalo com concorrência limitada
            const resultados = [];
            // Dividir intervalos em chunks para processar com concorrência limitada
            const chunks = [];
            for (let i = 0; i < intervalos.length; i += concurrency) {
                chunks.push(intervalos.slice(i, i + concurrency));
            }
            // Processar cada chunk de intervalos em paralelo
            for (const [chunkIndex, chunk] of chunks.entries()) {
                logging_1.logger.info(`Processando chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} intervalos)`);
                // Processar intervalos do chunk atual em paralelo
                const chunkResultados = await Promise.all(chunk.map(async (intervalo, idx) => {
                    const intervaloIndex = chunkIndex * concurrency + idx;
                    logging_1.logger.info(`Processando intervalo ${intervaloIndex + 1}/${intervalos.length}: ${intervalo.inicio.toISOString().slice(0, 10)} a ${intervalo.fim.toISOString().slice(0, 10)}`);
                    // Formatar datas para o formato esperado pela API (YYYYMMDD)
                    const dataInicioFormatada = this.formatarDataParaAPI(intervalo.inicio);
                    const dataFimFormatada = this.formatarDataParaAPI(intervalo.fim);
                    try {
                        // Extrair discursos do intervalo
                        const resultado = await this.extractDiscursosDetalhados(codigoSenador, dataInicioFormatada, dataFimFormatada);
                        // Retornar resultado apenas se houver dados
                        if (resultado && resultado.dados) {
                            return resultado;
                        }
                        return null;
                    }
                    catch (error) {
                        logging_1.logger.error(`Erro ao extrair discursos do intervalo ${intervaloIndex + 1}: ${error.message}`);
                        return null;
                    }
                }));
                // Adicionar resultados válidos do chunk ao array de resultados
                resultados.push(...chunkResultados.filter(Boolean));
                // Pausa entre chunks para não sobrecarregar a API
                if (chunkIndex < chunks.length - 1) {
                    logging_1.logger.info(`Aguardando 2 segundos antes de processar o próximo chunk de intervalos...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            logging_1.logger.info(`Extração de discursos por período concluída: ${resultados.length} intervalos com dados`);
            return resultados;
        }
        catch (error) {
            logging_1.logger.error(`Erro ao extrair discursos por período do senador ${codigoSenador}: ${error.message}`);
            throw error;
        }
    }
    /**
     * Gera intervalos de 30 dias entre duas datas
     * @param dataInicio - Data de início
     * @param dataFim - Data de fim
     * @returns Array de intervalos de 30 dias
     */
    gerarIntervalos30Dias(dataInicio, dataFim) {
        const intervalos = [];
        let dataAtual = new Date(dataInicio);
        while (dataAtual < dataFim) {
            // Calcular data de fim do intervalo (dataAtual + 30 dias)
            const dataFimIntervalo = new Date(dataAtual);
            dataFimIntervalo.setDate(dataFimIntervalo.getDate() + 30);
            // Se a data de fim do intervalo for posterior à data de fim total,
            // usar a data de fim total como limite
            const dataFimEfetiva = dataFimIntervalo > dataFim ? dataFim : dataFimIntervalo;
            // Adicionar intervalo à lista
            intervalos.push({
                inicio: new Date(dataAtual),
                fim: new Date(dataFimEfetiva)
            });
            // Avançar para o próximo intervalo
            dataAtual = new Date(dataFimIntervalo);
        }
        return intervalos;
    }
    /**
     * Formata uma data para o formato esperado pela API (YYYYMMDD)
     * @param data - Data a ser formatada
     * @returns Data formatada como string YYYYMMDD
     */
    formatarDataParaAPI(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}${mes}${dia}`;
    }
    /**
     * Extrai múltiplos discursos de senadores
     * @param codigosSenadores - Lista de códigos de senadores
     * @param concurrency - Número de requisições concorrentes (padrão: 3)
     * @param maxRetries - Número máximo de tentativas por senador (padrão: 3)
     * @returns Lista de discursos
     */
    async extractMultiplosDiscursos(codigosSenadores, concurrency = 3, maxRetries = 3) {
        try {
            logging_1.logger.info(`Extraindo discursos de ${codigosSenadores.length} senadores (concorrência: ${concurrency})`);
            // Limitar concorrência para não sobrecarregar a API
            const discursos = [];
            const chunks = [];
            // Dividir em chunks para processar com concorrência limitada
            for (let i = 0; i < codigosSenadores.length; i += concurrency) {
                chunks.push(codigosSenadores.slice(i, i + concurrency));
            }
            // Processar cada chunk
            for (const [index, chunk] of chunks.entries()) {
                // Extrair discursos do chunk atual em paralelo
                const chunkDiscursos = await Promise.all(chunk.map(async (codigo) => {
                    try {
                        // Tentar extrair com retry
                        return await (0, error_handler_1.withRetry)(async () => this.extractDiscursos(codigo), maxRetries, 1000, // 1 segundo entre tentativas
                        `Extração discursos do senador ${codigo}`);
                    }
                    catch (error) {
                        logging_1.logger.error(`Falha ao extrair discursos do senador ${codigo} após ${maxRetries} tentativas: ${error.message}`);
                        // Retornar um objeto de erro em vez de propagar a exceção
                        return {
                            timestamp: new Date().toISOString(),
                            codigo,
                            dadosBasicos: {
                                timestamp: new Date().toISOString(),
                                origem: `Extração discursos do senador ${codigo}`,
                                dados: null,
                                metadados: {},
                                erro: error.message
                            },
                            erro: `Falha após ${maxRetries} tentativas: ${error.message}`
                        };
                    }
                }));
                // Adicionar resultados do chunk à lista completa
                discursos.push(...chunkDiscursos);
                // Mostrar progresso
                logging_1.logger.info(`Progresso: ${Math.min(discursos.length, codigosSenadores.length)}/${codigosSenadores.length} senadores`);
                // Pausa entre chunks para não sobrecarregar a API
                if (index < chunks.length - 1) {
                    logging_1.logger.info(`Aguardando 3 segundos antes de processar o próximo lote de senadores...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            return discursos;
        }
        catch (error) {
            logging_1.logger.error(`Erro ao extrair múltiplos discursos: ${error.message}`);
            throw error;
        }
    }
}
exports.PerfilSenadoresExtractor = PerfilSenadoresExtractor;
// Exporta uma instância do extrator
exports.perfilSenadoresExtractor = new PerfilSenadoresExtractor();
//# sourceMappingURL=perfilsenadores.js.map