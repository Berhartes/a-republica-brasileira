"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materiasExtractor = exports.MateriasExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Módulo para extração de dados de matérias legislativas (autorias e relatorias) de senadores
 *
 * Este módulo implementa funções para extrair dados de matérias legislativas
 * da API do Senado Federal, incluindo autorias e relatorias.
 */
const logger_1 = require("../utils/logging/logger");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../utils/api/endpoints");
const error_handler_1 = require("../utils/logging/error-handler");
/**
 * Classe para extração de dados de matérias legislativas
 */
class MateriasExtractor {
    /**
     * Extrai matérias legislativas de um senador
     * @param codigoSenador - Código do senador na API
     * @returns Matérias legislativas do senador
     */
    async extractMaterias(codigoSenador) {
        try {
            logger_1.logger.info(`Extraindo matérias legislativas do senador código ${codigoSenador}`);
            // 1. Extrair dados básicos
            const dadosBasicos = await this.extractDadosBasicos(codigoSenador);
            // Verificar se os dados básicos foram obtidos com sucesso
            if (!dadosBasicos || !dadosBasicos.dados) {
                logger_1.logger.warn(`Dados básicos não obtidos para o senador ${codigoSenador}, abortando extração de matérias`);
                return {
                    timestamp: new Date().toISOString(),
                    codigo: codigoSenador,
                    dadosBasicos: dadosBasicos,
                    erro: "Dados básicos não obtidos, extração incompleta"
                };
            }
            // 2. Extrair autorias e relatorias (paralelização)
            const [autorias, relatorias] = await Promise.allSettled([
                this.extractAutorias(codigoSenador),
                this.extractRelatorias(codigoSenador)
            ]);
            // 3. Consolidar todos os dados
            const materiaCompleta = {
                timestamp: new Date().toISOString(),
                codigo: codigoSenador,
                dadosBasicos: dadosBasicos,
                autorias: autorias.status === 'fulfilled' ? autorias.value : {
                    timestamp: new Date().toISOString(),
                    origem: `Processo?codigoParlamentarAutor=${codigoSenador}`,
                    dados: null,
                    erro: autorias.status === 'rejected' ? autorias.reason?.message : 'Informação não disponível'
                },
                relatorias: relatorias.status === 'fulfilled' ? relatorias.value : {
                    timestamp: new Date().toISOString(),
                    origem: `Processo/relatoria?codigoParlamentar=${codigoSenador}`,
                    dados: null,
                    erro: relatorias.status === 'rejected' ? relatorias.reason?.message : 'Informação não disponível'
                }
            };
            return materiaCompleta;
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair matérias do senador ${codigoSenador}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                codigo: codigoSenador,
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
            logger_1.logger.info(`Extraindo dados básicos do senador código ${codigoSenador}`);
            const endpointConfig = endpoints_1.endpoints.SENADORES.PERFIL;
            const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpointConfig.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração dados básicos do senador ${codigoSenador}`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoint,
                dados: response,
                metadados: {}
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair dados básicos do senador ${codigoSenador}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: api.replacePath(endpoints_1.endpoints.SENADORES.PERFIL.PATH, { codigo: codigoSenador.toString() }),
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai autorias de um senador
     * @param codigoSenador - Código do senador na API
     * @param dataInicio - Data de início no formato YYYY-MM-DD (opcional)
     * @param dataFim - Data de fim no formato YYYY-MM-DD (opcional)
     * @returns Autorias do senador
     */
    async extractAutorias(codigoSenador, dataInicio, dataFim) {
        try {
            if (dataInicio && dataFim) {
                logger_1.logger.info(`Extraindo autorias do senador código ${codigoSenador} no período de ${dataInicio} a ${dataFim}`);
            }
            else {
                logger_1.logger.info(`Extraindo autorias do senador código ${codigoSenador} (sem período específico)`);
            }
            // Construir parâmetros da requisição
            const params = { ...endpoints_1.endpoints.PROCESSO.AUTORIAS.PARAMS };
            // Adicionar parâmetros de data se fornecidos
            if (dataInicio) {
                params.dataInicioApresentacao = dataInicio;
            }
            if (dataFim) {
                params.dataFimApresentacao = dataFim;
            }
            // Adicionar código do parlamentar - este é o parâmetro chave que filtra as autorias por senador
            params.codigoParlamentarAutor = codigoSenador.toString();
            logger_1.logger.info(`Fazendo requisição para ${endpoints_1.endpoints.PROCESSO.AUTORIAS.PATH} com parâmetros: ${JSON.stringify(params)}`);
            // Fazer a requisição
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.PROCESSO.AUTORIAS.PATH, params), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração autorias do senador ${codigoSenador}`);
            // Log para depuração da estrutura de dados retornada
            if (response) {
                logger_1.logger.info(`Resposta recebida da API. Estrutura de dados: ${JSON.stringify(Object.keys(response), null, 2)}`);
            }
            return {
                timestamp: new Date().toISOString(),
                origem: `${endpoints_1.endpoints.PROCESSO.AUTORIAS.PATH}?codigoParlamentarAutor=${codigoSenador}${dataInicio ? `&dataInicioApresentacao=${dataInicio}` : ''}${dataFim ? `&dataFimApresentacao=${dataFim}` : ''}`,
                dados: response,
                metadados: {
                    senadorCodigo: codigoSenador.toString()
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair autorias do senador ${codigoSenador}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: `${endpoints_1.endpoints.PROCESSO.AUTORIAS.PATH}?codigoParlamentarAutor=${codigoSenador}${dataInicio ? `&dataInicioApresentacao=${dataInicio}` : ''}${dataFim ? `&dataFimApresentacao=${dataFim}` : ''}`,
                dados: null,
                metadados: {
                    senadorCodigo: codigoSenador.toString()
                },
                erro: error.message
            };
        }
    }
    /**
     * Extrai relatorias de um senador
     * @param codigoSenador - Código do senador na API
     * @param dataInicio - Data de início no formato YYYY-MM-DD (opcional)
     * @param dataFim - Data de fim no formato YYYY-MM-DD (opcional)
     * @returns Relatorias do senador
     */
    async extractRelatorias(codigoSenador, dataInicio, dataFim) {
        try {
            if (dataInicio && dataFim) {
                logger_1.logger.info(`Extraindo relatorias do senador código ${codigoSenador} no período de ${dataInicio} a ${dataFim}`);
            }
            else {
                logger_1.logger.info(`Extraindo relatorias do senador código ${codigoSenador} (sem período específico)`);
            }
            // Construir parâmetros da requisição
            const params = { ...endpoints_1.endpoints.PROCESSO.RELATORIAS.PARAMS };
            // Adicionar parâmetros de data se fornecidos
            if (dataInicio) {
                params.dataInicio = dataInicio;
            }
            if (dataFim) {
                params.dataFim = dataFim;
            }
            // Adicionar código do parlamentar
            params.codigoParlamentar = codigoSenador.toString();
            // Fazer a requisição
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.PROCESSO.RELATORIAS.PATH, params), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração relatorias do senador ${codigoSenador}`);
            return {
                timestamp: new Date().toISOString(),
                origem: `${endpoints_1.endpoints.PROCESSO.RELATORIAS.PATH}?codigoParlamentar=${codigoSenador}${dataInicio ? `&dataInicio=${dataInicio}` : ''}${dataFim ? `&dataFim=${dataFim}` : ''}`,
                dados: response,
                metadados: {}
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair relatorias do senador ${codigoSenador}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                origem: `${endpoints_1.endpoints.PROCESSO.RELATORIAS.PATH}?codigoParlamentar=${codigoSenador}${dataInicio ? `&dataInicio=${dataInicio}` : ''}${dataFim ? `&dataFim=${dataFim}` : ''}`,
                dados: null,
                metadados: {},
                erro: error.message
            };
        }
    }
    /**
     * Extrai autorias de um senador por período de mandato
     * @param codigoSenador - Código do senador na API
     * @param dataInicioMandato - Data de início do mandato (formato YYYY-MM-DD)
     * @param dataFimMandato - Data de fim do mandato (formato YYYY-MM-DD)
     * @returns Autorias do senador durante o período de mandato
     */
    async extractAutoriasPorPeriodoMandato(codigoSenador, dataInicioMandato, dataFimMandato) {
        try {
            logger_1.logger.info(`Extraindo autorias do senador ${codigoSenador} durante o mandato (${dataInicioMandato} a ${dataFimMandato})`);
            // Converter datas para objetos Date
            const dataInicio = new Date(dataInicioMandato);
            // Se a data de fim for futura, usar a data atual
            const hoje = new Date();
            const dataFim = new Date(dataFimMandato);
            const dataFimEfetiva = dataFim > hoje ? hoje : dataFim;
            // Dividir o período em intervalos de 360 dias
            const intervalos = this.gerarIntervalos360Dias(dataInicio, dataFimEfetiva);
            logger_1.logger.info(`Período dividido em ${intervalos.length} intervalos de 360 dias para autorias`);
            // Extrair autorias para cada intervalo
            const resultados = [];
            for (const [index, intervalo] of intervalos.entries()) {
                logger_1.logger.info(`Processando intervalo de autorias ${index + 1}/${intervalos.length}: ${intervalo.inicio.toISOString().slice(0, 10)} a ${intervalo.fim.toISOString().slice(0, 10)}`);
                // Formatar datas para o formato esperado pela API (YYYY-MM-DD)
                const dataInicioFormatada = this.formatarDataParaAPI(intervalo.inicio);
                const dataFimFormatada = this.formatarDataParaAPI(intervalo.fim);
                // Extrair autorias do intervalo
                const resultado = await this.extractAutorias(codigoSenador, dataInicioFormatada, dataFimFormatada);
                // Adicionar ao resultado apenas se houver dados
                if (resultado && resultado.dados) {
                    resultados.push(resultado);
                }
                // Pausa entre requisições para não sobrecarregar a API
                if (index < intervalos.length - 1) {
                    logger_1.logger.debug(`Aguardando 1 segundo antes da próxima requisição de autorias...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            logger_1.logger.info(`Extração de autorias por período concluída: ${resultados.length} intervalos com dados`);
            return resultados;
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair autorias por período do senador ${codigoSenador}: ${error.message}`);
            throw error;
        }
    }
    /**
     * Extrai relatorias de um senador por período de mandato
     * @param codigoSenador - Código do senador na API
     * @param dataInicioMandato - Data de início do mandato (formato YYYY-MM-DD)
     * @param dataFimMandato - Data de fim do mandato (formato YYYY-MM-DD)
     * @returns Relatorias do senador durante o período de mandato
     */
    async extractRelatoriasPorPeriodoMandato(codigoSenador, dataInicioMandato, dataFimMandato) {
        try {
            logger_1.logger.info(`Extraindo relatorias do senador ${codigoSenador} durante o mandato (${dataInicioMandato} a ${dataFimMandato})`);
            // Converter datas para objetos Date
            const dataInicio = new Date(dataInicioMandato);
            // Se a data de fim for futura, usar a data atual
            const hoje = new Date();
            const dataFim = new Date(dataFimMandato);
            const dataFimEfetiva = dataFim > hoje ? hoje : dataFim;
            // Dividir o período em intervalos de 360 dias
            const intervalos = this.gerarIntervalos360Dias(dataInicio, dataFimEfetiva);
            logger_1.logger.info(`Período dividido em ${intervalos.length} intervalos de 360 dias para relatorias`);
            // Extrair relatorias para cada intervalo
            const resultados = [];
            for (const [index, intervalo] of intervalos.entries()) {
                logger_1.logger.info(`Processando intervalo de relatorias ${index + 1}/${intervalos.length}: ${intervalo.inicio.toISOString().slice(0, 10)} a ${intervalo.fim.toISOString().slice(0, 10)}`);
                // Formatar datas para o formato esperado pela API (YYYY-MM-DD)
                const dataInicioFormatada = this.formatarDataParaAPI(intervalo.inicio);
                const dataFimFormatada = this.formatarDataParaAPI(intervalo.fim);
                // Extrair relatorias do intervalo
                const resultado = await this.extractRelatorias(codigoSenador, dataInicioFormatada, dataFimFormatada);
                // Adicionar ao resultado apenas se houver dados
                if (resultado && resultado.dados) {
                    resultados.push(resultado);
                }
                // Pausa entre requisições para não sobrecarregar a API
                if (index < intervalos.length - 1) {
                    logger_1.logger.debug(`Aguardando 1 segundo antes da próxima requisição de relatorias...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            logger_1.logger.info(`Extração de relatorias por período concluída: ${resultados.length} intervalos com dados`);
            return resultados;
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair relatorias por período do senador ${codigoSenador}: ${error.message}`);
            throw error;
        }
    }
    /**
     * Consolida resultados de autorias de múltiplos períodos
     * @param resultados - Array de resultados de autorias
     * @returns Dados consolidados
     */
    consolidarResultadosAutorias(resultados) {
        try {
            logger_1.logger.info(`Consolidando ${resultados.length} resultados de autorias`);
            // Verificar se há resultados para consolidar
            if (!resultados || resultados.length === 0) {
                logger_1.logger.warn('Nenhum resultado de autorias para consolidar');
                return null;
            }
            // Extrair todas as autorias de todos os períodos
            const todasAutorias = [];
            for (const resultado of resultados) {
                if (!resultado || !resultado.dados)
                    continue;
                // Log para depuração
                logger_1.logger.debug(`Estrutura de dados do resultado: ${JSON.stringify(Object.keys(resultado.dados), null, 2)}`);
                // Verificar diferentes caminhos possíveis para os processos
                let processos = null;
                // Caminho 1: ProcessosResultset.Processos.Processo
                if (resultado.dados.ProcessosResultset?.Processos?.Processo) {
                    processos = resultado.dados.ProcessosResultset.Processos.Processo;
                    logger_1.logger.info('Processos encontrados no caminho ProcessosResultset.Processos.Processo');
                }
                // Caminho 2: Processos.Processo
                else if (resultado.dados.Processos?.Processo) {
                    processos = resultado.dados.Processos.Processo;
                    logger_1.logger.info('Processos encontrados no caminho Processos.Processo');
                }
                // Caminho 3: processos
                else if (resultado.dados.processos) {
                    processos = resultado.dados.processos;
                    logger_1.logger.info('Processos encontrados no caminho processos');
                }
                // Caminho 4: processo
                else if (resultado.dados.processo) {
                    processos = resultado.dados.processo;
                    logger_1.logger.info('Processos encontrados no caminho processo');
                }
                // Caminho 5: Array direto (como no arquivo processo.json)
                else if (Array.isArray(resultado.dados)) {
                    processos = resultado.dados;
                    logger_1.logger.info('Processos encontrados como array direto');
                }
                // Caminho 6: Objeto com array
                else if (typeof resultado.dados === 'object' && resultado.dados !== null) {
                    // Verificar se o objeto tem alguma propriedade que é um array
                    for (const key in resultado.dados) {
                        if (Array.isArray(resultado.dados[key])) {
                            processos = resultado.dados[key];
                            logger_1.logger.info(`Processos encontrados na propriedade ${key}`);
                            break;
                        }
                    }
                }
                if (!processos) {
                    logger_1.logger.warn('Nenhum processo encontrado nos dados. Estrutura completa:', resultado.dados);
                    continue;
                }
                // Garantir que processos seja um array
                const processosArray = Array.isArray(processos) ? processos : [processos];
                logger_1.logger.info(`Adicionando ${processosArray.length} processos ao consolidado`);
                todasAutorias.push(...processosArray);
            }
            logger_1.logger.info(`Consolidação concluída: ${todasAutorias.length} autorias encontradas`);
            // Retornar objeto consolidado
            return {
                processos: todasAutorias
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao consolidar resultados de autorias: ${error.message}`);
            return null;
        }
    }
    /**
     * Consolida resultados de relatorias de múltiplos períodos
     * @param resultados - Array de resultados de relatorias
     * @returns Dados consolidados
     */
    consolidarResultadosRelatorias(resultados) {
        try {
            logger_1.logger.info(`Consolidando ${resultados.length} resultados de relatorias`);
            // Verificar se há resultados para consolidar
            if (!resultados || resultados.length === 0) {
                logger_1.logger.warn('Nenhum resultado de relatorias para consolidar');
                return null;
            }
            // Extrair todas as relatorias de todos os períodos
            const todasRelatorias = [];
            for (const resultado of resultados) {
                if (!resultado || !resultado.dados)
                    continue;
                // Log para depuração da estrutura completa
                logger_1.logger.info(`Estrutura de dados do resultado de relatorias: ${JSON.stringify(Object.keys(resultado.dados), null, 2)}`);
                // Verificar diferentes caminhos possíveis para as relatorias
                let relatorias = null;
                // Caminho 1: Array direto (como no arquivo relatoria.json)
                if (Array.isArray(resultado.dados)) {
                    relatorias = resultado.dados;
                    logger_1.logger.info('Relatorias encontradas como array direto');
                }
                // Caminho 2: RelatoriasResultset.Relatorias.Relatoria
                else if (resultado.dados.RelatoriasResultset?.Relatorias?.Relatoria) {
                    relatorias = resultado.dados.RelatoriasResultset.Relatorias.Relatoria;
                    logger_1.logger.info('Relatorias encontradas no caminho RelatoriasResultset.Relatorias.Relatoria');
                }
                // Caminho 3: Relatorias.Relatoria
                else if (resultado.dados.Relatorias?.Relatoria) {
                    relatorias = resultado.dados.Relatorias.Relatoria;
                    logger_1.logger.info('Relatorias encontradas no caminho Relatorias.Relatoria');
                }
                // Caminho 4: relatorias
                else if (resultado.dados.relatorias) {
                    relatorias = resultado.dados.relatorias;
                    logger_1.logger.info('Relatorias encontradas no caminho relatorias');
                }
                // Caminho 5: relatoria
                else if (resultado.dados.relatoria) {
                    relatorias = resultado.dados.relatoria;
                    logger_1.logger.info('Relatorias encontradas no caminho relatoria');
                }
                // Caminho 6: Objeto com array
                else if (typeof resultado.dados === 'object' && resultado.dados !== null) {
                    // Verificar se o objeto tem alguma propriedade que é um array
                    for (const key in resultado.dados) {
                        if (Array.isArray(resultado.dados[key])) {
                            relatorias = resultado.dados[key];
                            logger_1.logger.info(`Relatorias encontradas na propriedade ${key}`);
                            break;
                        }
                    }
                }
                if (!relatorias) {
                    logger_1.logger.warn('Nenhuma relatoria encontrada nos dados. Estrutura completa:', JSON.stringify(resultado.dados, null, 2));
                    continue;
                }
                // Garantir que relatorias seja um array
                const relatoriasArray = Array.isArray(relatorias) ? relatorias : [relatorias];
                logger_1.logger.info(`Adicionando ${relatoriasArray.length} relatorias ao consolidado`);
                todasRelatorias.push(...relatoriasArray);
            }
            logger_1.logger.info(`Consolidação concluída: ${todasRelatorias.length} relatorias encontradas`);
            // Retornar objeto consolidado
            return {
                relatorias: todasRelatorias
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao consolidar resultados de relatorias: ${error.message}`);
            return null;
        }
    }
    /**
     * Gera intervalos de 360 dias entre duas datas
     * @param dataInicio - Data de início
     * @param dataFim - Data de fim
     * @returns Array de intervalos de 360 dias
     */
    gerarIntervalos360Dias(dataInicio, dataFim) {
        const intervalos = [];
        let dataAtual = new Date(dataInicio);
        while (dataAtual < dataFim) {
            // Calcular data de fim do intervalo (dataAtual + 360 dias)
            const dataFimIntervalo = new Date(dataAtual);
            dataFimIntervalo.setDate(dataFimIntervalo.getDate() + 360);
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
     * Formata uma data para o formato esperado pela API (YYYY-MM-DD)
     * @param data - Data a ser formatada
     * @returns Data formatada como string YYYY-MM-DD
     */
    formatarDataParaAPI(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }
}
exports.MateriasExtractor = MateriasExtractor;
// Instância singleton para uso em toda a aplicação
exports.materiasExtractor = new MateriasExtractor();
//# sourceMappingURL=materias.js.map