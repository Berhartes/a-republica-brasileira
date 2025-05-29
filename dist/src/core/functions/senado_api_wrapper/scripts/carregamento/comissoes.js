"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comissaoLoader = exports.ComissaoLoader = void 0;
/**
 * Carregador para dados de Comissões do Senado
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
 * Classe para carregamento de dados de comissões do Senado no Firestore
 */
class ComissaoLoader {
    constructor() {
        // Caminhos de coleção no Firestore (estrutura hierárquica)
        this.BASE_PATH = 'congressoNacional/senadoFederal';
        this.COLECAO_COMISSOES_ATUAL = `congressoNacional/senadoFederal/atual/comissoes/itens`;
        this.COLECAO_COMISSOES_LEGISLATURA = (legislatura) => `congressoNacional/senadoFederal/legislaturas/${legislatura}/comissoes`;
        this.COLECAO_METADATA = `congressoNacional/senadoFederal/metadata/comissoes`;
        this.COLECAO_INDICES = `congressoNacional/senadoFederal/indices`;
        this.COLECAO_REFERENCIAS = `congressoNacional/senadoFederal/referencias`;
        this.COLECAO_HISTORICO = 'comissoes_historico';
    }
    /**
     * Salva as comissões transformadas no Firestore
     */
    async saveComissoes(dados, legislaturaAtual) {
        // Calcular metadados para o resultado
        const metadados = {
            tipoComissoes: {},
            casas: { 'SF': 0, 'CN': 0 },
            comissoesAtivas: 0,
            comissoesInativas: 0
        };
        // Contar comissões por tipo e calcular totais
        let totalComissoes = 0;
        // Contar comissões do Senado
        Object.entries(dados.comissoes.senado).forEach(([tipo, comissoes]) => {
            if (!metadados.tipoComissoes[tipo]) {
                metadados.tipoComissoes[tipo] = 0;
            }
            metadados.tipoComissoes[tipo] += comissoes.length;
            metadados.casas['SF'] += comissoes.length;
            totalComissoes += comissoes.length;
            // Contar ativas/inativas
            comissoes.forEach(comissao => {
                if (comissao.ativa) {
                    metadados.comissoesAtivas++;
                }
                else {
                    metadados.comissoesInativas++;
                }
            });
        });
        // Contar comissões do Congresso
        Object.entries(dados.comissoes.congresso).forEach(([tipo, comissoes]) => {
            if (!metadados.tipoComissoes[tipo]) {
                metadados.tipoComissoes[tipo] = 0;
            }
            metadados.tipoComissoes[tipo] += comissoes.length;
            metadados.casas['CN'] += comissoes.length;
            totalComissoes += comissoes.length;
            // Contar ativas/inativas
            comissoes.forEach(comissao => {
                if (comissao.ativa) {
                    metadados.comissoesAtivas++;
                }
                else {
                    metadados.comissoesInativas++;
                }
            });
        });
        logging_1.logger.info(`Iniciando carregamento de ${totalComissoes} comissões no Firestore`);
        const resultado = {
            timestamp: new Date().toISOString(),
            totalComissoes: totalComissoes,
            totalSalvos: 0,
            totalAtualizados: 0,
            totalErros: 0,
            metadados: metadados
        };
        try {
            if (totalComissoes === 0) {
                logging_1.logger.warn('Nenhuma comissão para carregar');
                return resultado;
            }
            // Processar comissões do Senado
            for (const [tipo, comissoes] of Object.entries(dados.comissoes.senado)) {
                for (const comissao of comissoes) {
                    try {
                        const comissaoId = String(comissao.codigo);
                        // Adicionar informação da legislatura
                        const comissaoComLegislatura = {
                            ...comissao,
                            legislaturaReferencia: legislaturaAtual
                        };
                        // Usar batch manager para salvar
                        const batchManager = storage_1.firestoreBatch.createBatchManager();
                        // Salvar na estrutura atual
                        const { collectionPath: atualCollection, documentId: atualDocId } = parseFirestorePath(`${this.COLECAO_COMISSOES_ATUAL}/${comissaoId}`);
                        batchManager.set(atualCollection, atualDocId, comissaoComLegislatura);
                        // Salvar na estrutura de legislatura
                        const { collectionPath: legCollection, documentId: legDocId } = parseFirestorePath(`${this.COLECAO_COMISSOES_LEGISLATURA(legislaturaAtual)}/${comissaoId}`);
                        batchManager.set(legCollection, legDocId, comissaoComLegislatura);
                        // Commit das operações
                        await batchManager.commitAndReset();
                        resultado.totalSalvos++;
                        logging_1.logger.info(`Nova comissão salva: ${comissao.sigla} (${comissaoId})`);
                    }
                    catch (error) {
                        resultado.totalErros++;
                        logging_1.logger.error(`Erro ao salvar comissão ${comissao.sigla || comissao.codigo}:`, error);
                    }
                }
            }
            // Processar comissões do Congresso
            for (const [tipo, comissoes] of Object.entries(dados.comissoes.congresso)) {
                for (const comissao of comissoes) {
                    try {
                        const comissaoId = String(comissao.codigo);
                        // Adicionar informação da legislatura
                        const comissaoComLegislatura = {
                            ...comissao,
                            legislaturaReferencia: legislaturaAtual
                        };
                        // Usar batch manager para salvar
                        const batchManager = storage_1.firestoreBatch.createBatchManager();
                        // Salvar na estrutura atual
                        const { collectionPath: atualCollection, documentId: atualDocId } = parseFirestorePath(`${this.COLECAO_COMISSOES_ATUAL}/${comissaoId}`);
                        batchManager.set(atualCollection, atualDocId, comissaoComLegislatura);
                        // Salvar na estrutura de legislatura
                        const { collectionPath: legCollection, documentId: legDocId } = parseFirestorePath(`${this.COLECAO_COMISSOES_LEGISLATURA(legislaturaAtual)}/${comissaoId}`);
                        batchManager.set(legCollection, legDocId, comissaoComLegislatura);
                        // Commit das operações
                        await batchManager.commitAndReset();
                        resultado.totalSalvos++;
                        logging_1.logger.info(`Nova comissão salva: ${comissao.sigla} (${comissaoId})`);
                    }
                    catch (error) {
                        resultado.totalErros++;
                        logging_1.logger.error(`Erro ao salvar comissão ${comissao.sigla || comissao.codigo}:`, error);
                    }
                }
            }
            // Salvar os índices na nova estrutura
            try {
                const batchManager = storage_1.firestoreBatch.createBatchManager();
                // Salvar índice por código
                const { collectionPath: codCollection, documentId: codDocId } = parseFirestorePath(`${this.COLECAO_INDICES}/comissoes_porCodigo`);
                batchManager.set(codCollection, codDocId, {
                    dados: dados.indices.porCodigo,
                    atualizadoEm: new Date().toISOString(),
                    legislatura: legislaturaAtual
                });
                // Salvar índice por parlamentar (pode ser grande, então separar se necessário)
                const { collectionPath: parlCollection, documentId: parlDocId } = parseFirestorePath(`${this.COLECAO_INDICES}/comissoes_porParlamentar`);
                batchManager.set(parlCollection, parlDocId, {
                    dados: dados.indices.porParlamentar,
                    atualizadoEm: new Date().toISOString(),
                    legislatura: legislaturaAtual
                });
                // Salvar metadados
                const { collectionPath: metaCollection, documentId: metaDocId } = parseFirestorePath(`${this.COLECAO_METADATA}/info`);
                batchManager.set(metaCollection, metaDocId, {
                    ultimaAtualizacao: new Date().toISOString(),
                    totalComissoes: totalComissoes,
                    legislatura: legislaturaAtual,
                    metadados: metadados
                });
                // Commit das operações
                await batchManager.commitAndReset();
                logging_1.logger.info(`Índices e metadados salvos com sucesso`);
            }
            catch (indexError) {
                const errorMessage = indexError instanceof Error ? indexError.message : 'Erro desconhecido';
                logging_1.logger.error(`Erro ao salvar índices: ${errorMessage}`, indexError);
            }
            // Salvar referências (tipos de comissões)
            if (dados.referencias && dados.referencias.tipos) {
                try {
                    const batchManager = storage_1.firestoreBatch.createBatchManager();
                    const { collectionPath: refCollection, documentId: refDocId } = parseFirestorePath(`${this.COLECAO_REFERENCIAS}/comissoes_tipos`);
                    batchManager.set(refCollection, refDocId, {
                        dados: dados.referencias.tipos,
                        atualizadoEm: new Date().toISOString(),
                        legislatura: legislaturaAtual
                    });
                    await batchManager.commitAndReset();
                    logging_1.logger.info(`Referências de tipos salvas com sucesso`);
                }
                catch (refError) {
                    const errorMessage = refError instanceof Error ? refError.message : 'Erro desconhecido';
                    logging_1.logger.error(`Erro ao salvar referências: ${errorMessage}`, refError);
                }
            }
            logging_1.logger.info(`Carregamento concluído: ${resultado.totalSalvos} novas, ${resultado.totalAtualizados} atualizadas, ${resultado.totalErros} erros`);
            return resultado;
        }
        catch (error) {
            logging_1.logger.error('Erro durante o carregamento de comissões:', error);
            throw error;
        }
    }
    /**
     * Salva o histórico de comissões no Firestore
     */
    async saveComissoesHistorico(dados, legislaturaAtual) {
        logging_1.logger.info('Salvando histórico de comissões');
        try {
            // Criar registro histórico com timestamp para identificação
            const timestamp = new Date().toISOString();
            const historicoId = `comissoes_${timestamp.replace(/[:.]/g, '-')}`;
            // Consolidar comissões para o histórico
            const comissoesConsolidadas = [];
            // Consolidar comissões do Senado
            Object.entries(dados.comissoes.senado).forEach(([tipo, comissoes]) => {
                comissoes.forEach(comissao => {
                    // Extrair o valor do tipo adequado para consolidação
                    let tipoConsolidado = tipo;
                    // Se a comissão já tiver um tipo como objeto, usar esse valor
                    if (typeof comissao.tipo === 'object' && comissao.tipo?.nome) {
                        tipoConsolidado = comissao.tipo;
                    }
                    comissoesConsolidadas.push({
                        codigo: comissao.codigo,
                        sigla: comissao.sigla,
                        nome: comissao.nome,
                        casa: comissao.casa,
                        ativa: comissao.ativa,
                        tipo: tipoConsolidado
                    });
                });
            });
            // Consolidar comissões do Congresso
            Object.entries(dados.comissoes.congresso).forEach(([tipo, comissoes]) => {
                comissoes.forEach(comissao => {
                    // Extrair o valor do tipo adequado para consolidação
                    let tipoConsolidado = tipo;
                    // Se a comissão já tiver um tipo como objeto, usar esse valor
                    if (typeof comissao.tipo === 'object' && comissao.tipo?.nome) {
                        tipoConsolidado = comissao.tipo;
                    }
                    comissoesConsolidadas.push({
                        codigo: comissao.codigo,
                        sigla: comissao.sigla,
                        nome: comissao.nome,
                        casa: comissao.casa,
                        ativa: comissao.ativa,
                        tipo: tipoConsolidado
                    });
                });
            });
            // Calcular metadados para o histórico
            const metadados = {
                tipoComissoes: {},
                casas: { 'SF': 0, 'CN': 0 },
                comissoesAtivas: 0,
                comissoesInativas: 0
            };
            // Calcular estatísticas
            comissoesConsolidadas.forEach(comissao => {
                // Contagem por tipo
                let tipoChave;
                if (typeof comissao.tipo === 'string') {
                    tipoChave = comissao.tipo;
                }
                else if (comissao.tipo && typeof comissao.tipo === 'object') {
                    tipoChave = comissao.tipo.nome || 'Desconhecido';
                }
                else {
                    tipoChave = 'Desconhecido';
                }
                if (!metadados.tipoComissoes[tipoChave]) {
                    metadados.tipoComissoes[tipoChave] = 0;
                }
                metadados.tipoComissoes[tipoChave]++;
                // Contagem por casa
                metadados.casas[comissao.casa]++;
                // Contagem de ativas/inativas
                if (comissao.ativa) {
                    metadados.comissoesAtivas++;
                }
                else {
                    metadados.comissoesInativas++;
                }
            });
            const dadosHistorico = {
                timestamp,
                legislatura: legislaturaAtual,
                total: comissoesConsolidadas.length,
                comissoes: comissoesConsolidadas,
                metadados: metadados,
                indices: {
                    totalPorCodigo: Object.keys(dados.indices.porCodigo).length,
                    totalPorParlamentar: Object.keys(dados.indices.porParlamentar).length
                }
            };
            const batchManager = storage_1.firestoreBatch.createBatchManager();
            const { collectionPath: histCollection, documentId: histDocId } = parseFirestorePath(`${this.COLECAO_HISTORICO}/${historicoId}`);
            batchManager.set(histCollection, histDocId, dadosHistorico);
            await batchManager.commitAndReset();
            logging_1.logger.info(`Histórico de comissões salvo com ID: ${historicoId}`);
        }
        catch (error) {
            logging_1.logger.error('Erro ao salvar histórico de comissões:', error);
            throw error;
        }
    }
    /**
     * Verifica se houve mudanças relevantes nos dados da comissão
     */
    verificarMudancas(existente, novo) {
        // Campos a ignorar na comparação (atualizadoEm sempre muda)
        const camposParaIgnorar = ['atualizadoEm'];
        // Lista de campos para verificar mudanças estruturais
        const camposEstruturais = [
            'sigla', 'nome', 'ativa', 'tipo', 'casa',
            'dataCriacao', 'dataExtincao', 'dataInstalacao'
        ];
        // Verificar mudanças nos campos estruturais
        for (const campo of camposEstruturais) {
            if (campo === 'tipo') {
                // Tratar o campo tipo de forma especial, pois pode ser string ou objeto
                const tipoExistente = existente.tipo;
                const tipoNovo = novo.tipo;
                if (typeof tipoExistente !== typeof tipoNovo) {
                    return true; // Tipos diferentes (string vs objeto)
                }
                if (typeof tipoExistente === 'string' && typeof tipoNovo === 'string') {
                    if (tipoExistente !== tipoNovo)
                        return true;
                }
                else if (typeof tipoExistente === 'object' && typeof tipoNovo === 'object') {
                    // Comparar objetos
                    if (tipoExistente?.nome !== tipoNovo?.nome || tipoExistente?.sigla !== tipoNovo?.sigla) {
                        return true;
                    }
                }
            }
            else if (existente[campo] !== novo[campo]) {
                return true;
            }
        }
        // Verificar mudanças na composição
        const membroExistentes = existente.composicao?.membros || [];
        const membrosNovos = novo.composicao?.membros || [];
        // Se o número de membros mudou, houve mudança
        if (membroExistentes.length !== membrosNovos.length) {
            return true;
        }
        // Funções para comparar membros por código
        const membrosPorCodigo = (membros) => {
            const mapa = {};
            membros.forEach(m => {
                mapa[String(m.codigo)] = m;
            });
            return mapa;
        };
        // Mapas de membros para comparação eficiente
        const mapaExistentes = membrosPorCodigo(membroExistentes);
        const mapaNovos = membrosPorCodigo(membrosNovos);
        // Verificar mudanças em membros
        const todosCodigos = new Set([
            ...Object.keys(mapaExistentes),
            ...Object.keys(mapaNovos)
        ]);
        for (const codigo of todosCodigos) {
            const membroExistente = mapaExistentes[codigo];
            const membroNovo = mapaNovos[codigo];
            // Se um membro existe em um e não no outro, houve mudança
            if (!membroExistente || !membroNovo) {
                return true;
            }
            // Verificar campos relevantes
            if (membroExistente.participacao !== membroNovo.participacao ||
                membroExistente.cargo !== membroNovo.cargo ||
                membroExistente.dataFim !== membroNovo.dataFim) {
                return true;
            }
        }
        // Se chegou até aqui, não houve mudanças relevantes
        return false;
    }
}
exports.ComissaoLoader = ComissaoLoader;
// Exporta uma instância do carregador
exports.comissaoLoader = new ComissaoLoader();
//# sourceMappingURL=comissoes.js.map