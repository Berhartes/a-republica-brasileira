"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discursosTransformer = exports.DiscursosTransformer = void 0;
/**
 * Transformador especializado para discursos de senadores
 * Este módulo transforma especificamente discursos e apartes de senadores,
 * tratando as peculiaridades da resposta da API.
 */
const logging_1 = require("../utils/logging");
/**
 * Classe para transformação de dados de discursos de senadores
 */
class DiscursosTransformer {
    /**
     * Transforma os discursos e apartes de um senador
     * @param discursoResult - Resultado da extração de discursos
     * @returns Discursos transformados
     */
    transformDiscursos(discursoResult) {
        try {
            // Verificação se o resultado existe
            if (!discursoResult) {
                logging_1.logger.error(`Resultado de discursos é nulo ou indefinido`);
                return null;
            }
            // Verificação para dados básicos
            if (!discursoResult.dadosBasicos ||
                !discursoResult.dadosBasicos.dados ||
                Object.keys(discursoResult.dadosBasicos.dados).length === 0) {
                logging_1.logger.warn(`Dados básicos incompletos ou vazios para o senador ${discursoResult.codigo || 'desconhecido'}`);
                return null;
            }
            logging_1.logger.info(`Transformando discursos do senador ${discursoResult.codigo}`);
            // Extrair componentes principais
            const dadosBasicos = discursoResult.dadosBasicos.dados || {};
            const apartes = discursoResult.apartes?.dados || null;
            const discursos = discursoResult.discursos?.dados || null;
            // Verificar se temos dados parlamentares
            const parlamentar = dadosBasicos.Parlamentar ||
                dadosBasicos.DetalheParlamentar?.Parlamentar || {};
            // Verificar se temos dados de identificação
            const identificacao = parlamentar.IdentificacaoParlamentar || {};
            // Transformar discursos
            const discursosTransformados = this.transformDiscursosDetalhados(discursos);
            // Transformar apartes
            const apartesTransformados = this.transformApartes(apartes);
            // Criar objeto de discursos transformados
            const discursoTransformado = {
                codigo: discursoResult.codigo.toString(),
                senador: {
                    codigo: discursoResult.codigo.toString(),
                    nome: identificacao.NomeParlamentar || 'Nome não disponível',
                    partido: {
                        sigla: identificacao.SiglaPartidoParlamentar || '',
                        nome: identificacao.NomePartidoParlamentar || undefined
                    },
                    uf: identificacao.UfParlamentar || ''
                },
                discursos: discursosTransformados,
                apartes: apartesTransformados,
                timestamp: new Date().toISOString()
            };
            return discursoTransformado;
        }
        catch (error) {
            logging_1.logger.error(`Erro ao transformar discursos: ${error.message}`);
            return null;
        }
    }
    /**
     * Transforma discursos detalhados
     * @param discursos - Dados de discursos
     * @returns Discursos transformados
     */
    transformDiscursosDetalhados(discursos) {
        if (!discursos) {
            logging_1.logger.debug('Dados de discursos não encontrados ou vazios');
            return [];
        }
        // Verificar estrutura dos discursos
        let discursosArray = [];
        // Verificar estrutura com Pronunciamentos (nova estrutura)
        if (discursos.DiscursosParlamentar && discursos.DiscursosParlamentar.Parlamentar) {
            const parlamentar = discursos.DiscursosParlamentar.Parlamentar;
            // Verificar se temos Pronunciamentos
            if (parlamentar.Pronunciamentos && parlamentar.Pronunciamentos.Pronunciamento) {
                logging_1.logger.debug(`Encontrada estrutura Pronunciamentos.Pronunciamento`);
                discursosArray = Array.isArray(parlamentar.Pronunciamentos.Pronunciamento)
                    ? parlamentar.Pronunciamentos.Pronunciamento
                    : [parlamentar.Pronunciamentos.Pronunciamento];
            }
            // Verificar estrutura antiga com Discursos
            else if (parlamentar.Discursos && parlamentar.Discursos.Discurso) {
                logging_1.logger.debug(`Encontrada estrutura Discursos.Discurso`);
                discursosArray = Array.isArray(parlamentar.Discursos.Discurso)
                    ? parlamentar.Discursos.Discurso
                    : [parlamentar.Discursos.Discurso];
            }
        }
        // Verificar outras estruturas possíveis
        else if (discursos.Parlamentar && discursos.Parlamentar.Pronunciamentos && discursos.Parlamentar.Pronunciamentos.Pronunciamento) {
            logging_1.logger.debug(`Encontrada estrutura Parlamentar.Pronunciamentos.Pronunciamento`);
            discursosArray = Array.isArray(discursos.Parlamentar.Pronunciamentos.Pronunciamento)
                ? discursos.Parlamentar.Pronunciamentos.Pronunciamento
                : [discursos.Parlamentar.Pronunciamentos.Pronunciamento];
        }
        else if (discursos.Pronunciamentos && discursos.Pronunciamentos.Pronunciamento) {
            logging_1.logger.debug(`Encontrada estrutura Pronunciamentos.Pronunciamento`);
            discursosArray = Array.isArray(discursos.Pronunciamentos.Pronunciamento)
                ? discursos.Pronunciamentos.Pronunciamento
                : [discursos.Pronunciamentos.Pronunciamento];
        }
        else if (discursos.Discursos && discursos.Discursos.Discurso) {
            logging_1.logger.debug(`Encontrada estrutura Discursos.Discurso`);
            discursosArray = Array.isArray(discursos.Discursos.Discurso)
                ? discursos.Discursos.Discurso
                : [discursos.Discursos.Discurso];
        }
        logging_1.logger.debug(`Encontrados ${discursosArray.length} discursos para transformação`);
        // Transformar cada discurso ou pronunciamento
        return discursosArray.map((discurso) => {
            try {
                // Verificar se é um pronunciamento ou um discurso
                const isPronunciamento = discurso.CodigoPronunciamento !== undefined;
                if (isPronunciamento) {
                    logging_1.logger.debug(`Transformando pronunciamento com código ${discurso.CodigoPronunciamento}`);
                    return {
                        id: discurso.CodigoPronunciamento || '',
                        data: discurso.DataPronunciamento || '',
                        indexacao: discurso.Indexacao || undefined,
                        url: discurso.UrlDiscurso || discurso.url || undefined,
                        urlTexto: discurso.UrlTexto || undefined,
                        resumo: discurso.TextoResumo || undefined,
                        tipo: discurso.TipoUsoPalavra?.Descricao || undefined
                    };
                }
                else {
                    logging_1.logger.debug(`Transformando discurso com código ${discurso.CodigoDiscurso || discurso.codigo || 'desconhecido'}`);
                    return {
                        id: discurso.CodigoDiscurso || discurso.codigo || '',
                        data: discurso.DataDiscurso || discurso.data || '',
                        indexacao: discurso.IndexacaoDiscurso || discurso.indexacao || undefined,
                        url: discurso.UrlDiscurso || discurso.url || undefined,
                        urlTexto: discurso.UrlTexto || discurso.urlTexto || undefined,
                        resumo: discurso.TextoDiscurso || discurso.resumo || undefined,
                        tipo: discurso.TipoDiscurso?.Descricao || discurso.tipo || undefined
                    };
                }
            }
            catch (error) {
                logging_1.logger.warn(`Erro ao transformar discurso/pronunciamento: ${error.message}`);
                return null;
            }
        }).filter(Boolean);
    }
    /**
     * Transforma apartes
     * @param apartes - Dados de apartes
     * @returns Apartes transformados
     */
    transformApartes(apartes) {
        if (!apartes) {
            logging_1.logger.debug('Dados de apartes não encontrados ou vazios');
            return [];
        }
        // Verificar estrutura dos apartes
        let apartesArray = [];
        if (apartes.ApartesParlamentar && apartes.ApartesParlamentar.Parlamentar) {
            const parlamentar = apartes.ApartesParlamentar.Parlamentar;
            if (parlamentar.Apartes && parlamentar.Apartes.Aparte) {
                apartesArray = Array.isArray(parlamentar.Apartes.Aparte)
                    ? parlamentar.Apartes.Aparte
                    : [parlamentar.Apartes.Aparte];
            }
        }
        else if (apartes.Apartes && apartes.Apartes.Aparte) {
            apartesArray = Array.isArray(apartes.Apartes.Aparte)
                ? apartes.Apartes.Aparte
                : [apartes.Apartes.Aparte];
        }
        logging_1.logger.debug(`Encontrados ${apartesArray.length} apartes para transformação`);
        // Transformar cada aparte
        return apartesArray.map((aparte) => {
            try {
                // Log detalhado para debug
                logging_1.logger.debug(`Estrutura do aparte: ${JSON.stringify(Object.keys(aparte))}`);
                // Mapear campos corretamente com base na estrutura do JSON de apartes
                return {
                    id: aparte.CodigoPronunciamento || aparte.CodigoAparte || aparte.codigo || '',
                    data: aparte.DataPronunciamento || aparte.DataAparte || aparte.data || '',
                    discursoId: aparte.CodigoPronunciamento || aparte.CodigoDiscurso || aparte.discursoId || '',
                    orador: {
                        codigo: aparte.Orador?.CodigoParlamentar || aparte.orador?.codigo || '',
                        nome: aparte.Orador?.NomeParlamentar || aparte.orador?.nome || '',
                        partido: aparte.Orador?.SiglaPartidoParlamentarNaData || aparte.SiglaPartidoParlamentarNaData || aparte.orador?.partido || '',
                        uf: aparte.Orador?.UfParlamentarNaData || aparte.UfParlamentarNaData || aparte.orador?.uf || ''
                    },
                    tipoUsoPalavra: aparte.TipoUsoPalavra ? {
                        codigo: aparte.TipoUsoPalavra.Codigo || '',
                        sigla: aparte.TipoUsoPalavra.Sigla || '',
                        descricao: aparte.TipoUsoPalavra.Descricao || ''
                    } : undefined,
                    casa: {
                        sigla: aparte.SiglaCasaPronunciamento || '',
                        nome: aparte.NomeCasaPronunciamento || ''
                    },
                    sessao: aparte.SessaoPlenaria ? {
                        codigo: aparte.SessaoPlenaria.CodigoSessao || '',
                        data: aparte.SessaoPlenaria.DataSessao || '',
                        hora: aparte.SessaoPlenaria.HoraInicioSessao || '',
                        tipo: aparte.SessaoPlenaria.SiglaTipoSessao || '',
                        numero: aparte.SessaoPlenaria.NumeroSessao || ''
                    } : undefined,
                    url: aparte.UrlTexto || aparte.UrlDiscurso || aparte.url || undefined,
                    urlTexto: aparte.UrlTextoBinario || aparte.UrlTexto || aparte.urlTexto || undefined,
                    resumo: aparte.TextoResumo || aparte.TextoAparte || aparte.resumo || undefined,
                    indexacao: aparte.Indexacao || undefined,
                    publicacoes: aparte.Publicacoes?.Publicacao ?
                        (Array.isArray(aparte.Publicacoes.Publicacao) ?
                            aparte.Publicacoes.Publicacao.map((pub) => ({
                                veiculo: pub.DescricaoVeiculoPublicacao || '',
                                data: pub.DataPublicacao || '',
                                paginaInicio: pub.NumeroPagInicioPublicacao || '',
                                paginaFim: pub.NumeroPagFimPublicacao || '',
                                url: pub.UrlDiario || ''
                            })) :
                            [{
                                    veiculo: aparte.Publicacoes.Publicacao.DescricaoVeiculoPublicacao || '',
                                    data: aparte.Publicacoes.Publicacao.DataPublicacao || '',
                                    paginaInicio: aparte.Publicacoes.Publicacao.NumeroPagInicioPublicacao || '',
                                    paginaFim: aparte.Publicacoes.Publicacao.NumeroPagFimPublicacao || '',
                                    url: aparte.Publicacoes.Publicacao.UrlDiario || ''
                                }]) : undefined
                };
            }
            catch (error) {
                logging_1.logger.warn(`Erro ao transformar aparte: ${error.message}`);
                return null;
            }
        }).filter(Boolean);
    }
}
exports.DiscursosTransformer = DiscursosTransformer;
// Exporta uma instância do transformador
exports.discursosTransformer = new DiscursosTransformer();
//# sourceMappingURL=perfilsenadores_discursos.js.map