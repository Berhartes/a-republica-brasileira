"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blocoTransformer = exports.BlocoTransformer = void 0;
/**
 * Transformador para dados de Blocos Parlamentares
 */
const logger_1 = require("../utils/logging/logger");
/**
 * Classe para transformação de dados de blocos parlamentares
 */
class BlocoTransformer {
    /**
     * Transforma os dados de blocos em formato otimizado para Firestore
     */
    transformBlocos(extractionResult) {
        logger_1.logger.info('Transformando dados de blocos parlamentares');
        const { lista, detalhes, senadoresPorBloco } = extractionResult;
        // Mapa para armazenar os dados transformados
        const blocosMapa = {};
        // Primeiro, processar a lista básica
        lista.blocos.forEach(bloco => {
            const codigo = bloco.CodigoBloco;
            if (!codigo)
                return;
            blocosMapa[String(codigo)] = {
                codigo: codigo,
                nome: bloco.NomeBloco,
                sigla: bloco.NomeApelido,
                dataCriacao: bloco.DataCriacao,
                dataExtincao: bloco.DataExtincao,
                atualizadoEm: lista.timestamp,
                partidos: [],
                senadores: [], // Inicializa array vazio para senadores
            };
            // Processar membros/partidos se existirem
            if (bloco.Membros && bloco.Membros.Membro) {
                const membros = Array.isArray(bloco.Membros.Membro)
                    ? bloco.Membros.Membro
                    : [bloco.Membros.Membro];
                membros.forEach((membro) => {
                    const partido = membro.Partido;
                    if (!partido)
                        return;
                    blocosMapa[String(codigo)].partidos.push({
                        codigo: partido.CodigoPartido,
                        nome: partido.NomePartido,
                        sigla: partido.SiglaPartido,
                        dataAdesao: membro.DataAdesao,
                        dataDesligamento: membro.DataDesligamento || null
                    });
                });
            }
        });
        // Em seguida, enriquecer com detalhes quando disponíveis
        detalhes.forEach(detalhe => {
            const codigo = detalhe.codigo;
            if (!codigo || !blocosMapa[String(codigo)])
                return;
            // Adicionar campos extras dos detalhes
            if (detalhe.detalhes) {
                blocosMapa[String(codigo)].detalhesAtualizadosEm = detalhe.timestamp;
                // Adicionar dados da composição se existir
                if (detalhe.detalhes.composicaoBloco) {
                    blocosMapa[String(codigo)].composicao = detalhe.detalhes.composicaoBloco;
                }
                // Adicionar dados das lideranças se existir
                if (detalhe.detalhes.unidadesLiderancaBloco) {
                    blocosMapa[String(codigo)].liderancas = detalhe.detalhes.unidadesLiderancaBloco;
                }
                // Adicionar mais campos que possam ser úteis dos detalhes
                if (detalhe.detalhes.Lider) {
                    blocosMapa[String(codigo)].lider = {
                        codigo: detalhe.detalhes.Lider.IdentificacaoParlamentar?.CodigoParlamentar,
                        nome: detalhe.detalhes.Lider.IdentificacaoParlamentar?.NomeParlamentar,
                        partido: detalhe.detalhes.Lider.IdentificacaoParlamentar?.SiglaPartido,
                        uf: detalhe.detalhes.Lider.IdentificacaoParlamentar?.UfParlamentar
                    };
                }
            }
        });
        // Adicionar senadores aos blocos, se disponíveis
        if (senadoresPorBloco) {
            logger_1.logger.info('Adicionando senadores aos blocos');
            Object.entries(senadoresPorBloco.senadoresPorBloco).forEach(([codigoBloco, senadores]) => {
                if (blocosMapa[codigoBloco]) {
                    blocosMapa[codigoBloco].senadores = senadores.map(senador => ({
                        codigo: senador.codigoSenador,
                        nome: senador.nomeSenador,
                        partido: senador.siglaPartido,
                        uf: senador.uf
                    }));
                    logger_1.logger.debug(`Adicionados ${senadores.length} senadores ao bloco ${codigoBloco}`);
                }
                else {
                    logger_1.logger.warn(`Bloco ${codigoBloco} não encontrado para adicionar senadores`);
                }
            });
        }
        else {
            logger_1.logger.warn('Dados de senadores por bloco não disponíveis para transformação');
        }
        // Converter o mapa em array
        const blocosArray = Object.values(blocosMapa);
        logger_1.logger.info(`Transformados ${blocosArray.length} blocos parlamentares`);
        return {
            timestamp: new Date().toISOString(),
            total: blocosArray.length,
            blocos: blocosArray
        };
    }
    /**
     * Transforma um bloco individual
     * @param bloco - Bloco a ser transformado
     * @returns Bloco transformado
     */
    transformBloco(bloco) {
        try {
            if (!bloco || !bloco.CodigoBloco) {
                return null;
            }
            return {
                codigo: bloco.CodigoBloco,
                nome: bloco.NomeBloco || '',
                sigla: bloco.NomeApelido,
                dataCriacao: bloco.DataCriacao,
                dataExtincao: bloco.DataExtincao,
                atualizadoEm: new Date().toISOString(),
                partidos: [],
                senadores: []
            };
        }
        catch (error) {
            logger_1.logger.warn(`Erro ao transformar bloco: ${error.message}`);
            return null;
        }
    }
    /**
     * Transforma um membro de bloco
     * @param membro - Membro a ser transformado
     * @param blocoId - ID do bloco
     * @returns Membro transformado
     */
    transformMembroBloco(membro, blocoId) {
        try {
            if (!membro) {
                return null;
            }
            return {
                codigoParlamentar: membro.codigoParlamentar || '',
                nomeParlamentar: membro.nomeParlamentar || '',
                siglaPartido: membro.siglaPartido || '',
                uf: membro.uf || '',
                dataAdesao: membro.dataAdesao,
                dataDesligamento: membro.dataDesligamento,
                situacao: membro.situacao || 'Ativo',
                blocoId: blocoId
            };
        }
        catch (error) {
            logger_1.logger.warn(`Erro ao transformar membro do bloco: ${error.message}`);
            return null;
        }
    }
}
exports.BlocoTransformer = BlocoTransformer;
// Exporta uma instância do transformador
exports.blocoTransformer = new BlocoTransformer();
//# sourceMappingURL=blocos.js.map