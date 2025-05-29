"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.votacoesLoader = exports.VotacoesLoader = void 0;
/**
 * Módulo de carregamento de votações de senadores para o Firestore
 * Este módulo é especializado na persistência de votações de senadores
 */
const logging_1 = require("../utils/logging");
const storage_1 = require("../utils/storage");
// Função auxiliar para parsear caminhos do Firestore
function parseFirestorePath(fullPath) {
    const parts = fullPath.split('/');
    if (parts.length % 2 !== 0) {
        throw new Error(`Caminho Firestore inválido: ${fullPath}. Deve ter um número par de segmentos (coleção/documento/coleção/documento...).`);
    }
    const documentId = parts[parts.length - 1];
    const collectionPath = parts.slice(0, parts.length - 1).join('/');
    return { collectionPath, documentId };
}
/**
 * Classe para carregar dados de votações de senadores no Firestore
 */
class VotacoesLoader {
    /**
     * Salva votações de um senador no Firestore
     * @param votacaoData - Votações transformadas do senador
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @returns Resultado da operação
     */
    async saveVotacao(votacaoData, legislaturaNumero) {
        try {
            // Verificação de segurança
            if (!votacaoData || !votacaoData.codigo) {
                logging_1.logger.error('Dados de votação inválidos para salvamento');
                return {
                    timestamp: new Date().toISOString(),
                    codigo: 'desconhecido',
                    status: 'error'
                };
            }
            logging_1.logger.info(`Salvando votações do senador ${votacaoData.senador.nome} (${votacaoData.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
            const timestamp = new Date().toISOString();
            // 1. Salvar no firestore na coleção de votações
            const votacaoRef = `congressoNacional/senadoFederal/votacoes/${votacaoData.codigo}`;
            const batchManager = storage_1.firestoreBatch.createBatchManager();
            const { collectionPath, documentId } = parseFirestorePath(votacaoRef);
            batchManager.set(collectionPath, documentId, {
                ...votacaoData,
                atualizadoEm: timestamp
            });
            // Commit das operações
            await batchManager.commitAndReset();
            logging_1.logger.info(`Votações do senador ${votacaoData.codigo} salvas com sucesso`);
            return {
                timestamp,
                codigo: votacaoData.codigo,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar votações do senador ${votacaoData?.codigo || 'desconhecido'}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                codigo: votacaoData?.codigo || 'desconhecido',
                status: 'error'
            };
        }
    }
    /**
     * Salva múltiplas votações de senadores em uma única operação
     * @param votacoes - Lista de votações transformadas
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @returns Resultado da operação
     */
    async saveMultiplasVotacoes(votacoes, legislaturaNumero) {
        try {
            logging_1.logger.info(`Salvando votações de ${votacoes.length} senadores ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
            const timestamp = new Date().toISOString();
            let sucessos = 0;
            let falhas = 0;
            // Processar em lotes para melhor performance
            const tamanhoLote = 10;
            const lotes = [];
            for (let i = 0; i < votacoes.length; i += tamanhoLote) {
                lotes.push(votacoes.slice(i, i + tamanhoLote));
            }
            for (const [indice, lote] of lotes.entries()) {
                logging_1.logger.info(`Processando lote ${indice + 1}/${lotes.length} (${lote.length} votações)`);
                const batchManager = storage_1.firestoreBatch.createBatchManager();
                // Salvar cada votação no lote
                for (const votacao of lote) {
                    try {
                        // Verificar se a votação é válida
                        if (!votacao || !votacao.codigo) {
                            logging_1.logger.warn(`Votação inválida encontrada no lote ${indice + 1}, pulando...`);
                            falhas++;
                            continue;
                        }
                        // 1. Salvar no firestore na coleção de votações
                        const votacaoRef = `congressoNacional/senadoFederal/votacoes/${votacao.codigo}`;
                        const { collectionPath, documentId } = parseFirestorePath(votacaoRef);
                        batchManager.set(collectionPath, documentId, {
                            ...votacao,
                            atualizadoEm: timestamp
                        });
                        sucessos++;
                    }
                    catch (error) {
                        logging_1.logger.warn(`Erro ao processar votações do senador ${votacao?.codigo || 'desconhecido'} no lote ${indice + 1}: ${error.message}`);
                        falhas++;
                    }
                }
                // Commit das operações do lote
                try {
                    await batchManager.commitAndReset();
                }
                catch (error) {
                    logging_1.logger.error(`Erro ao fazer commit do lote ${indice + 1}: ${error.message}`);
                    // Ajustar contadores de sucesso/falha
                    falhas += lote.length;
                    sucessos -= lote.length;
                }
                // Pequena pausa entre lotes para evitar sobrecarga
                if (indice < lotes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            logging_1.logger.info(`Salvamento de votações concluído: ${sucessos} sucessos, ${falhas} falhas`);
            return {
                timestamp,
                total: votacoes.length,
                sucessos,
                falhas,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar múltiplas votações: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                total: votacoes.length,
                sucessos: 0,
                falhas: votacoes.length,
                status: 'error'
            };
        }
    }
}
exports.VotacoesLoader = VotacoesLoader;
// Instância singleton para uso em toda a aplicação
exports.votacoesLoader = new VotacoesLoader();
//# sourceMappingURL=votacoes.js.map