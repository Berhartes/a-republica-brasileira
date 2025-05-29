"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legislaturaExtractor = exports.LegislaturaExtractor = void 0;
const tslib_1 = require("tslib");
/**
 * Extrator para Legislatura
 */
const logging_1 = require("../utils/logging");
const api = tslib_1.__importStar(require("../utils/api"));
const endpoints_1 = require("../utils/api/endpoints");
/**
 * Classe para extração de dados de legislatura
 */
class LegislaturaExtractor {
    /**
     * Obtém a legislatura atual com base na data fornecida
     * @param data - Data no formato YYYYMMDD, se omitida usa a data atual
     */
    async obterLegislaturaAtual(data) {
        // Se não foi fornecida data, usa a data atual no formato YYYYMMDD
        if (!data) {
            const hoje = new Date();
            data = hoje.getFullYear().toString() +
                (hoje.getMonth() + 1).toString().padStart(2, '0') +
                hoje.getDate().toString().padStart(2, '0');
        }
        logging_1.logger.info(`Extraindo dados da legislatura para a data ${data}`);
        try {
            // Substituir {data} no endpoint
            const endpoint = api.replacePath(endpoints_1.endpoints.LEGISLATURA.POR_DATA.PATH, { data });
            // Fazer a requisição
            const response = await api.get(endpoint, endpoints_1.endpoints.LEGISLATURA.POR_DATA.PARAMS);
            // Extrair a legislatura da resposta
            const legislaturas = response?.ListaLegislatura?.Legislaturas?.Legislatura;
            if (!legislaturas || (Array.isArray(legislaturas) && legislaturas.length === 0)) {
                throw new Error('Nenhuma legislatura encontrada para a data informada');
            }
            // Se for um array, pega a primeira (mas normalmente é só uma)
            const legislatura = Array.isArray(legislaturas) ? legislaturas[0] : legislaturas;
            // Converte o número da legislatura para número
            const numeroLegislatura = parseInt(legislatura.NumeroLegislatura, 10);
            logging_1.logger.info(`Legislatura atual: ${numeroLegislatura} (${legislatura.DataInicio} a ${legislatura.DataFim})`);
            return {
                timestamp: new Date().toISOString(),
                legislaturaAtual: numeroLegislatura,
                legislatura: legislatura
            };
        }
        catch (error) {
            logging_1.logger.error('Erro ao extrair dados da legislatura atual', error);
            throw error;
        }
    }
}
exports.LegislaturaExtractor = LegislaturaExtractor;
// Exporta uma instância do extrator
exports.legislaturaExtractor = new LegislaturaExtractor();
// Exemplo de uso:
if (require.main === module) {
    // Se executado diretamente (não importado como módulo)
    (async () => {
        try {
            logging_1.logger.info('Iniciando extração da legislatura atual');
            const resultado = await exports.legislaturaExtractor.obterLegislaturaAtual();
            logging_1.logger.info(`Extração concluída: Legislatura ${resultado.legislaturaAtual}`);
            console.log(`Detalhes da legislatura: ${JSON.stringify(resultado.legislatura, null, 2)}`);
        }
        catch (error) {
            logging_1.logger.error('Erro ao executar o script', error);
            process.exit(1);
        }
    })();
}
//# sourceMappingURL=legislatura.js.map