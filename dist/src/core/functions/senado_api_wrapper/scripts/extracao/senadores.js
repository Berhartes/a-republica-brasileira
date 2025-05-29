"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.senadoresExtractor = exports.SenadoresExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Extrator para Senadores em Exercício
 */
const logger_1 = require("../utils/logging/logger");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../utils/api/endpoints");
const error_handler_1 = require("../utils/logging/error-handler");
/**
 * Classe para extração de dados de senadores em exercício
 */
class SenadoresExtractor {
    /**
     * Extrai a lista de senadores em exercício
     */
    async extractSenadoresAtuais() {
        logger_1.logger.info('Extraindo lista de senadores em exercício');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.SENADORES.LISTA_ATUAL.PATH, endpoints_1.endpoints.SENADORES.LISTA_ATUAL.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração lista de senadores atuais');
            // Verificar se a resposta tem o formato esperado
            if (!response || !response.ListaParlamentarEmExercicio || !response.ListaParlamentarEmExercicio.Parlamentares) {
                logger_1.logger.warn('Formato de resposta inválido para lista de senadores atuais');
                return {
                    timestamp: new Date().toISOString(),
                    origem: endpoints_1.endpoints.SENADORES.LISTA_ATUAL,
                    senadores: [],
                    metadados: {}
                };
            }
            // Extrair a lista de parlamentares
            const parlamentares = response.ListaParlamentarEmExercicio.Parlamentares.Parlamentar || [];
            // Garantir que temos um array de parlamentares
            const senadores = Array.isArray(parlamentares) ? parlamentares : [parlamentares];
            logger_1.logger.info(`Extraídos ${senadores.length} senadores em exercício`);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoints_1.endpoints.SENADORES.LISTA_ATUAL,
                senadores: senadores,
                metadados: response.ListaParlamentarEmExercicio.Metadados || {}
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao extrair lista de senadores em exercício', error);
            return {
                timestamp: new Date().toISOString(),
                origem: endpoints_1.endpoints.SENADORES.LISTA_ATUAL,
                senadores: [],
                metadados: {},
                erro: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    /**
     * Extrai detalhes de um senador específico
     */
    async extractDetalhesParlamentar(codigo) {
        logger_1.logger.info(`Extraindo detalhes do parlamentar ${codigo}`);
        try {
            // Substituir o parâmetro {codigo} no caminho
            const endpoint = api.replacePath(endpoints_1.endpoints.SENADORES.PERFIL.PATH, { codigo });
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoint, endpoints_1.endpoints.SENADORES.PERFIL.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, `Extração detalhes do parlamentar ${codigo}`);
            // Extrair os detalhes do parlamentar
            const detalhes = response?.DetalheParlamentar?.Parlamentar || {};
            return {
                timestamp: new Date().toISOString(),
                codigo: codigo,
                detalhes: detalhes
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair detalhes do parlamentar ${codigo}`, error);
            throw error;
        }
    }
}
exports.SenadoresExtractor = SenadoresExtractor;
// Exporta uma instância do extrator
exports.senadoresExtractor = new SenadoresExtractor();
// Exemplo de uso:
if (require.main === module) {
    // Se executado diretamente (não importado como módulo)
    (async () => {
        try {
            logger_1.logger.info('Iniciando extração de senadores em exercício');
            const resultado = await exports.senadoresExtractor.extractSenadoresAtuais();
            logger_1.logger.info(`Extração concluída: ${resultado.senadores.length} senadores extraídos`);
            if (resultado.senadores.length > 0) {
                console.log(`Primeiro senador: ${resultado.senadores[0].IdentificacaoParlamentar.NomeParlamentar}`);
                // Extrair detalhes do primeiro senador como exemplo
                const codigoParlamentar = resultado.senadores[0].IdentificacaoParlamentar.CodigoParlamentar;
                logger_1.logger.info(`Extraindo detalhes do senador ${codigoParlamentar}`);
                const detalhes = await exports.senadoresExtractor.extractDetalhesParlamentar(codigoParlamentar);
                logger_1.logger.info(`Detalhes do senador ${codigoParlamentar} extraídos com sucesso`);
            }
        }
        catch (error) {
            logger_1.logger.error('Erro ao executar o script', error);
            process.exit(1);
        }
    })();
}
//# sourceMappingURL=senadores.js.map