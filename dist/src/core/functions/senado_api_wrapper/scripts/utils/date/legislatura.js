"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obterLegislaturaAtual = obterLegislaturaAtual;
exports.obterPeriodoLegislatura = obterPeriodoLegislatura;
exports.obterNumeroLegislaturaAtual = obterNumeroLegislaturaAtual;
const tslib_1 = require("tslib");
/**
 * Utilitário para obter informações sobre a legislatura atual
 */
const api = tslib_1.__importStar(require("../api"));
const api_1 = require("../api");
const logging_1 = require("../logging");
const logging_2 = require("../logging");
const fast_xml_parser_1 = require("fast-xml-parser");
const fs = tslib_1.__importStar(require("fs"));
/**
 * Obtém a legislatura atual baseada na data informada
 * @param data - Data no formato YYYYMMDD. Se não informada, usa a data atual
 */
async function obterLegislaturaAtual(data) {
    // Se não informou a data, usa a data atual no formato YYYYMMDD
    if (!data) {
        const hoje = new Date();
        data = hoje.getFullYear().toString() +
            (hoje.getMonth() + 1).toString().padStart(2, '0') +
            hoje.getDate().toString().padStart(2, '0');
    }
    logging_1.logger.info(`Obtendo legislatura para a data ${data}`);
    try {
        // Substituir o parâmetro {data} no caminho
        const endpoint = api.replacePath(api_1.endpoints.LEGISLATURA.POR_DATA.PATH, { data });
        // Fazer a requisição usando o utilitário de API
        const response = await (0, logging_2.withRetry)(async () => api.get(endpoint, api_1.endpoints.LEGISLATURA.POR_DATA.PARAMS), api_1.endpoints.REQUEST.RETRY_ATTEMPTS, api_1.endpoints.REQUEST.RETRY_DELAY, `Obter legislatura ${data}`);
        // Extrair a legislatura da resposta
        const legislaturas = response?.ListaLegislatura?.Legislaturas?.Legislatura || [];
        if (legislaturas.length > 0) {
            // Pega a primeira legislatura da lista (geralmente é só uma)
            const legislatura = Array.isArray(legislaturas) ? legislaturas[0] : legislaturas;
            logging_1.logger.info(`Legislatura atual: ${legislatura.NumeroLegislatura} (${legislatura.DataInicio} a ${legislatura.DataFim})`);
            return legislatura;
        }
        else {
            logging_1.logger.warn(`Nenhuma legislatura encontrada para a data ${data}`);
            return null;
        }
    }
    catch (error) {
        logging_1.logger.error(`Erro ao obter legislatura para a data ${data}`, error);
        throw error;
    }
}
/**
 * Obtém o período (DataInicio e DataFim) de uma legislatura a partir do arquivo XML.
 * @param numeroLegislatura - O número da legislatura desejada.
 * @returns Um objeto contendo DataInicio e DataFim, ou null se a legislatura não for encontrada.
 */
async function obterPeriodoLegislatura(numeroLegislatura) {
    try {
        const xmlData = fs.readFileSync('src/core/functions/senado_api_wrapper/scripts/ListaLegislatura.xml', 'utf-8');
        const parser = new fast_xml_parser_1.XMLParser({ ignoreAttributes: false });
        const jsonData = parser.parse(xmlData);
        const legislaturas = jsonData?.ListaLegislatura?.Legislaturas?.Legislatura;
        if (legislaturas) {
            const legislaturaEncontrada = legislaturas.find((legislatura) => {
                return parseInt(legislatura.NumeroLegislatura, 10) === numeroLegislatura;
            });
            if (legislaturaEncontrada) {
                return {
                    DataInicio: legislaturaEncontrada.DataInicio,
                    DataFim: legislaturaEncontrada.DataFim,
                };
            }
        }
        logging_1.logger.warn(`Legislatura ${numeroLegislatura} não encontrada no arquivo XML.`);
        return null;
    }
    catch (error) {
        logging_1.logger.error(`Erro ao ler ou analisar o arquivo XML:`, error);
        return null;
    }
}
/**
 * Obtém o número da legislatura atual
 */
async function obterNumeroLegislaturaAtual(data) {
    const legislatura = await obterLegislaturaAtual(data);
    if (legislatura) {
        return parseInt(legislatura.NumeroLegislatura, 10);
    }
    return null;
}
//# sourceMappingURL=legislatura.js.map