"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discursosLoader = exports.DiscursosLoader = void 0;
/**
 * Módulo de carregamento de discursos de senadores para o Firestore
 * Este módulo é especializado na persistência de discursos e apartes de senadores
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
 * Classe para carregar dados de discursos de senadores no Firestore
 */
class DiscursosLoader {
    /**
     * Salva discursos de um senador no Firestore
     * @param discursoData - Discursos transformados do senador
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @param apenasDiscursos - Se true, atualiza apenas os discursos, mantendo os apartes existentes
     * @param apenasApartes - Se true, atualiza apenas os apartes, mantendo os discursos existentes
     * @returns Resultado da operação
     */
    async saveDiscurso(discursoData, legislaturaNumero, apenasDiscursos = false, apenasApartes = false) {
        try {
            // Verificação de segurança
            if (!discursoData || !discursoData.codigo) {
                logging_1.logger.error('Dados de discurso inválidos para salvamento');
                return {
                    timestamp: new Date().toISOString(),
                    codigo: 'desconhecido',
                    status: 'error'
                };
            }
            const modoAtualizacao = apenasDiscursos
                ? "apenas discursos"
                : apenasApartes
                    ? "apenas apartes"
                    : "discursos e apartes";
            logging_1.logger.info(`Salvando ${modoAtualizacao} do senador ${discursoData.senador.nome} (${discursoData.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
            const timestamp = new Date().toISOString();
            // 1. Salvar no firestore na coleção de discursos
            const discursoRef = `congressoNacional/senadoFederal/discursos/${discursoData.codigo}`;
            const batchManager = storage_1.firestoreBatch.createBatchManager();
            // Preparar os dados básicos para salvar
            let dadosParaSalvar = {
                codigo: discursoData.codigo,
                senador: discursoData.senador,
                atualizadoEm: timestamp
            };
            // Adicionar apenas os dados que estamos processando
            if (apenasDiscursos) {
                // Adicionar apenas discursos
                dadosParaSalvar.discursos = discursoData.discursos;
                logging_1.logger.info(`Adicionando/atualizando apenas discursos para o senador ${discursoData.codigo}, preservando outros dados existentes`);
            }
            else if (apenasApartes) {
                // Adicionar apenas apartes
                dadosParaSalvar.apartes = discursoData.apartes;
                logging_1.logger.info(`Adicionando/atualizando apenas apartes para o senador ${discursoData.codigo}, preservando outros dados existentes`);
            }
            else {
                // Adicionar ambos
                dadosParaSalvar.discursos = discursoData.discursos;
                dadosParaSalvar.apartes = discursoData.apartes;
                logging_1.logger.info(`Atualizando discursos e apartes para o senador ${discursoData.codigo}`);
            }
            // Salvar no Firestore com merge: true para preservar outros campos existentes
            const { collectionPath, documentId } = parseFirestorePath(discursoRef);
            batchManager.set(collectionPath, documentId, dadosParaSalvar, { merge: true });
            // Commit das operações
            await batchManager.commitAndReset();
            logging_1.logger.info(`${modoAtualizacao} do senador ${discursoData.codigo} salvos com sucesso`);
            return {
                timestamp,
                codigo: discursoData.codigo,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar discursos do senador ${discursoData?.codigo || 'desconhecido'}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                codigo: discursoData?.codigo || 'desconhecido',
                status: 'error'
            };
        }
    }
    /**
     * Salva múltiplos discursos de senadores em uma única operação
     * @param discursos - Lista de discursos transformados
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @param apenasDiscursos - Se true, atualiza apenas os discursos, mantendo os apartes existentes
     * @param apenasApartes - Se true, atualiza apenas os apartes, mantendo os discursos existentes
     * @returns Resultado da operação
     */
    async saveMultiplosDiscursos(discursos, legislaturaNumero, apenasDiscursos = false, apenasApartes = false) {
        try {
            const modoAtualizacao = apenasDiscursos
                ? "apenas discursos"
                : apenasApartes
                    ? "apenas apartes"
                    : "discursos e apartes";
            logging_1.logger.info(`Salvando ${modoAtualizacao} de ${discursos.length} senadores ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
            const timestamp = new Date().toISOString();
            let sucessos = 0;
            let falhas = 0;
            // Processar em lotes para melhor performance
            const tamanhoLote = 10;
            const lotes = [];
            for (let i = 0; i < discursos.length; i += tamanhoLote) {
                lotes.push(discursos.slice(i, i + tamanhoLote));
            }
            for (const [indice, lote] of lotes.entries()) {
                logging_1.logger.info(`Processando lote ${indice + 1}/${lotes.length} (${lote.length} senadores)`);
                const batchManager = storage_1.firestoreBatch.createBatchManager();
                // Salvar cada discurso no lote
                for (const discurso of lote) {
                    try {
                        // Verificar se o discurso é válido
                        if (!discurso || !discurso.codigo) {
                            logging_1.logger.warn(`Discurso inválido encontrado no lote ${indice + 1}, pulando...`);
                            falhas++;
                            continue;
                        }
                        // 1. Preparar o caminho para o documento no Firestore
                        const discursoRef = `congressoNacional/senadoFederal/discursos/${discurso.codigo}`;
                        // 2. Preparar os dados básicos para salvar
                        let dadosParaSalvar = {
                            codigo: discurso.codigo,
                            senador: discurso.senador,
                            atualizadoEm: timestamp
                        };
                        // Adicionar apenas os dados que estamos processando
                        if (apenasDiscursos) {
                            // Adicionar apenas discursos
                            dadosParaSalvar.discursos = discurso.discursos;
                            logging_1.logger.info(`Adicionando/atualizando apenas discursos para o senador ${discurso.codigo}, preservando outros dados existentes`);
                        }
                        else if (apenasApartes) {
                            // Adicionar apenas apartes
                            dadosParaSalvar.apartes = discurso.apartes;
                            logging_1.logger.info(`Adicionando/atualizando apenas apartes para o senador ${discurso.codigo}, preservando outros dados existentes`);
                        }
                        else {
                            // Adicionar ambos
                            dadosParaSalvar.discursos = discurso.discursos;
                            dadosParaSalvar.apartes = discurso.apartes;
                            logging_1.logger.info(`Atualizando discursos e apartes para o senador ${discurso.codigo}`);
                        }
                        // 3. Salvar no Firestore com merge: true para preservar outros campos existentes
                        const { collectionPath, documentId } = parseFirestorePath(discursoRef);
                        batchManager.set(collectionPath, documentId, dadosParaSalvar, { merge: true });
                        sucessos++;
                    }
                    catch (error) {
                        logging_1.logger.warn(`Erro ao processar discursos do senador ${discurso?.codigo || 'desconhecido'} no lote ${indice + 1}: ${error.message}`);
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
            logging_1.logger.info(`Salvamento de discursos concluído: ${sucessos} sucessos, ${falhas} falhas`);
            return {
                timestamp,
                total: discursos.length,
                sucessos,
                falhas,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar múltiplos discursos: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                total: discursos.length,
                sucessos: 0,
                falhas: discursos.length,
                status: 'error'
            };
        }
    }
}
exports.DiscursosLoader = DiscursosLoader;
// Instância singleton para uso em toda a aplicação
exports.discursosLoader = new DiscursosLoader();
//# sourceMappingURL=discursos.js.map