"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liderancaTransformer = exports.LiderancaTransformer = void 0;
/**
 * Transformador para dados de Lideranças do Senado Federal
 */
const logger_1 = require("../utils/logging/logger");
/**
 * Classe para transformação de dados de lideranças
 */
class LiderancaTransformer {
    /**
     * Transforma os dados extraídos das lideranças em formato padronizado
     */
    transformLiderancas(extractionResult) {
        logger_1.logger.info('Transformando dados de lideranças');
        const { liderancas, referencias } = extractionResult;
        const timestamp = new Date().toISOString();
        // Transformar lideranças
        const liderancasTransformadas = this.transformarListaLiderancas(liderancas, timestamp);
        // Transformar referências
        const tiposLiderancaTransformados = this.transformarTiposLideranca(referencias.tiposLideranca, timestamp);
        const tiposUnidadeTransformados = this.transformarTiposUnidade(referencias.tiposUnidade, timestamp);
        const tiposCargoTransformados = this.transformarTiposCargo(referencias.tiposCargo, timestamp);
        logger_1.logger.info(`Transformadas ${liderancasTransformadas.length} lideranças`);
        logger_1.logger.info(`Transformados ${tiposLiderancaTransformados.length} tipos de liderança`);
        logger_1.logger.info(`Transformados ${tiposUnidadeTransformados.length} tipos de unidade`);
        logger_1.logger.info(`Transformados ${tiposCargoTransformados.length} tipos de cargo`);
        return {
            timestamp,
            liderancas: {
                itens: liderancasTransformadas,
                total: liderancasTransformadas.length
            },
            referencias: {
                tiposLideranca: tiposLiderancaTransformados,
                tiposUnidade: tiposUnidadeTransformados,
                tiposCargo: tiposCargoTransformados
            }
        };
    }
    /**
     * Transforma a lista de lideranças
     */
    transformarListaLiderancas(liderancas, timestamp) {
        try {
            // Obter a lista de lideranças da estrutura da API
            const listaLiderancas = this.extrairDadosLiderancas(liderancas);
            if (!listaLiderancas || !Array.isArray(listaLiderancas)) {
                logger_1.logger.warn('Lista de lideranças inválida ou ausente');
                return [];
            }
            // Transformar cada liderança
            return listaLiderancas.map(lideranca => {
                try {
                    // Extrair dados básicos da liderança
                    const codigo = lideranca.Codigo || '';
                    const nome = lideranca.Nome || '';
                    const descricao = lideranca.Descricao || '';
                    // Extrair tipo de liderança
                    const tipoLideranca = lideranca.TipoLideranca || {};
                    // Extrair parlamentar
                    const parlamentar = lideranca.Parlamentar?.IdentificacaoParlamentar || {};
                    // Extrair unidade
                    const unidade = lideranca.Unidade || {};
                    // Criar objeto transformado
                    const liderancaTransformada = {
                        codigo,
                        nome,
                        descricao,
                        tipo: {
                            codigo: tipoLideranca.Codigo || '',
                            descricao: tipoLideranca.Descricao || ''
                        },
                        atualizadoEm: timestamp
                    };
                    // Adicionar parlamentar se existir
                    if (parlamentar.CodigoParlamentar) {
                        liderancaTransformada.parlamentar = {
                            codigo: parlamentar.CodigoParlamentar,
                            nome: parlamentar.NomeParlamentar || '',
                            partido: parlamentar.SiglaPartidoParlamentar || '',
                            uf: parlamentar.UfParlamentar || ''
                        };
                    }
                    // Adicionar unidade se existir
                    if (unidade.Codigo) {
                        liderancaTransformada.unidade = {
                            codigo: unidade.Codigo,
                            descricao: unidade.Descricao || ''
                        };
                    }
                    return liderancaTransformada;
                }
                catch (error) {
                    logger_1.logger.warn(`Erro ao transformar liderança: ${error.message}`);
                    return {
                        codigo: lideranca.Codigo || 'erro',
                        nome: lideranca.Nome || 'Erro de processamento',
                        tipo: {
                            codigo: 'erro',
                            descricao: 'Erro de processamento'
                        },
                        atualizadoEm: timestamp
                    };
                }
            }).filter(l => l.codigo !== ''); // Filtrar itens sem código
        }
        catch (error) {
            logger_1.logger.error(`Erro ao transformar lista de lideranças: ${error.message}`, error);
            return [];
        }
    }
    /**
     * Extrai a lista de lideranças da estrutura da API
     */
    extrairDadosLiderancas(liderancas) {
        try {
            // Considerando diferentes estruturas possíveis da API
            if (liderancas?.ListaLideranca?.Liderancas?.Lideranca) {
                const listaLiderancas = liderancas.ListaLideranca.Liderancas.Lideranca;
                return Array.isArray(listaLiderancas) ? listaLiderancas : [listaLiderancas];
            }
            else if (liderancas?.Liderancas?.Lideranca) {
                const listaLiderancas = liderancas.Liderancas.Lideranca;
                return Array.isArray(listaLiderancas) ? listaLiderancas : [listaLiderancas];
            }
            else if (liderancas?.Lista?.Liderancas) {
                const listaLiderancas = liderancas.Lista.Liderancas;
                return Array.isArray(listaLiderancas) ? listaLiderancas : [listaLiderancas];
            }
            // Tenta encontrar qualquer array no objeto que possa conter as lideranças
            for (const key in liderancas) {
                if (Array.isArray(liderancas[key])) {
                    return liderancas[key];
                }
                if (typeof liderancas[key] === 'object' && liderancas[key] !== null) {
                    for (const subKey in liderancas[key]) {
                        if (Array.isArray(liderancas[key][subKey])) {
                            return liderancas[key][subKey];
                        }
                        if (typeof liderancas[key][subKey] === 'object' && liderancas[key][subKey] !== null) {
                            for (const deepKey in liderancas[key][subKey]) {
                                if (Array.isArray(liderancas[key][subKey][deepKey])) {
                                    return liderancas[key][subKey][deepKey];
                                }
                            }
                        }
                    }
                }
            }
            logger_1.logger.warn('Estrutura de lideranças não reconhecida', { liderancas });
            return [];
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair dados de lideranças: ${error.message}`, error);
            return [];
        }
    }
    /**
     * Transforma os tipos de liderança
     */
    transformarTiposLideranca(tiposLideranca, timestamp) {
        try {
            // Obter a lista de tipos de liderança da estrutura da API
            let listaTipos = [];
            if (tiposLideranca?.ListaTipoLideranca?.TiposLideranca?.TipoLideranca) {
                const tipos = tiposLideranca.ListaTipoLideranca.TiposLideranca.TipoLideranca;
                listaTipos = Array.isArray(tipos) ? tipos : [tipos];
            }
            else if (tiposLideranca?.TiposLideranca?.TipoLideranca) {
                const tipos = tiposLideranca.TiposLideranca.TipoLideranca;
                listaTipos = Array.isArray(tipos) ? tipos : [tipos];
            }
            else {
                // Busca recursiva por uma lista de tipos
                const buscarTipos = (obj) => {
                    if (!obj || typeof obj !== 'object')
                        return [];
                    for (const key in obj) {
                        if (Array.isArray(obj[key])) {
                            return obj[key];
                        }
                        else if (typeof obj[key] === 'object') {
                            const result = buscarTipos(obj[key]);
                            if (result.length > 0)
                                return result;
                        }
                    }
                    return [];
                };
                listaTipos = buscarTipos(tiposLideranca);
            }
            // Transformar cada tipo
            return listaTipos.map(tipo => ({
                codigo: tipo.Codigo || '',
                descricao: tipo.Descricao || '',
                atualizadoEm: timestamp
            })).filter(t => t.codigo !== ''); // Filtrar itens sem código
        }
        catch (error) {
            logger_1.logger.error(`Erro ao transformar tipos de liderança: ${error.message}`, error);
            return [];
        }
    }
    /**
     * Transforma os tipos de unidade
     */
    transformarTiposUnidade(tiposUnidade, timestamp) {
        try {
            // Obter a lista de tipos de unidade da estrutura da API
            let listaTipos = [];
            if (tiposUnidade?.ListaTipoUnidade?.TiposUnidade?.TipoUnidade) {
                const tipos = tiposUnidade.ListaTipoUnidade.TiposUnidade.TipoUnidade;
                listaTipos = Array.isArray(tipos) ? tipos : [tipos];
            }
            else if (tiposUnidade?.TiposUnidade?.TipoUnidade) {
                const tipos = tiposUnidade.TiposUnidade.TipoUnidade;
                listaTipos = Array.isArray(tipos) ? tipos : [tipos];
            }
            else {
                // Busca recursiva por uma lista de tipos
                const buscarTipos = (obj) => {
                    if (!obj || typeof obj !== 'object')
                        return [];
                    for (const key in obj) {
                        if (Array.isArray(obj[key])) {
                            return obj[key];
                        }
                        else if (typeof obj[key] === 'object') {
                            const result = buscarTipos(obj[key]);
                            if (result.length > 0)
                                return result;
                        }
                    }
                    return [];
                };
                listaTipos = buscarTipos(tiposUnidade);
            }
            // Transformar cada tipo
            return listaTipos.map(tipo => ({
                codigo: tipo.Codigo || '',
                descricao: tipo.Descricao || '',
                atualizadoEm: timestamp
            })).filter(t => t.codigo !== ''); // Filtrar itens sem código
        }
        catch (error) {
            logger_1.logger.error(`Erro ao transformar tipos de unidade: ${error.message}`, error);
            return [];
        }
    }
    /**
     * Transforma os tipos de cargo
     */
    transformarTiposCargo(tiposCargo, timestamp) {
        try {
            // Obter a lista de tipos de cargo da estrutura da API
            let listaTipos = [];
            if (tiposCargo?.ListaTipoCargo?.TiposCargo?.TipoCargo) {
                const tipos = tiposCargo.ListaTipoCargo.TiposCargo.TipoCargo;
                listaTipos = Array.isArray(tipos) ? tipos : [tipos];
            }
            else if (tiposCargo?.TiposCargo?.TipoCargo) {
                const tipos = tiposCargo.TiposCargo.TipoCargo;
                listaTipos = Array.isArray(tipos) ? tipos : [tipos];
            }
            else {
                // Busca recursiva por uma lista de tipos
                const buscarTipos = (obj) => {
                    if (!obj || typeof obj !== 'object')
                        return [];
                    for (const key in obj) {
                        if (Array.isArray(obj[key])) {
                            return obj[key];
                        }
                        else if (typeof obj[key] === 'object') {
                            const result = buscarTipos(obj[key]);
                            if (result.length > 0)
                                return result;
                        }
                    }
                    return [];
                };
                listaTipos = buscarTipos(tiposCargo);
            }
            // Transformar cada tipo
            return listaTipos.map(tipo => ({
                codigo: tipo.Codigo || '',
                descricao: tipo.Descricao || '',
                atualizadoEm: timestamp
            })).filter(t => t.codigo !== ''); // Filtrar itens sem código
        }
        catch (error) {
            logger_1.logger.error(`Erro ao transformar tipos de cargo: ${error.message}`, error);
            return [];
        }
    }
}
exports.LiderancaTransformer = LiderancaTransformer;
// Exporta uma instância do transformador
exports.liderancaTransformer = new LiderancaTransformer();
//# sourceMappingURL=liderancas.js.map