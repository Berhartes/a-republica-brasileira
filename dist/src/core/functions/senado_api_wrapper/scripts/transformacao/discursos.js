"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discursoTransformer = exports.DiscursoTransformer = void 0;
/**
 * Transformador para dados de Discursos de Senadores
 */
const logger_1 = require("../utils/logging/logger");
/**
 * Classe para transformação de dados de discursos
 */
class DiscursoTransformer {
    /**
     * Transforma um discurso individual
     */
    transformDiscurso(discurso) {
        try {
            logger_1.logger.debug('Transformando discurso:', discurso);
            // Extrair dados básicos do discurso
            const codigo = discurso.CodigoPronunciamento || discurso.CodigoTexto || discurso.Codigo || '';
            const tipo = discurso.TipoTexto || discurso.Tipo || 'Discurso';
            const data = this.formatarData(discurso.DataPronunciamento || discurso.DataTexto || discurso.Data || '');
            // Adicionar validação para campos obrigatórios após extração
            if (!codigo) {
                logger_1.logger.warn(`Discurso sem código identificado, pulando transformação. Dados: ${JSON.stringify(discurso)}`);
                return null;
            }
            if (!data) {
                logger_1.logger.warn(`Discurso sem data identificada, pulando transformação. Dados: ${JSON.stringify(discurso)}`);
                return null;
            }
            const assunto = discurso.Assunto || '';
            const sumario = discurso.Sumario || discurso.TextoResumo || '';
            const indexacao = discurso.Indexacao || '';
            const url = discurso.UrlTexto || discurso.Url || '';
            const fase = discurso.FaseTexto || discurso.Fase || '';
            // Extrair dados do parlamentar
            const autorTexto = discurso.AutorTexto || discurso.Autor || {};
            const identificacaoParlamentar = autorTexto.IdentificacaoParlamentar || autorTexto;
            const parlamentar = {
                codigo: identificacaoParlamentar.CodigoParlamentar || '',
                nome: identificacaoParlamentar.NomeParlamentar || autorTexto.Nome || '',
                partido: identificacaoParlamentar.SiglaPartidoParlamentar || autorTexto.Partido || '',
                uf: identificacaoParlamentar.UfParlamentar || autorTexto.UF || ''
            };
            // Extrair dados da sessão (se disponível)
            const sessao = discurso.Sessao || {};
            const discursoTransformado = {
                codigo,
                tipo,
                data,
                assunto,
                sumario,
                indexacao,
                url,
                fase,
                parlamentar,
                atualizadoEm: new Date().toISOString()
            };
            // Adicionar sessão se disponível
            if (sessao.Codigo || sessao.Data || sessao.Tipo) {
                discursoTransformado.sessao = {
                    codigo: sessao.Codigo || '',
                    data: this.formatarData(sessao.Data || ''),
                    tipo: sessao.Tipo || ''
                };
            }
            return discursoTransformado;
        }
        catch (error) {
            logger_1.logger.warn(`Erro ao transformar discurso: ${error.message}`);
            return null;
        }
    }
    /**
     * Transforma os dados extraídos dos discursos em formato padronizado
     */
    transformDiscursos(extractionResult) {
        logger_1.logger.info('Transformando dados de discursos');
        const timestamp = new Date().toISOString();
        // Extrair lista de discursos
        const listaDiscursos = this.extrairDadosDiscursos(extractionResult.discursos);
        // Transformar cada discurso
        const discursosTransformados = [];
        const estatisticas = {
            totalDiscursos: 0,
            porTipo: {},
            porMes: {}
        };
        for (const discurso of listaDiscursos) {
            const discursoTransformado = this.transformDiscurso(discurso);
            if (discursoTransformado) {
                discursosTransformados.push(discursoTransformado);
                // Atualizar estatísticas
                estatisticas.totalDiscursos++;
                // Por tipo
                const tipo = discursoTransformado.tipo || 'Outros';
                estatisticas.porTipo[tipo] = (estatisticas.porTipo[tipo] || 0) + 1;
                // Por mês (YYYY-MM)
                const mes = discursoTransformado.data?.substring(0, 7) || 'Sem data';
                estatisticas.porMes[mes] = (estatisticas.porMes[mes] || 0) + 1;
            }
        }
        // Adicionar dados do parlamentar se disponível
        if (extractionResult.senador && extractionResult.senador.IdentificacaoParlamentar) {
            const identificacao = extractionResult.senador.IdentificacaoParlamentar;
            estatisticas.parlamentar = {
                codigo: identificacao.CodigoParlamentar || '',
                nome: identificacao.NomeParlamentar || '',
                partido: identificacao.SiglaPartidoParlamentar || '',
                uf: identificacao.UfParlamentar || ''
            };
        }
        logger_1.logger.info(`Transformados ${discursosTransformados.length} discursos`);
        logger_1.logger.info(`Estatísticas por tipo: ${JSON.stringify(estatisticas.porTipo)}`);
        return {
            timestamp,
            discursos: {
                itens: discursosTransformados,
                total: discursosTransformados.length
            },
            estatisticas
        };
    }
    /**
     * Extrai a lista de discursos da estrutura da API
     */
    extrairDadosDiscursos(discursos) {
        try {
            // Considerando diferentes estruturas possíveis da API
            if (discursos?.ListaTextos?.Textos?.Texto) {
                const listaTextos = discursos.ListaTextos.Textos.Texto;
                return Array.isArray(listaTextos) ? listaTextos : [listaTextos];
            }
            else if (discursos?.Textos?.Texto) {
                const listaTextos = discursos.Textos.Texto;
                return Array.isArray(listaTextos) ? listaTextos : [listaTextos];
            }
            else if (discursos?.discursos) {
                const listaDiscursos = discursos.discursos;
                return Array.isArray(listaDiscursos) ? listaDiscursos : [listaDiscursos];
            }
            else if (Array.isArray(discursos)) {
                return discursos;
            }
            // Busca recursiva por uma lista de discursos
            const buscarDiscursos = (obj) => {
                if (!obj || typeof obj !== 'object')
                    return [];
                for (const key in obj) {
                    if (Array.isArray(obj[key])) {
                        // Verificar se o array contém objetos que parecem discursos
                        if (obj[key].length > 0 && this.pareceDiscurso(obj[key][0])) {
                            return obj[key];
                        }
                    }
                    else if (typeof obj[key] === 'object') {
                        const result = buscarDiscursos(obj[key]);
                        if (result.length > 0)
                            return result;
                    }
                }
                return [];
            };
            const discursosEncontrados = buscarDiscursos(discursos);
            if (discursosEncontrados.length === 0) {
                logger_1.logger.warn('Estrutura de discursos não reconhecida', { discursos });
            }
            return discursosEncontrados;
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair dados de discursos: ${error.message}`, error);
            return [];
        }
    }
    /**
     * Verifica se um objeto parece ser um discurso
     */
    pareceDiscurso(obj) {
        if (!obj || typeof obj !== 'object')
            return false;
        // Verificar se tem campos típicos de um discurso
        const camposDiscurso = [
            'CodigoTexto', 'Codigo', 'TipoTexto', 'Tipo',
            'DataTexto', 'Data', 'Assunto', 'Sumario',
            'TextoResumo', 'AutorTexto', 'Autor'
        ];
        return camposDiscurso.some(campo => obj.hasOwnProperty(campo));
    }
    /**
     * Consolida resultados de discursos de múltiplos períodos
     */
    consolidarDiscursosPorPeriodo(resultados) {
        try {
            logger_1.logger.info(`Consolidando ${resultados.length} resultados de discursos`);
            if (!resultados || resultados.length === 0) {
                logger_1.logger.warn('Nenhum resultado de discursos para consolidar');
                return null;
            }
            const todosDiscursos = [];
            for (const resultado of resultados) {
                if (!resultado || !resultado.dados)
                    continue;
                // Extrair discursos de cada resultado
                const discursos = this.extrairDadosDiscursos(resultado.dados);
                if (discursos.length > 0) {
                    logger_1.logger.info(`Adicionando ${discursos.length} discursos ao consolidado`);
                    todosDiscursos.push(...discursos);
                }
            }
            logger_1.logger.info(`Consolidação concluída: ${todosDiscursos.length} discursos encontrados`);
            return {
                discursos: todosDiscursos
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao consolidar resultados de discursos: ${error.message}`);
            return null;
        }
    }
    /**
     * Formata uma data para o padrão ISO (YYYY-MM-DD)
     */
    formatarData(data) {
        if (!data)
            return '';
        try {
            // Tentar diferentes formatos de data
            const formatosSuportados = [
                /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
                /^(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
                /^(\d{4})(\d{2})(\d{2})/, // YYYYMMDD
            ];
            for (const formato of formatosSuportados) {
                const match = data.match(formato);
                if (match) {
                    if (formato === formatosSuportados[0]) {
                        // Já está no formato correto
                        return data;
                    }
                    else if (formato === formatosSuportados[1]) {
                        // DD/MM/YYYY -> YYYY-MM-DD
                        return `${match[3]}-${match[2]}-${match[1]}`;
                    }
                    else if (formato === formatosSuportados[2]) {
                        // YYYYMMDD -> YYYY-MM-DD
                        return `${match[1]}-${match[2]}-${match[3]}`;
                    }
                }
            }
            // Tentar parsear como Date
            const dataObj = new Date(data);
            if (!isNaN(dataObj.getTime())) {
                return dataObj.toISOString().split('T')[0];
            }
            logger_1.logger.warn(`Formato de data não reconhecido: ${data}`);
            return data; // Retornar original se não conseguir formatar
        }
        catch (error) {
            logger_1.logger.warn(`Erro ao formatar data ${data}: ${error.message}`);
            return data;
        }
    }
}
exports.DiscursoTransformer = DiscursoTransformer;
// Exporta uma instância do transformador
exports.discursoTransformer = new DiscursoTransformer();
//# sourceMappingURL=discursos.js.map