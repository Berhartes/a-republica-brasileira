"use strict";
/**
 * Processador especializado para comissões do Senado
 *
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de comissões parlamentares.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComissoesProcessor = void 0;
const etl_processor_1 = require("../core/etl-processor");
const etl_types_1 = require("../types/etl.types");
const comissoes_1 = require("../extracao/comissoes");
const comissoes_2 = require("../transformacao/comissoes");
const comissoes_3 = require("../carregamento/comissoes");
const date_1 = require("../utils/date");
const common_1 = require("../utils/common");
/**
 * Processador de comissões parlamentares
 */
class ComissoesProcessor extends etl_processor_1.ETLProcessor {
    getProcessName() {
        return 'Processador de Comissões Parlamentares';
    }
    async validate() {
        const erros = [];
        const avisos = [];
        // Validar legislatura se especificada
        if (this.context.options.legislatura) {
            const leg = this.context.options.legislatura;
            if (leg < this.context.config.senado.legislatura.min ||
                leg > this.context.config.senado.legislatura.max) {
                erros.push(`Legislatura ${leg} fora do intervalo válido`);
            }
        }
        // Avisar sobre possíveis limitações
        if (!this.context.options.limite) {
            avisos.push('Processando todas as comissões pode demorar. Considere usar --limite para testes');
        }
        return {
            valido: erros.length === 0,
            erros,
            avisos
        };
    }
    async extract() {
        const legislatura = await this.determinarLegislatura();
        this.context.logger.info(`📅 Extraindo comissões da legislatura ${legislatura}`);
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 10, 'Extraindo lista de comissões...');
        // Extrair todos os dados
        const dadosExtraidos = await comissoes_1.comissaoExtractor.extractAll();
        if (!dadosExtraidos.lista || !dadosExtraidos.lista.total) {
            throw new Error('Nenhuma comissão encontrada');
        }
        this.context.logger.info(`✓ ${dadosExtraidos.lista.total} comissões encontradas`);
        // Aplicar limite se especificado
        let comissoes = dadosExtraidos.detalhes || [];
        if (this.context.options.limite && this.context.options.limite > 0) {
            comissoes = comissoes.slice(0, this.context.options.limite);
            this.context.logger.info(`🔍 Limitado a ${comissoes.length} comissões`);
        }
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 50, 'Extraindo composições das comissões...');
        // Extrair composições
        const composicoes = await this.extrairComposicoes(comissoes);
        this.updateExtractionStats(dadosExtraidos.lista.total, comissoes.length, 0);
        return {
            lista: dadosExtraidos.lista,
            detalhes: comissoes,
            composicoes,
            tipos: dadosExtraidos.tipos || [],
            legislatura
        };
    }
    async transform(data) {
        this.context.logger.info('🔄 Transformando comissões...');
        this.emitProgress(etl_types_1.ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados das comissões...');
        // Adaptar os dados para o formato esperado pelo transformador
        const dadosParaTransformar = {
            timestamp: new Date().toISOString(),
            lista: data.lista,
            detalhes: data.detalhes,
            // Ajustar composicoes para ser um array de objetos como esperado por ResultadoExtracao em comissoesTransformer
            composicoes: Array.from(data.composicoes.entries()).map(([codigo, composicao]) => ({
                timestamp: new Date().toISOString(), // Adicionar um timestamp, pode ser o mesmo da extração principal
                codigo,
                composicao
            })),
            tipos: data.tipos
        };
        const dadosTransformados = comissoes_2.comissoesTransformer.transformComissoes(dadosParaTransformar);
        // As composições já são transformadas dentro de comissoesTransformer.transformComissoes
        // e incluídas em cada ComissaoTransformada.
        // A propriedade composicoesTransformadas no TransformedData deste processador pode ser removida ou ajustada.
        // Por enquanto, vamos manter a lógica de estatísticas baseada nos dados transformados.
        const todasComissoes = [
            ...Object.values(dadosTransformados.comissoes.senado).flat(),
            ...Object.values(dadosTransformados.comissoes.congresso).flat()
        ];
        // Calcular estatísticas
        const estatisticas = {
            totalComissoes: dadosTransformados.total,
            totalMembros: todasComissoes.reduce((total, comissao) => total + (comissao.composicao?.membros?.length || 0), 0),
            comissoesPorTipo: {}
        };
        // Contar comissões por tipo
        todasComissoes.forEach(comissao => {
            const tipo = (typeof comissao.tipo === 'string' ? comissao.tipo : comissao.tipo?.nome) || 'Outros';
            estatisticas.comissoesPorTipo[tipo] = (estatisticas.comissoesPorTipo[tipo] || 0) + 1;
        });
        this.updateTransformationStats(data.detalhes.length, dadosTransformados.total, data.detalhes.length - dadosTransformados.total);
        this.context.logger.info(`✓ ${dadosTransformados.total} comissões transformadas`);
        this.context.logger.info(`✓ ${estatisticas.totalMembros} membros transformados`);
        return {
            // Ajustar para retornar um array plano de comissões
            comissoesTransformadas: todasComissoes,
            composicoesTransformadas: new Map(), // Não mais necessário aqui, pois está em cada comissão
            tiposTransformados: dadosTransformados.referencias?.tipos ? Object.values(dadosTransformados.referencias.tipos) : [],
            estatisticas,
            legislatura: data.legislatura
        };
    }
    async load(data) {
        this.emitProgress(etl_types_1.ProcessingStatus.CARREGANDO, 80, 'Salvando comissões...');
        switch (this.context.options.destino) {
            case 'pc':
                return this.salvarNoPC(data);
            case 'emulator':
                process.env.FIRESTORE_EMULATOR_HOST = this.context.config.firestore.emulatorHost;
                return this.salvarNoFirestore(data);
            case 'firestore':
                return this.salvarNoFirestore(data);
            default:
                throw new Error(`Destino inválido: ${this.context.options.destino}`);
        }
    }
    /**
     * Métodos auxiliares privados
     */
    async determinarLegislatura() {
        if (this.context.options.legislatura) {
            return this.context.options.legislatura;
        }
        const legislaturaAtual = await (0, date_1.obterNumeroLegislaturaAtual)();
        if (!legislaturaAtual) {
            throw new Error('Não foi possível obter a legislatura atual');
        }
        return legislaturaAtual;
    }
    async extrairComposicoes(comissoes) {
        const composicoes = new Map();
        let processados = 0;
        for (const comissao of comissoes) {
            try {
                const codigoComissao = comissao.Codigo || comissao.CodigoComissao;
                const nomeComissao = comissao.Nome || comissao.NomeComissao;
                this.context.logger.debug(`Extraindo composição da comissão ${nomeComissao}`);
                let resultadoComposicao;
                // Determinar se é comissão do Senado ou Mista para chamar o extrator correto
                // Esta lógica pode precisar ser mais robusta baseada nos dados da comissão
                if (comissao.SiglaCasa === 'SF' || nomeComissao.toLowerCase().includes('senado')) {
                    resultadoComposicao = await comissoes_1.comissaoExtractor.extractComposicaoSenado(codigoComissao);
                }
                else if (comissao.SiglaCasa === 'CN' || nomeComissao.toLowerCase().includes('mista') || nomeComissao.toLowerCase().includes('congresso')) {
                    resultadoComposicao = await comissoes_1.comissaoExtractor.extractComposicaoMista(codigoComissao);
                }
                else {
                    this.context.logger.warn(`Não foi possível determinar o tipo da comissão ${codigoComissao} para extrair composição.`);
                }
                if (resultadoComposicao && resultadoComposicao.composicao && resultadoComposicao.composicao.Membros && resultadoComposicao.composicao.Membros.Membro) {
                    const membros = Array.isArray(resultadoComposicao.composicao.Membros.Membro)
                        ? resultadoComposicao.composicao.Membros.Membro
                        : [resultadoComposicao.composicao.Membros.Membro];
                    composicoes.set(codigoComissao, membros);
                }
                processados++;
                // Emitir progresso
                const progresso = Math.round((processados / comissoes.length) * 40); // 40% da barra para composições
                this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 50 + progresso, `Extraídas composições de ${processados}/${comissoes.length} comissões`);
                // Pausa entre requisições
                if (processados < comissoes.length) {
                    await new Promise(resolve => setTimeout(resolve, this.context.config.senado.pauseBetweenRequests));
                }
            }
            catch (error) {
                this.context.logger.warn(`Erro ao extrair composição da comissão: ${error.message}`);
                this.incrementWarnings();
            }
        }
        return composicoes;
    }
    async salvarNoPC(data) {
        this.context.logger.info('💾 Salvando comissões no PC local...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseDir = `comissoes/legislatura_${data.legislatura}`;
        const detalhes = [];
        try {
            // Salvar lista de comissões
            const comissoesPath = `${baseDir}/comissoes_${timestamp}.json`;
            (0, common_1.exportToJson)(data.comissoesTransformadas, comissoesPath);
            detalhes.push({ id: 'comissoes', status: 'sucesso' });
            // Salvar estatísticas
            const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.estatisticas, statsPath);
            detalhes.push({ id: 'estatisticas', status: 'sucesso' });
            // Salvar composições por comissão
            const composicoesDir = `${baseDir}/composicoes`;
            data.composicoesTransformadas.forEach((membros, comissaoId) => {
                try {
                    const membrosPath = `${composicoesDir}/comissao_${comissaoId}_${timestamp}.json`;
                    (0, common_1.exportToJson)(membros, membrosPath);
                    detalhes.push({ id: `composicao_${comissaoId}`, status: 'sucesso' });
                }
                catch (error) {
                    detalhes.push({
                        id: `composicao_${comissaoId}`,
                        status: 'falha',
                        erro: error.message
                    });
                }
            });
            const sucessos = detalhes.filter(d => d.status === 'sucesso').length;
            const falhas = detalhes.filter(d => d.status === 'falha').length;
            this.updateLoadStats(detalhes.length, sucessos, falhas);
            return {
                total: detalhes.length,
                processados: detalhes.length,
                sucessos,
                falhas,
                detalhes
            };
        }
        catch (error) {
            this.context.logger.error(`Erro ao salvar no PC: ${error.message}`);
            throw error;
        }
    }
    async salvarNoFirestore(data) {
        this.context.logger.info('☁️ Salvando comissões no Firestore...');
        try {
            // Transformar de volta para o formato esperado pelo loader
            // A interface ResultadoTransformacao de comissaoLoader.saveComissoes espera 'comissoes: { senado: ..., congresso: ... }'
            // e 'indices', 'referencias'.
            // Preciso reconstruir essa estrutura a partir de data.comissoesTransformadas (que é um array plano agora)
            const comissoesSenado = {};
            const comissoesCongresso = {};
            const porCodigo = {};
            const porParlamentar = {};
            data.comissoesTransformadas.forEach((comissao) => {
                const tipo = (typeof comissao.tipo === 'string' ? comissao.tipo : comissao.tipo?.nome) || 'Outros';
                if (comissao.casa === 'SF') {
                    if (!comissoesSenado[tipo])
                        comissoesSenado[tipo] = [];
                    comissoesSenado[tipo].push(comissao);
                }
                else if (comissao.casa === 'CN') {
                    if (!comissoesCongresso[tipo])
                        comissoesCongresso[tipo] = [];
                    comissoesCongresso[tipo].push(comissao);
                }
                porCodigo[comissao.codigo] = { tipo, casa: comissao.casa, sigla: comissao.sigla, nome: comissao.nome };
                comissao.composicao?.membros?.forEach((membro) => {
                    if (!porParlamentar[membro.codigo])
                        porParlamentar[membro.codigo] = { nome: membro.nome, comissoes: [] };
                    porParlamentar[membro.codigo].comissoes.push({ codigo: comissao.codigo, sigla: comissao.sigla, nome: comissao.nome, casa: comissao.casa, tipo, cargo: membro.cargo });
                });
            });
            const dadosParaCarregamento = {
                timestamp: new Date().toISOString(),
                total: data.estatisticas.totalComissoes,
                comissoes: {
                    senado: comissoesSenado,
                    congresso: comissoesCongresso,
                },
                indices: {
                    porCodigo,
                    porParlamentar,
                },
                referencias: {
                    tipos: data.tiposTransformados.reduce((acc, tipo) => {
                        if (tipo && tipo.codigo)
                            acc[tipo.codigo] = tipo;
                        return acc;
                    }, {}),
                },
            };
            // Salvar comissões
            const resultadoComissoes = await comissoes_3.comissaoLoader.saveComissoes(dadosParaCarregamento, data.legislatura);
            // Salvar histórico
            await comissoes_3.comissaoLoader.saveComissoesHistorico(dadosParaCarregamento, data.legislatura);
            this.updateLoadStats(resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados, resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados, resultadoComissoes.totalErros);
            return {
                total: resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados + resultadoComissoes.totalErros,
                processados: resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados + resultadoComissoes.totalErros,
                sucessos: resultadoComissoes.totalSalvos + resultadoComissoes.totalAtualizados,
                falhas: resultadoComissoes.totalErros,
                detalhes: [
                    { id: 'comissoes_salvas', status: 'sucesso' },
                    { id: 'comissoes_atualizadas', status: 'sucesso' },
                    ...(resultadoComissoes.totalErros > 0 ? [{ id: 'erros_carregamento', status: 'falha' }] : [])
                ]
            };
        }
        catch (error) {
            this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
            throw error;
        }
    }
}
exports.ComissoesProcessor = ComissoesProcessor;
//# sourceMappingURL=comissoes.processor.js.map