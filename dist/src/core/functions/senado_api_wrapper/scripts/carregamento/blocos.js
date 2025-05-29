"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blocoLoader = exports.BlocoLoader = void 0;
/**
 * Carregador de blocos parlamentares para o Firestore
 */
const logger_1 = require("../utils/logging/logger");
const index_1 = require("../utils/storage/index");
// Função auxiliar para parsear caminhos do Firestore
function parseFirestorePath(fullPath) {
    const parts = fullPath.split('/');
    if (parts.length % 2 !== 0) {
        // Se o caminho não tiver um número par de segmentos, pode ser um caminho de coleção sem ID de documento
        // ou um caminho inválido. Para este contexto, assumimos que o último segmento é o ID do documento.
        // Se for um caminho de coleção (ex: 'minhaColecao'), o ID será 'minhaColecao' e o collectionPath será vazio.
        // Isso pode precisar de ajuste dependendo do uso exato.
        // Para o uso atual (colecao/documento), sempre será par.
        throw new Error(`Caminho Firestore inválido: ${fullPath}. Deve ter um número par de segmentos (coleção/documento/coleção/documento...).`);
    }
    const documentId = parts[parts.length - 1];
    const collectionPath = parts.slice(0, parts.length - 1).join('/');
    return { collectionPath, documentId };
}
/**
 * Classe para carregar dados de blocos parlamentares no Firestore
 */
class BlocoLoader {
    /**
     * Salva dados de blocos no Firestore
     * @param transformedData - Dados transformados dos blocos
     * @param legislaturaNumero - Número da legislatura atual
     */
    async saveBlocos(transformedData, legislaturaNumero) {
        logger_1.logger.info(`Salvando dados de blocos na legislatura ${legislaturaNumero}`);
        const batchManager = index_1.firestoreBatch.createBatchManager();
        const timestamp = new Date().toISOString();
        // Documento com metadados da extração
        const metadataRef = `congressoNacional/senadoFederal/metadata/blocos`;
        const { collectionPath: metaCollection, documentId: metaDocId } = parseFirestorePath(metadataRef);
        batchManager.set(metaCollection, metaDocId, {
            ultimaAtualizacao: timestamp,
            totalRegistros: transformedData.total,
            legislatura: legislaturaNumero,
            status: 'success'
        });
        // Salva cada bloco como um documento separado
        for (const bloco of transformedData.blocos) {
            // Adiciona timestamp de atualização e legislatura
            const blocoData = {
                ...bloco,
                ultimaAtualizacao: timestamp,
                legislatura: legislaturaNumero
            };
            // Referência para a estrutura por legislatura
            const blocoRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/blocos/${bloco.codigo}`;
            const { collectionPath: blocoCollection, documentId: blocoDocId } = parseFirestorePath(blocoRef);
            // Referência para a estrutura "atual" (acesso rápido)
            const blocoAtualRef = `congressoNacional/senadoFederal/atual/blocos/itens/${bloco.codigo}`;
            const { collectionPath: blocoAtualCollection, documentId: blocoAtualDocId } = parseFirestorePath(blocoAtualRef);
            // Salva nas duas coleções
            batchManager.set(blocoCollection, blocoDocId, blocoData);
            batchManager.set(blocoAtualCollection, blocoAtualDocId, blocoData);
        }
        // Executa todas as operações como uma transação
        await batchManager.commitAndReset();
        logger_1.logger.info(`${transformedData.total} blocos salvos no Firestore para a legislatura ${legislaturaNumero}`);
        return {
            timestamp,
            totalSalvos: transformedData.total,
            legislatura: legislaturaNumero,
            status: 'success'
        };
    }
    /**
     * Salva múltiplos blocos no Firestore
     * @param blocos - Array de blocos transformados
     * @param legislatura - Número da legislatura
     * @returns Resultado do carregamento
     */
    async saveMultiplosBlocos(blocos, legislatura) {
        try {
            logger_1.logger.info(`Salvando ${blocos.length} blocos no Firestore`);
            const transformedData = {
                timestamp: new Date().toISOString(),
                total: blocos.length,
                blocos: blocos
            };
            await this.saveBlocos(transformedData, legislatura);
            return {
                total: blocos.length,
                processados: blocos.length,
                sucessos: blocos.length,
                falhas: 0,
                detalhes: blocos.map(b => ({ id: b.codigo, status: 'sucesso' }))
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao salvar blocos: ${error.message}`);
            return {
                total: blocos.length,
                processados: 0,
                sucessos: 0,
                falhas: blocos.length,
                detalhes: blocos.map(b => ({ id: b.codigo, status: 'falha', erro: error.message }))
            };
        }
    }
    /**
     * Salva membros de um bloco no Firestore
     * @param membros - Array de membros do bloco
     * @param blocoId - ID do bloco
     * @param legislatura - Número da legislatura
     * @returns Resultado do carregamento
     */
    async saveMembrosBloco(membros, blocoId, legislatura) {
        try {
            logger_1.logger.info(`Salvando ${membros.length} membros do bloco ${blocoId}`);
            const batchManager = index_1.firestoreBatch.createBatchManager();
            const timestamp = new Date().toISOString();
            // Salvar cada membro
            for (const membro of membros) {
                const membroData = {
                    ...membro,
                    ultimaAtualizacao: timestamp,
                    legislatura: legislatura
                };
                const membroRef = `congressoNacional/senadoFederal/legislaturas/${legislatura}/blocos/${blocoId}/membros/${membro.codigoParlamentar}`;
                const { collectionPath: membroCollection, documentId: membroDocId } = parseFirestorePath(membroRef);
                batchManager.set(membroCollection, membroDocId, membroData);
            }
            await batchManager.commitAndReset();
            return {
                total: membros.length,
                sucessos: membros.length,
                falhas: 0
            };
        }
        catch (error) {
            logger_1.logger.error(`Erro ao salvar membros do bloco ${blocoId}: ${error.message}`);
            return {
                total: membros.length,
                sucessos: 0,
                falhas: membros.length
            };
        }
    }
    /**
     * Salva dados históricos de blocos (mantém versões anteriores)
     * @param transformedData - Dados transformados dos blocos
     * @param legislaturaNumero - Número da legislatura
     */
    async saveBlocosHistorico(transformedData, legislaturaNumero) {
        logger_1.logger.info(`Salvando histórico de blocos da legislatura ${legislaturaNumero} no Firestore`);
        const timestamp = new Date().toISOString();
        const historicRef = `congressoNacional/senadoFederal/historico/blocos/snapshots/${legislaturaNumero}_${timestamp}`;
        // No ambiente real, usaríamos o Firestore.
        // Na versão mock, apenas logamos a operação.
        logger_1.logger.info(`Simulando salvamento de histórico em ${historicRef}`);
        logger_1.logger.debug('Dados do snapshot:', {
            timestamp,
            legislatura: legislaturaNumero,
            totalBlocos: transformedData.total
        });
        // Simula um atraso para parecer mais realista
        await new Promise(resolve => setTimeout(resolve, 500));
        logger_1.logger.info('Histórico de blocos salvo no Firestore (mock)');
        return {
            timestamp,
            legislatura: legislaturaNumero,
            status: 'success'
        };
    }
}
exports.BlocoLoader = BlocoLoader;
// Exporta uma instância do carregador
exports.blocoLoader = new BlocoLoader();
//# sourceMappingURL=blocos.js.map