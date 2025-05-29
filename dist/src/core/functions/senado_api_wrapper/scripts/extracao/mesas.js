"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesaExtractor = exports.MesaExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Extrator para Mesas Diretoras
 */
const logging_1 = require("../utils/logging");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../utils/api/endpoints");
const error_handler_1 = require("../utils/logging/error-handler");
/**
 * Classe para extração de dados de mesas diretoras
 */
class MesaExtractor {
    /**
     * Extrai informações da Mesa do Senado Federal
     */
    async extractMesaSenado() {
        logging_1.logger.info('Extraindo informações da Mesa do Senado Federal');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMPOSICAO.MESAS.SENADO.PATH, endpoints_1.endpoints.COMPOSICAO.MESAS.SENADO.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração da Mesa do Senado');
            logging_1.logger.info('Extração da Mesa do Senado concluída com sucesso');
            // Preserva a estrutura completa do JSON para processamento posterior
            return {
                timestamp: new Date().toISOString(),
                tipo: 'senado',
                dados: response // Mantém o objeto response completo
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao extrair Mesa do Senado: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Extrai informações da Mesa do Congresso Nacional
     */
    async extractMesaCongresso() {
        logging_1.logger.info('Extraindo informações da Mesa do Congresso Nacional');
        try {
            // Fazer a requisição usando o utilitário de API
            const response = await (0, error_handler_1.withRetry)(async () => api.get(endpoints_1.endpoints.COMPOSICAO.MESAS.CONGRESSO.PATH, endpoints_1.endpoints.COMPOSICAO.MESAS.CONGRESSO.PARAMS), endpoints_1.endpoints.REQUEST.RETRY_ATTEMPTS, endpoints_1.endpoints.REQUEST.RETRY_DELAY, 'Extração da Mesa do Congresso');
            logging_1.logger.info('Extração da Mesa do Congresso concluída com sucesso');
            // Preserva a estrutura completa do JSON para processamento posterior
            return {
                timestamp: new Date().toISOString(),
                tipo: 'congresso',
                dados: response // Mantém o objeto response completo
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao extrair Mesa do Congresso: ${error.message}`, error);
            throw error;
        }
    }
    /**
     * Extrai informações de todas as mesas diretoras
     */
    async extractAll() {
        logging_1.logger.info('Iniciando extração de todas as mesas diretoras');
        try {
            // Executar as extrações em paralelo para maior eficiência
            const [mesaSenado, mesaCongresso] = await Promise.all([
                this.extractMesaSenado(),
                this.extractMesaCongresso()
            ]);
            logging_1.logger.info('Extração de todas as mesas diretoras concluída com sucesso');
            return {
                timestamp: new Date().toISOString(),
                mesas: {
                    senado: mesaSenado,
                    congresso: mesaCongresso
                }
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro na extração das mesas diretoras: ${error.message}`, error);
            throw error;
        }
    }
}
exports.MesaExtractor = MesaExtractor;
// Exporta uma instância do extrator
exports.mesaExtractor = new MesaExtractor();
// Exemplo de uso:
if (require.main === module) {
    // Se executado diretamente (não importado como módulo)
    (async () => {
        try {
            logging_1.logger.info('Iniciando extração de mesas diretoras');
            const resultado = await exports.mesaExtractor.extractAll();
            logging_1.logger.info('Extração concluída com sucesso');
            logging_1.logger.info(`Mesa do Senado extraída em: ${resultado.mesas.senado.timestamp}`);
            logging_1.logger.info(`Mesa do Congresso extraída em: ${resultado.mesas.congresso.timestamp}`);
        }
        catch (error) {
            logging_1.logger.error('Erro ao executar o script', error);
            process.exit(1);
        }
    })();
}
//# sourceMappingURL=mesas.js.map