"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materiasLoader = exports.MateriasLoader = void 0;
/**
 * Módulo para carregamento de dados de matérias legislativas no Firestore
 *
 * Este módulo implementa funções para salvar dados transformados de matérias legislativas
 * no Firestore, seguindo a estrutura de coleções do projeto.
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
 * Classe para carregar dados de matérias legislativas no Firestore
 */
class MateriasLoader {
    /**
     * Salva matérias de um senador no Firestore
     * @param materiaData - Matérias transformadas do senador
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @returns Resultado da operação
     */
    async saveMateria(materiaData, legislaturaNumero) {
        try {
            // Verificação de segurança
            if (!materiaData || !materiaData.codigo) {
                logging_1.logger.error('Dados de matéria inválidos para salvamento');
                return {
                    timestamp: new Date().toISOString(),
                    codigo: 'desconhecido',
                    status: 'error'
                };
            }
            logging_1.logger.info(`Salvando matérias do senador ${materiaData.senador.nome} (${materiaData.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
            const timestamp = new Date().toISOString();
            // Criar o batch manager para operações em lote
            const batchManager = storage_1.firestoreBatch.createBatchManager();
            // Preparar o documento de matéria que conterá todas as categorias
            const materiaDoc = {
                codigo: materiaData.codigo,
                senador: materiaData.senador,
                timestamp: timestamp,
                atualizadoEm: timestamp,
                estatisticasAutorias: materiaData.estatisticasAutorias || {},
                // Categorias de autorias (sem redundância)
                autoriasIndividuais: materiaData.autoriasIndividuais || [],
                coautorias: materiaData.coautorias || [],
                autoriasColetivas: materiaData.autoriasColetivas || [],
                // Relatorias
                relatorias: materiaData.relatorias || [],
                // Contadores para facilitar consultas
                totalAutoriasIndividuais: materiaData.autoriasIndividuais?.length || 0,
                totalCoautorias: materiaData.coautorias?.length || 0,
                totalAutoriasColetivas: materiaData.autoriasColetivas?.length || 0,
                totalRelatorias: materiaData.relatorias?.length || 0
            };
            // Salvar no caminho correto: materia (irmã da coleção discursos)
            const materiaRef = `congressoNacional/senadoFederal/materia/${materiaData.codigo}`;
            const { collectionPath, documentId } = parseFirestorePath(materiaRef);
            // Log para informar o que está sendo salvo
            logging_1.logger.info(`Salvando matéria para o senador ${materiaData.codigo} com:`);
            logging_1.logger.info(`- ${materiaDoc.totalAutoriasIndividuais} autorias individuais`);
            logging_1.logger.info(`- ${materiaDoc.totalCoautorias} coautorias`);
            logging_1.logger.info(`- ${materiaDoc.totalAutoriasColetivas} autorias coletivas`);
            logging_1.logger.info(`- ${materiaDoc.totalRelatorias} relatorias`);
            // Salvar o documento completo
            batchManager.set(collectionPath, documentId, materiaDoc);
            // Commit das operações
            await batchManager.commitAndReset();
            logging_1.logger.info(`Matérias do senador ${materiaData.codigo} salvas com sucesso`);
            return {
                timestamp,
                codigo: materiaData.codigo,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar matérias do senador ${materiaData.codigo}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                codigo: materiaData.codigo,
                status: 'error'
            };
        }
    }
    /**
     * Salva múltiplas matérias no Firestore
     * @param materias - Array de matérias transformadas
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @returns Resultado da operação
     */
    async saveMultiplasMaterias(materias, legislaturaNumero) {
        try {
            logging_1.logger.info(`Salvando ${materias.length} matérias de senadores ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
            const timestamp = new Date().toISOString();
            let sucessos = 0;
            let falhas = 0;
            // Processar em lotes para evitar limites do Firestore
            const tamanhoBatch = 100;
            const totalLotes = Math.ceil(materias.length / tamanhoBatch);
            for (let indice = 0; indice < totalLotes; indice++) {
                logging_1.logger.info(`Processando lote ${indice + 1}/${totalLotes}`);
                // Obter lote atual
                const inicio = indice * tamanhoBatch;
                const fim = Math.min(inicio + tamanhoBatch, materias.length);
                const lote = materias.slice(inicio, fim);
                // Criar batch manager para o lote
                const batchManager = storage_1.firestoreBatch.createBatchManager();
                // Salvar cada matéria no lote
                for (const materia of lote) {
                    try {
                        // Verificar se a matéria é válida
                        if (!materia || !materia.codigo) {
                            logging_1.logger.warn(`Matéria inválida encontrada no lote ${indice + 1}, pulando...`);
                            falhas++;
                            continue;
                        }
                        // Preparar o documento de matéria que conterá todas as categorias
                        const materiaDoc = {
                            codigo: materia.codigo,
                            senador: materia.senador,
                            timestamp: timestamp,
                            atualizadoEm: timestamp,
                            estatisticasAutorias: materia.estatisticasAutorias || {},
                            // Categorias de autorias (sem redundância)
                            autoriasIndividuais: materia.autoriasIndividuais || [],
                            coautorias: materia.coautorias || [],
                            autoriasColetivas: materia.autoriasColetivas || [],
                            // Relatorias
                            relatorias: materia.relatorias || [],
                            // Contadores para facilitar consultas
                            totalAutoriasIndividuais: materia.autoriasIndividuais?.length || 0,
                            totalCoautorias: materia.coautorias?.length || 0,
                            totalAutoriasColetivas: materia.autoriasColetivas?.length || 0,
                            totalRelatorias: materia.relatorias?.length || 0
                        };
                        // Salvar no caminho correto: materia (irmã da coleção discursos)
                        const materiaRef = `congressoNacional/senadoFederal/materia/${materia.codigo}`;
                        const { collectionPath, documentId } = parseFirestorePath(materiaRef);
                        // Log para informar o que está sendo salvo
                        logging_1.logger.info(`Salvando matéria para o senador ${materia.codigo} com:`);
                        logging_1.logger.info(`- ${materiaDoc.totalAutoriasIndividuais} autorias individuais`);
                        logging_1.logger.info(`- ${materiaDoc.totalCoautorias} coautorias`);
                        logging_1.logger.info(`- ${materiaDoc.totalAutoriasColetivas} autorias coletivas`);
                        logging_1.logger.info(`- ${materiaDoc.totalRelatorias} relatorias`);
                        // Salvar o documento completo
                        batchManager.set(collectionPath, documentId, materiaDoc);
                        sucessos++;
                    }
                    catch (error) {
                        logging_1.logger.warn(`Erro ao processar matérias do senador ${materia?.codigo || 'desconhecido'} no lote ${indice + 1}: ${error.message}`);
                        falhas++;
                    }
                }
                // Commit do lote
                await batchManager.commitAndReset();
                // Mostrar progresso
                logging_1.logger.info(`Progresso: ${Math.min((indice + 1) * tamanhoBatch, materias.length)}/${materias.length} matérias`);
                // Pausa entre lotes para não sobrecarregar o Firestore
                if (indice < totalLotes - 1) {
                    logging_1.logger.info(`Aguardando 1 segundo antes de processar o próximo lote...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            logging_1.logger.info(`Carregamento de matérias concluído: ${sucessos} salvos com sucesso, ${falhas} falhas`);
            return {
                timestamp,
                total: materias.length,
                sucessos,
                falhas,
                status: falhas === 0 ? 'success' : falhas < materias.length ? 'partial' : 'error'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar múltiplas matérias: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                total: materias.length,
                sucessos: 0,
                falhas: materias.length,
                status: 'error'
            };
        }
    }
}
exports.MateriasLoader = MateriasLoader;
// Instância singleton para uso em toda a aplicação
exports.materiasLoader = new MateriasLoader();
//# sourceMappingURL=materias.js.map