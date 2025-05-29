"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesaLoader = exports.MesaLoader = void 0;
/**
 * Carregador de mesas diretoras para o Firestore
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
 * Classe para carregar dados de mesas diretoras no Firestore
 */
class MesaLoader {
    /**
     * Salva dados de mesas no Firestore
     * @param transformedData - Dados transformados das mesas
     * @param legislaturaNumero - Número da legislatura atual
     */
    async saveMesas(transformedData, legislaturaNumero) {
        logging_1.logger.info(`Salvando dados de mesas na legislatura ${legislaturaNumero}`);
        const batchManager = storage_1.firestoreBatch.createBatchManager();
        const timestamp = new Date().toISOString();
        // Documento com metadados da extração
        const { collectionPath: metaCollection, documentId: metaDocId } = parseFirestorePath('congressoNacional/lideranca/metadata/mesas');
        batchManager.set(metaCollection, metaDocId, {
            ultimaAtualizacao: timestamp,
            totalRegistros: transformedData.total,
            legislatura: legislaturaNumero,
            status: 'success'
        });
        // Salva cada mesa como um documento separado
        for (const mesa of transformedData.mesas) {
            // Adiciona timestamp de atualização e legislatura
            const mesaData = {
                ...mesa,
                ultimaAtualizacao: timestamp,
                legislatura: legislaturaNumero
            };
            // Referência para a estrutura por legislatura
            const mesaLegislaturaPath = `congressoNacional/lideranca/legislaturas/${legislaturaNumero}/mesas/${mesa.tipo}`;
            const { collectionPath: legCollection, documentId: legDocId } = parseFirestorePath(mesaLegislaturaPath);
            // Referência para a estrutura "atual" (acesso rápido)
            const mesaAtualPath = `congressoNacional/lideranca/atual/mesas/itens/${mesa.tipo}`;
            const { collectionPath: atualCollection, documentId: atualDocId } = parseFirestorePath(mesaAtualPath);
            // Salva nas duas coleções
            batchManager.set(legCollection, legDocId, mesaData);
            batchManager.set(atualCollection, atualDocId, mesaData);
            // Salvar cada membro como subdocumento para facilitar consultas
            if (mesa.membros && Array.isArray(mesa.membros)) {
                for (const membro of mesa.membros) {
                    if (!membro.codigo)
                        continue;
                    const membroData = {
                        ...membro,
                        mesaTipo: mesa.tipo,
                        ultimaAtualizacao: timestamp,
                        legislatura: legislaturaNumero
                    };
                    // Referência para o membro na estrutura por legislatura
                    const membroLegislaturaPath = `congressoNacional/lideranca/legislaturas/${legislaturaNumero}/mesas/${mesa.tipo}/membros/${membro.codigo || 'sem_codigo'}`;
                    const { collectionPath: membroLegCollection, documentId: membroLegDocId } = parseFirestorePath(membroLegislaturaPath);
                    // Referência para o membro na estrutura "atual"
                    const membroAtualPath = `congressoNacional/lideranca/atual/mesas/itens/${mesa.tipo}/membros/${membro.codigo || 'sem_codigo'}`;
                    const { collectionPath: membroAtualCollection, documentId: membroAtualDocId } = parseFirestorePath(membroAtualPath);
                    // Salvar nas duas coleções
                    batchManager.set(membroLegCollection, membroLegDocId, membroData);
                    batchManager.set(membroAtualCollection, membroAtualDocId, membroData);
                }
            }
        }
        // Executar todas as operações
        await batchManager.commitAndReset();
        logging_1.logger.info(`${transformedData.total} mesas salvas no Firestore para a legislatura ${legislaturaNumero}`);
        return {
            timestamp,
            totalSalvos: transformedData.total,
            legislatura: legislaturaNumero,
            status: 'success'
        };
    }
    /**
     * Salva dados históricos de mesas (mantém versões anteriores)
     * @param transformedData - Dados transformados das mesas
     * @param legislaturaNumero - Número da legislatura
     */
    async saveMesasHistorico(transformedData, legislaturaNumero) {
        logging_1.logger.info(`Salvando histórico de mesas da legislatura ${legislaturaNumero} no Firestore`);
        const timestamp = new Date().toISOString();
        try {
            // Salvar o snapshot completo no histórico usando a nova API
            const historicPath = `congressoNacional/lideranca/historico/mesas/snapshots/${legislaturaNumero}_${timestamp.replace(/[:.]/g, '-')}`;
            const batchManager = storage_1.firestoreBatch.createBatchManager();
            const { collectionPath: histCollection, documentId: histDocId } = parseFirestorePath(historicPath);
            batchManager.set(histCollection, histDocId, {
                timestamp,
                legislatura: legislaturaNumero,
                totalMesas: transformedData.total,
                mesas: transformedData.mesas.map(mesa => ({
                    ...mesa,
                    membros: mesa.membros.map(membro => ({
                        ...membro,
                        historico: true
                    }))
                }))
            });
            await batchManager.commitAndReset();
            logging_1.logger.info(`Histórico de mesas salvo no Firestore em ${historicPath}`);
            return {
                timestamp,
                legislatura: legislaturaNumero,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar histórico de mesas: ${error.message}`, error);
            return {
                timestamp,
                legislatura: legislaturaNumero,
                status: 'error'
            };
        }
    }
}
exports.MesaLoader = MesaLoader;
// Exporta uma instância do carregador
exports.mesaLoader = new MesaLoader();
//# sourceMappingURL=mesas.js.map