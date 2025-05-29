"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.senadoresLoader = exports.SenadoresLoader = void 0;
/**
 * Carregador de senadores para o Firestore
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
 * Classe para carregamento de senadores no Firestore
 */
class SenadoresLoader {
    /**
     * Salva dados de senadores ativos no Firestore
     * @param transformedData - Dados transformados dos senadores
     * @param legislaturaNumero - Número da legislatura
     */
    async saveSenadoresAtuais(transformedData, legislaturaNumero) {
        logging_1.logger.info(`Salvando dados de ${transformedData.senadores.length} senadores para a legislatura ${legislaturaNumero}`);
        const batchManager = storage_1.firestoreBatch.createBatchManager();
        const timestamp = new Date().toISOString();
        // 1. Documento com metadados da extração
        const { collectionPath: metaCollection, documentId: metaDocId } = parseFirestorePath('congressoNacional/senadoFederal/metadata/senadores');
        batchManager.set(metaCollection, metaDocId, {
            ultimaAtualizacao: timestamp,
            totalRegistros: transformedData.senadores.length,
            legislatura: legislaturaNumero,
            status: 'success'
        });
        // 2. Atualizar estrutura 'atual' para manter referência rápida
        const { collectionPath: atualCollection, documentId: atualDocId } = parseFirestorePath('congressoNacional/senadoFederal/atual/senadores');
        batchManager.set(atualCollection, atualDocId, {
            timestamp: timestamp,
            legislatura: legislaturaNumero,
            total: transformedData.senadores.length,
            atualizadoEm: timestamp,
            tipo: 'senadores',
            descricao: 'Lista de senadores em exercício'
        });
        // 3. Salvar cada senador
        for (const senador of transformedData.senadores) {
            // Adiciona timestamp e legislatura aos dados
            const senadorData = {
                ...senador,
                atualizadoEm: timestamp,
                legislatura: legislaturaNumero
            };
            // Referência para a estrutura de legislatura
            const senadorLegPath = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/senadores/${senador.codigo}`;
            const { collectionPath: senadorLegCollection, documentId: senadorLegDocId } = parseFirestorePath(senadorLegPath);
            // Referência para a estrutura 'atual'
            const senadorAtualPath = `congressoNacional/senadoFederal/atual/senadores/itens/${senador.codigo}`;
            const { collectionPath: senadorAtualCollection, documentId: senadorAtualDocId } = parseFirestorePath(senadorAtualPath);
            // Salvar nas duas coleções
            batchManager.set(senadorLegCollection, senadorLegDocId, senadorData);
            batchManager.set(senadorAtualCollection, senadorAtualDocId, senadorData);
        }
        // Executar todas as operações como uma transação
        await batchManager.commitAndReset();
        logging_1.logger.info(`${transformedData.senadores.length} senadores salvos no Firestore para a legislatura ${legislaturaNumero}`);
        return {
            timestamp,
            totalSalvos: transformedData.senadores.length,
            legislatura: legislaturaNumero,
            status: 'success'
        };
    }
    /**
     * Salva dados históricos de senadores (mantém versões anteriores)
     * @param transformedData - Dados transformados dos senadores
     * @param legislaturaNumero - Número da legislatura
     */
    async saveSenadoresHistorico(transformedData, legislaturaNumero) {
        logging_1.logger.info(`Salvando histórico de senadores da legislatura ${legislaturaNumero} no Firestore`);
        const timestamp = new Date().toISOString();
        const batchManager = storage_1.firestoreBatch.createBatchManager();
        const historicPath = `congressoNacional/senadoFederal/historico/senadores/snapshots/${legislaturaNumero}_${timestamp.replace(/[:.]/g, '-')}`;
        const { collectionPath: histCollection, documentId: histDocId } = parseFirestorePath(historicPath);
        batchManager.set(histCollection, histDocId, {
            timestamp,
            legislatura: legislaturaNumero,
            totalSenadores: transformedData.senadores.length,
            senadores: transformedData.senadores
        });
        await batchManager.commitAndReset();
        logging_1.logger.info(`Histórico de senadores salvo no Firestore em ${historicPath}`);
        return {
            timestamp,
            legislatura: legislaturaNumero,
            status: 'success'
        };
    }
}
exports.SenadoresLoader = SenadoresLoader;
// Exporta uma instância do carregador
exports.senadoresLoader = new SenadoresLoader();
//# sourceMappingURL=senadores.js.map