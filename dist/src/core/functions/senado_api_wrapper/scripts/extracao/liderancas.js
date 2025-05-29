"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liderancaExtractor = exports.LiderancaExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Extrator para Lideranças do Senado Federal
 */
const logger_1 = require("../utils/logging/logger");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../utils/api/endpoints");
const error_handler_1 = require("../utils/logging/error-handler");
/**
 * Classe para extração de dados de lideranças
 */
class LiderancaExtractor {
    /**
     * Extrai informações de lideranças atuais
     */
    async extractLiderancas() {
        logger_1.logger.info('Extraindo informações de lideranças atuais');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMPOSICAO.LIDERANCAS.LISTA.PATH, endpoints_1.endpoints.COMPOSICAO.LIDERANCAS.LISTA.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração de lideranças');
            logger_1.logger.info('Extração de lideranças concluída com sucesso');
            // Preserva a estrutura completa do JSON para processamento posterior
            return {
                timestamp: new Date().toISOString(),
                liderancas: response
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair lideranças: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Extrai tipos de unidade de liderança
     */
    async extractTiposUnidade() {
        logger_1.logger.info('Extraindo tipos de unidade de liderança');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMPOSICAO.LIDERANCAS.TIPOS_UNIDADE.PATH, endpoints_1.endpoints.COMPOSICAO.LIDERANCAS.TIPOS_UNIDADE.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração de tipos de unidade');
            logger_1.logger.info('Extração de tipos de unidade concluída com sucesso');
            return {
                timestamp: new Date().toISOString(),
                tiposUnidade: response
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair tipos de unidade: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Extrai tipos de liderança
     */
    async extractTiposLideranca() {
        logger_1.logger.info('Extraindo tipos de liderança');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMPOSICAO.LIDERANCAS.TIPOS_LIDERANCA.PATH, endpoints_1.endpoints.COMPOSICAO.LIDERANCAS.TIPOS_LIDERANCA.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração de tipos de liderança');
            logger_1.logger.info('Extração de tipos de liderança concluída com sucesso');
            return {
                timestamp: new Date().toISOString(),
                tiposLideranca: response
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair tipos de liderança: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Extrai tipos de cargo
     */
    async extractTiposCargo() {
        logger_1.logger.info('Extraindo tipos de cargo');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMPOSICAO.LIDERANCAS.TIPOS_CARGO.PATH, endpoints_1.endpoints.COMPOSICAO.LIDERANCAS.TIPOS_CARGO.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração de tipos de cargo');
            logger_1.logger.info('Extração de tipos de cargo concluída com sucesso');
            return {
                timestamp: new Date().toISOString(),
                tiposCargo: response
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair tipos de cargo: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Extrai todas as informações relacionadas a lideranças
     */
    async extractAll() {
        logger_1.logger.info('Iniciando extração de dados de lideranças');
        try {
            // Extrair todos os dados em paralelo para eficiência
            const [liderancasData, tiposUnidadeData, tiposLiderancaData, tiposCargoData] = await Promise.all([
                this.extractLiderancas(),
                this.extractTiposUnidade(),
                this.extractTiposLideranca(),
                this.extractTiposCargo()
            ]);
            logger_1.logger.info('Extração de dados de lideranças concluída com sucesso');
            return {
                timestamp: new Date().toISOString(),
                liderancas: liderancasData.liderancas,
                referencias: {
                    tiposUnidade: tiposUnidadeData.tiposUnidade,
                    tiposLideranca: tiposLiderancaData.tiposLideranca,
                    tiposCargo: tiposCargoData.tiposCargo
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro na extração completa de lideranças: ${error.message}`, error);
            throw error;
        }
    }
}
exports.LiderancaExtractor = LiderancaExtractor;
// Exporta uma instância do extrator
exports.liderancaExtractor = new LiderancaExtractor();
// Exemplo de uso:
if (require.main === module) {
    // Se executado diretamente (não importado como módulo)
    (async () => {
        try {
            logger_1.logger.info('Iniciando extração de lideranças');
            const resultado = await exports.liderancaExtractor.extractAll();
            logger_1.logger.info('Extração concluída com sucesso');
            console.log('Tipos de liderança obtidos:', resultado.referencias.tiposLideranca ? 'Sim' : 'Não');
            console.log('Tipos de unidade obtidos:', resultado.referencias.tiposUnidade ? 'Sim' : 'Não');
            console.log('Tipos de cargo obtidos:', resultado.referencias.tiposCargo ? 'Sim' : 'Não');
        }
        catch (error) {
            logger_1.logger.error('Erro ao executar o script', error);
            process.exit(1);
        }
    })();
}
//# sourceMappingURL=liderancas.js.map