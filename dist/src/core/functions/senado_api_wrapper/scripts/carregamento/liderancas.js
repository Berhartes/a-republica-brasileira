"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liderancaLoader = exports.LiderancaLoader = void 0;
/**
 * Carregador de lideranças para o Firestore
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
 * Classe para carregar dados de lideranças no Firestore
 */
class LiderancaLoader {
    /**
     * Salva dados de lideranças no Firestore
     * @param transformedData - Dados transformados das lideranças
     * @param legislaturaNumero - Número da legislatura atual
     */
    async saveLiderancas(transformedData, legislaturaNumero) {
        logging_1.logger.info(`Salvando dados de lideranças na legislatura ${legislaturaNumero}`);
        logging_1.logger.info(`Total de lideranças a salvar: ${transformedData.liderancas.total}`);
        logging_1.logger.info(`Total de tipos de liderança a salvar: ${transformedData.referencias.tiposLideranca.length}`);
        logging_1.logger.info(`Total de tipos de unidade a salvar: ${transformedData.referencias.tiposUnidade.length}`);
        logging_1.logger.info(`Total de tipos de cargo a salvar: ${transformedData.referencias.tiposCargo.length}`);
        const timestamp = new Date().toISOString();
        try {
            // Documento com metadados da extração
            logging_1.logger.info('Salvando metadados de lideranças');
            const batchManager = storage_1.firestoreBatch.createBatchManager();
            const { collectionPath: metaCollection, documentId: metaDocId } = parseFirestorePath('congressoNacional/senadoFederal/metadata/liderancas');
            batchManager.set(metaCollection, metaDocId, {
                ultimaAtualizacao: timestamp,
                totalLiderancas: transformedData.liderancas.total,
                totalTiposLideranca: transformedData.referencias.tiposLideranca.length,
                totalTiposUnidade: transformedData.referencias.tiposUnidade.length,
                totalTiposCargo: transformedData.referencias.tiposCargo.length,
                legislatura: legislaturaNumero,
                status: 'success'
            });
            await batchManager.commitAndReset();
            logging_1.logger.info('Metadados de lideranças salvos com sucesso');
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar metadados de lideranças: ${error.message}`);
        }
        // Salvar lideranças usando batch
        logging_1.logger.info(`Salvando ${transformedData.liderancas.itens.length} lideranças`);
        const batchManager = storage_1.firestoreBatch.createBatchManager();
        for (const lideranca of transformedData.liderancas.itens) {
            const liderancaData = {
                ...lideranca,
                ultimaAtualizacao: timestamp,
                legislatura: legislaturaNumero
            };
            // Salvar na estrutura por legislatura
            const liderancaRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/liderancas/${lideranca.codigo}`;
            const { collectionPath: legCollection, documentId: legDocId } = parseFirestorePath(liderancaRef);
            batchManager.set(legCollection, legDocId, liderancaData);
            // Salvar na estrutura "atual" (acesso rápido)
            const liderancaAtualRef = `congressoNacional/senadoFederal/atual/liderancas/itens/${lideranca.codigo}`;
            const { collectionPath: atualCollection, documentId: atualDocId } = parseFirestorePath(liderancaAtualRef);
            batchManager.set(atualCollection, atualDocId, liderancaData);
        }
        await batchManager.commitAndReset();
        const liderancasSalvas = transformedData.liderancas.itens.length;
        logging_1.logger.info(`Total de lideranças salvas: ${liderancasSalvas}/${transformedData.liderancas.itens.length}`);
        // Salvar referências em lote
        logging_1.logger.info('Salvando referências (tipos de liderança, unidade e cargo)');
        const batchReferencias = storage_1.firestoreBatch.createBatchManager();
        // Tipos de liderança
        for (const tipo of transformedData.referencias.tiposLideranca) {
            const { collectionPath: tipoLidCollection, documentId: tipoLidDocId } = parseFirestorePath(`congressoNacional/senadoFederal/referencias/tiposLideranca/itens/${tipo.codigo}`);
            batchReferencias.set(tipoLidCollection, tipoLidDocId, {
                ...tipo,
                ultimaAtualizacao: timestamp
            });
        }
        // Tipos de unidade
        for (const tipo of transformedData.referencias.tiposUnidade) {
            const { collectionPath: tipoUniCollection, documentId: tipoUniDocId } = parseFirestorePath(`congressoNacional/senadoFederal/referencias/tiposUnidade/itens/${tipo.codigo}`);
            batchReferencias.set(tipoUniCollection, tipoUniDocId, {
                ...tipo,
                ultimaAtualizacao: timestamp
            });
        }
        // Tipos de cargo
        for (const tipo of transformedData.referencias.tiposCargo) {
            const { collectionPath: tipoCargoCollection, documentId: tipoCargoDocId } = parseFirestorePath(`congressoNacional/senadoFederal/referencias/tiposCargo/itens/${tipo.codigo}`);
            batchReferencias.set(tipoCargoCollection, tipoCargoDocId, {
                ...tipo,
                ultimaAtualizacao: timestamp
            });
        }
        await batchReferencias.commitAndReset();
        const tiposLiderancaSalvos = transformedData.referencias.tiposLideranca.length;
        const tiposUnidadeSalvos = transformedData.referencias.tiposUnidade.length;
        const tiposCargosalvos = transformedData.referencias.tiposCargo.length;
        logging_1.logger.info(`Referências salvas: ${tiposLiderancaSalvos} tipos de liderança, ${tiposUnidadeSalvos} tipos de unidade, ${tiposCargosalvos} tipos de cargo`);
        logging_1.logger.info(`${transformedData.liderancas.total} lideranças salvas no Firestore para a legislatura ${legislaturaNumero}`);
        return {
            timestamp,
            totalLiderancas: transformedData.liderancas.total,
            totalTiposLideranca: transformedData.referencias.tiposLideranca.length,
            totalTiposUnidade: transformedData.referencias.tiposUnidade.length,
            totalTiposCargo: transformedData.referencias.tiposCargo.length,
            legislatura: legislaturaNumero,
            status: 'success'
        };
    }
    /**
     * Salva dados históricos de lideranças (mantém versões anteriores)
     * @param transformedData - Dados transformados das lideranças
     * @param legislaturaNumero - Número da legislatura
     */
    async saveLiderancasHistorico(transformedData, legislaturaNumero) {
        logging_1.logger.info(`Salvando histórico de lideranças da legislatura ${legislaturaNumero} no Firestore`);
        const timestamp = new Date().toISOString();
        const historicoId = `${legislaturaNumero}_${timestamp.replace(/[:.]/g, '-')}`;
        const dadosHistorico = {
            timestamp,
            legislatura: legislaturaNumero,
            totalLiderancas: transformedData.liderancas.total,
            dados: transformedData
        };
        const batchManager = storage_1.firestoreBatch.createBatchManager();
        const { collectionPath: histCollection, documentId: histDocId } = parseFirestorePath(`congressoNacional/senadoFederal/historico/liderancas/snapshots/${historicoId}`);
        batchManager.set(histCollection, histDocId, dadosHistorico);
        await batchManager.commitAndReset();
        logging_1.logger.info(`Histórico de lideranças salvo com ID: ${historicoId}`);
        return {
            timestamp,
            legislatura: legislaturaNumero,
            status: 'success'
        };
    }
}
exports.LiderancaLoader = LiderancaLoader;
// Exporta uma instância do carregador
exports.liderancaLoader = new LiderancaLoader();
//# sourceMappingURL=liderancas.js.map