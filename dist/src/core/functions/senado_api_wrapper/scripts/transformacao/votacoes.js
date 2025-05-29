"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.votacoesTransformer = exports.VotacoesTransformer = void 0;
/**
 * Transformador especializado para votações de senadores
 * Este módulo transforma especificamente votações de senadores,
 * tratando as peculiaridades da resposta da API.
 */
const logger_1 = require("../utils/logging/logger");
/**
 * Classe para transformação de dados de votações de senadores
 */
class VotacoesTransformer {
    /**
     * Transforma os dados de senadores de uma legislatura específica
     * @param senadoresExtraidos - Dados extraídos dos senadores
     * @param legislaturaNumero - Número da legislatura
     * @returns Dados transformados dos senadores
     */
    transformSenadoresLegislatura(senadoresExtraidos, legislaturaNumero) {
        try {
            logger_1.logger.info(`Transformando dados de senadores de legislatura específica`);
            // Verificar se temos dados válidos
            if (!senadoresExtraidos || !senadoresExtraidos.senadores || !Array.isArray(senadoresExtraidos.senadores)) {
                logger_1.logger.warn(`Dados inválidos para transformação de senadores da legislatura ${legislaturaNumero}`);
                return {
                    timestamp: new Date().toISOString(),
                    senadores: [],
                    legislatura: legislaturaNumero
                };
            }
            // Transformar cada senador
            const senadoresTransformados = senadoresExtraidos.senadores.map((senador) => {
                try {
                    // Verificar se temos dados de identificação
                    const identificacao = senador.IdentificacaoParlamentar || {};
                    return {
                        codigo: identificacao.CodigoParlamentar || '',
                        nome: identificacao.NomeParlamentar || '',
                        nomeCompleto: identificacao.NomeCompletoParlamentar || '',
                        sexo: identificacao.SexoParlamentar || '',
                        partido: {
                            sigla: identificacao.SiglaPartidoParlamentar || '',
                            nome: identificacao.NomePartidoParlamentar || ''
                        },
                        uf: identificacao.UfParlamentar || '',
                        foto: identificacao.UrlFotoParlamentar || '',
                        email: identificacao.EmailParlamentar || '',
                        site: identificacao.UrlPaginaParlamentar || '',
                        nascimento: {
                            data: identificacao.DataNascimento || '',
                            local: ''
                        },
                        mandato: {
                            inicio: senador.Mandato?.DataInicio || '',
                            fim: senador.Mandato?.DataFim || '',
                            titular: senador.Mandato?.DescricaoParticipacao === 'Titular',
                            suplente: senador.Mandato?.DescricaoParticipacao === 'Suplente'
                        }
                    };
                }
                catch (error) {
                    logger_1.logger.warn(`Erro ao transformar senador: ${error.message}`);
                    return null;
                }
            }).filter(Boolean);
            logger_1.logger.info(`Transformados ${senadoresTransformados.length} senadores da legislatura ${legislaturaNumero}`);
            return {
                timestamp: new Date().toISOString(),
                senadores: senadoresTransformados,
                legislatura: legislaturaNumero
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao transformar senadores da legislatura ${legislaturaNumero}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                senadores: [],
                legislatura: legislaturaNumero
            };
        }
    }
    /**
     * Transforma as votações de um senador
     * @param votacaoResult - Resultado da extração de votações
     * @returns Votações transformadas
     */
    transformVotacoes(votacaoResult) {
        try {
            // Verificação se o resultado existe
            if (!votacaoResult) {
                logger_1.logger.error(`Resultado de votações é nulo ou indefinido`);
                return null;
            }
            // Verificação para dados básicos
            if (!votacaoResult.dadosBasicos ||
                !votacaoResult.dadosBasicos.dados ||
                Object.keys(votacaoResult.dadosBasicos.dados).length === 0) {
                logger_1.logger.warn(`Dados básicos incompletos ou vazios para o senador ${votacaoResult.codigo || 'desconhecido'}`);
                return null;
            }
            logger_1.logger.info(`Transformando votações do senador ${votacaoResult.codigo}`);
            // Extrair componentes principais
            const dadosBasicos = votacaoResult.dadosBasicos.dados || {};
            const votacoes = votacaoResult.votacoes?.dados || null;
            // Verificar se temos dados parlamentares
            const parlamentar = dadosBasicos.Parlamentar ||
                dadosBasicos.DetalheParlamentar?.Parlamentar || {};
            // Verificar se temos dados de identificação
            const identificacao = parlamentar.IdentificacaoParlamentar || {};
            // Transformar votações
            const votacoesTransformadas = this.transformVotacoesDetalhadas(votacoes);
            // Criar objeto de votações transformadas
            const votacaoTransformada = {
                codigo: votacaoResult.codigo.toString(),
                senador: {
                    codigo: votacaoResult.codigo.toString(),
                    nome: identificacao.NomeParlamentar || 'Nome não disponível',
                    partido: {
                        sigla: identificacao.SiglaPartidoParlamentar || '',
                        nome: identificacao.NomePartidoParlamentar || undefined
                    },
                    uf: identificacao.UfParlamentar || ''
                },
                votacoes: votacoesTransformadas,
                timestamp: new Date().toISOString()
            };
            return votacaoTransformada;
        }
        catch (error) {
            logger_1.logger.error(`Erro ao transformar votações: ${error.message}`);
            return null;
        }
    }
    /**
     * Transforma votações detalhadas
     * @param votacoes - Dados de votações
     * @returns Votações transformadas
     */
    transformVotacoesDetalhadas(votacoes) {
        if (!votacoes) {
            logger_1.logger.debug('Dados de votações não encontrados ou vazios');
            return [];
        }
        // Verificar estrutura das votações
        let votacoesArray = [];
        if (votacoes.VotacaoParlamentar && votacoes.VotacaoParlamentar.Parlamentar) {
            const parlamentar = votacoes.VotacaoParlamentar.Parlamentar;
            if (parlamentar.Votacoes && parlamentar.Votacoes.Votacao) {
                votacoesArray = Array.isArray(parlamentar.Votacoes.Votacao)
                    ? parlamentar.Votacoes.Votacao
                    : [parlamentar.Votacoes.Votacao];
            }
        }
        else if (votacoes.Votacoes && votacoes.Votacoes.Votacao) {
            votacoesArray = Array.isArray(votacoes.Votacoes.Votacao)
                ? votacoes.Votacoes.Votacao
                : [votacoes.Votacoes.Votacao];
        }
        logger_1.logger.debug(`Encontradas ${votacoesArray.length} votações para transformação`);
        // Transformar cada votação
        return votacoesArray.map((votacao) => {
            try {
                const materia = votacao.Materia || {};
                const sessao = votacao.Sessao || {};
                return {
                    id: votacao.SequencialVotacao || votacao.id || '',
                    materia: {
                        tipo: materia.SiglaMateria || materia.tipo || '',
                        numero: materia.NumeroMateria || materia.numero || '',
                        ano: materia.AnoMateria || materia.ano || '',
                        ementa: materia.DescricaoMateria || materia.ementa || undefined
                    },
                    sessao: {
                        codigo: sessao.CodigoSessao || sessao.codigo || '',
                        data: sessao.DataSessao || sessao.data || '',
                        legislatura: parseInt(sessao.NumeroLegislatura || '0', 10),
                        sessaoLegislativa: parseInt(sessao.NumeroSessaoLegislativa || '0', 10)
                    },
                    voto: votacao.DescricaoVoto || votacao.voto || '',
                    orientacaoBancada: votacao.DescricaoOrientacaoBancada || votacao.orientacaoBancada || undefined,
                    resultado: votacao.DescricaoResultado || votacao.resultado || undefined,
                    sequencial: parseInt(votacao.SequencialVotacao || '0', 10) || undefined
                };
            }
            catch (error) {
                logger_1.logger.warn(`Erro ao transformar votação: ${error.message}`);
                return null;
            }
        }).filter(Boolean);
    }
}
exports.VotacoesTransformer = VotacoesTransformer;
// Exporta uma instância do transformador
exports.votacoesTransformer = new VotacoesTransformer();
//# sourceMappingURL=votacoes.js.map