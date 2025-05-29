"use strict";
/**
 * Processador especializado para mesas diretoras
 *
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de mesas diretoras.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MesasProcessor = void 0;
const etl_processor_1 = require("../core/etl-processor");
const etl_types_1 = require("../types/etl.types");
const mesas_1 = require("../extracao/mesas");
const mesas_2 = require("../transformacao/mesas");
const mesas_3 = require("../carregamento/mesas");
const date_1 = require("../utils/date");
const common_1 = require("../utils/common");
/**
 * Processador de mesas diretoras
 */
class MesasProcessor extends etl_processor_1.ETLProcessor {
    getProcessName() {
        return 'Processador de Mesas Diretoras';
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
            avisos.push('Processando todas as mesas pode demorar. Considere usar --limite para testes');
        }
        return {
            valido: erros.length === 0,
            erros,
            avisos
        };
    }
    async extract() {
        const legislatura = await this.determinarLegislatura();
        this.context.logger.info(`📅 Extraindo mesas diretoras da legislatura ${legislatura}`);
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 10, 'Extraindo dados de mesas diretoras...');
        // Extrair dados das mesas
        const dadosExtraidosCompletos = await mesas_1.mesaExtractor.extractAll();
        if (!dadosExtraidosCompletos || !dadosExtraidosCompletos.mesas) {
            throw new Error('Nenhuma mesa diretora encontrada');
        }
        let mesasParaProcessar = [];
        const mesaSenadoObj = dadosExtraidosCompletos.mesas.senado.dados;
        const mesaCongressoObj = dadosExtraidosCompletos.mesas.congresso.dados;
        if (mesaSenadoObj && typeof mesaSenadoObj === 'object') {
            mesasParaProcessar.push({
                ...mesaSenadoObj,
                id: mesaSenadoObj.Colegiado?.CodigoColegiado || 'mesa_senado_atual',
                NomeMesa: mesaSenadoObj.Colegiado?.NomeColegiado || 'Mesa do Senado Federal',
                tipo: 'senado'
            });
        }
        if (mesaCongressoObj && typeof mesaCongressoObj === 'object') {
            mesasParaProcessar.push({
                ...mesaCongressoObj,
                id: mesaCongressoObj.Colegiado?.CodigoColegiado || 'mesa_congresso_atual',
                NomeMesa: mesaCongressoObj.Colegiado?.NomeColegiado || 'Mesa do Congresso Nacional',
                tipo: 'congresso'
            });
        }
        this.context.logger.info(`✓ ${mesasParaProcessar.length} mesas encontradas (Senado e/ou Congresso)`);
        // Aplicar limite se especificado
        if (this.context.options.limite && this.context.options.limite > 0) {
            mesasParaProcessar = mesasParaProcessar.slice(0, this.context.options.limite);
            this.context.logger.info(`🔍 Limitado a ${mesasParaProcessar.length} mesas`);
        }
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 50, 'Processando composições das mesas...');
        // Processar composições das mesas (os dados já foram extraídos)
        const composicoes = await this.extrairComposicoes(mesasParaProcessar);
        this.updateExtractionStats(mesasParaProcessar.length, mesasParaProcessar.length, 0);
        return {
            mesas: mesasParaProcessar,
            composicoes,
            legislatura
        };
    }
    async transform(data) {
        this.context.logger.info('🔄 Transformando mesas diretoras...');
        this.emitProgress(etl_types_1.ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados das mesas...');
        // Preparar dados para transformação no formato ExtractionResult esperado por mesaTransformer
        // Assumindo que data.mesas contém um array de objetos, onde cada objeto pode ser de 'senado' ou 'congresso'
        // Precisamos separar isso.
        const mesasSenado = data.mesas.filter(m => m.tipo === 'senado' || m.NomeMesa?.toLowerCase().includes('senado'));
        const mesasCongresso = data.mesas.filter(m => m.tipo === 'congresso' || m.NomeMesa?.toLowerCase().includes('congresso'));
        const dadosParaTransformar = {
            timestamp: new Date().toISOString(),
            mesas: {
                senado: {
                    timestamp: new Date().toISOString(),
                    tipo: 'senado',
                    dados: mesasSenado // Passar o array de mesas do senado
                },
                congresso: {
                    timestamp: new Date().toISOString(),
                    tipo: 'congresso',
                    dados: mesasCongresso // Passar o array de mesas do congresso
                }
            }
            // A interface ExtractionResult em transformacao/mesas.ts não espera 'composicoes' diretamente.
            // A lógica de transformação de membros já está embutida em transformMesaSenado/Congresso.
        };
        // Transformar mesas
        const dadosTransformados = mesas_2.mesaTransformer.transformMesas(dadosParaTransformar);
        // As composições já são transformadas dentro de mesaTransformer.transformMesas
        // e incluídas em cada MesaTransformada.
        // A propriedade composicoesTransformadas no TransformedData deste processador pode ser removida.
        const composicoesTransformadas = new Map(); // Manter vazio ou remover
        data.mesas.forEach(mesa => {
            const mesaTransformada = dadosTransformados.mesas.find(mt => mt.codigo === (mesa.Codigo || mesa.CodigoMesa || mesa.id));
            if (mesaTransformada) {
                composicoesTransformadas.set(String(mesaTransformada.codigo), mesaTransformada.membros || []);
            }
        });
        // Calcular estatísticas
        const estatisticas = {
            totalMesas: dadosTransformados.total,
            totalMembros: dadosTransformados.mesas.reduce((total, mesa) => total + (mesa.membros?.length || 0), 0),
            mesasPorPeriodo: {} // Esta propriedade não parece ser preenchida
        };
        // Contar mesas por período (se a propriedade 'periodo' existir em MesaTransformada)
        dadosTransformados.mesas?.forEach((mesa) => {
            // A interface MesaTransformada não tem 'periodo'.
            // Se for necessário, adicionar 'periodo' à interface e à lógica de transformação.
            // Por enquanto, esta parte não fará nada.
            const periodo = mesa.periodo || 'Sem período';
            estatisticas.mesasPorPeriodo[periodo] = (estatisticas.mesasPorPeriodo[periodo] || 0) + 1;
        });
        this.updateTransformationStats(data.mesas.length, dadosTransformados.total, data.mesas.length - dadosTransformados.total);
        this.context.logger.info(`✓ ${dadosTransformados.total} mesas transformadas`);
        this.context.logger.info(`✓ ${estatisticas.totalMembros} membros transformados`);
        return {
            mesasTransformadas: dadosTransformados.mesas || [],
            composicoesTransformadas,
            estatisticas,
            legislatura: data.legislatura
        };
    }
    async load(data) {
        this.emitProgress(etl_types_1.ProcessingStatus.CARREGANDO, 80, 'Salvando mesas diretoras...');
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
    async extrairComposicoes(mesas) {
        const composicoesMap = new Map();
        let processados = 0;
        for (const mesa of mesas) {
            try {
                const codigoMesa = mesa.id || mesa.Codigo || mesa.CodigoMesa;
                const nomeMesa = mesa.NomeMesa || `Mesa ${codigoMesa}`;
                this.context.logger.debug(`Processando composição da ${nomeMesa}`);
                let membros;
                if (mesa.Cargos && mesa.Cargos.Cargo) {
                    membros = Array.isArray(mesa.Cargos.Cargo) ? mesa.Cargos.Cargo : [mesa.Cargos.Cargo];
                }
                else if (mesa.membros && Array.isArray(mesa.membros)) {
                    membros = mesa.membros;
                }
                else if (mesa.Membros && Array.isArray(mesa.Membros)) {
                    membros = mesa.Membros;
                }
                if (membros && membros.length > 0) {
                    composicoesMap.set(String(codigoMesa), membros);
                    this.context.logger.debug(`Composição da ${nomeMesa} encontrada com ${membros.length} membros.`);
                }
                else {
                    this.context.logger.warn(`Nenhuma composição (membros) encontrada diretamente para a ${nomeMesa}. Os dados podem estar incompletos ou a estrutura da API mudou.`);
                }
                processados++;
                const progresso = Math.round((processados / mesas.length) * 40); // 40% da barra para processamento de composições
                this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, // Mantém status EXTRAINDO, pois é parte da coleta de dados
                50 + progresso, // Progresso continua de 50% a 90%
                `Processadas composições de ${processados}/${mesas.length} mesas`);
            }
            catch (error) {
                const codigoMesaError = mesa.id || mesa.Codigo || mesa.CodigoMesa;
                const nomeMesaError = mesa.NomeMesa || `Mesa ${codigoMesaError}`;
                this.context.logger.warn(`Erro ao processar composição da ${nomeMesaError}: ${error.message}`);
                this.incrementWarnings();
            }
        }
        return composicoesMap;
    }
    async salvarNoPC(data) {
        this.context.logger.info('💾 Salvando mesas diretoras no PC local...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseDir = `mesas/legislatura_${data.legislatura}`;
        const detalhes = [];
        try {
            // Salvar lista de mesas
            const mesasPath = `${baseDir}/mesas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.mesasTransformadas, mesasPath);
            detalhes.push({ id: 'mesas', status: 'sucesso' });
            // Salvar estatísticas
            const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.estatisticas, statsPath);
            detalhes.push({ id: 'estatisticas', status: 'sucesso' });
            // Salvar composições por mesa
            const composicoesDir = `${baseDir}/composicoes`;
            data.composicoesTransformadas.forEach((membros, mesaId) => {
                try {
                    const membrosPath = `${composicoesDir}/mesa_${mesaId}_${timestamp}.json`;
                    (0, common_1.exportToJson)(membros, membrosPath);
                    detalhes.push({ id: `composicao_${mesaId}`, status: 'sucesso' });
                }
                catch (error) {
                    detalhes.push({
                        id: `composicao_${mesaId}`,
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
        this.context.logger.info('☁️ Salvando mesas diretoras no Firestore...');
        try {
            // Reconstituir dados no formato esperado pelo loader
            const dadosParaCarregamento = {
                total: data.estatisticas.totalMesas,
                mesas: data.mesasTransformadas,
                timestamp: new Date().toISOString()
            };
            // Salvar mesas
            const resultadoMesas = await mesas_3.mesaLoader.saveMesas(dadosParaCarregamento, data.legislatura);
            // Salvar histórico
            await mesas_3.mesaLoader.saveMesasHistorico(dadosParaCarregamento, data.legislatura);
            this.updateLoadStats(resultadoMesas.totalSalvos, resultadoMesas.totalSalvos, 0);
            return {
                total: resultadoMesas.totalSalvos,
                processados: resultadoMesas.totalSalvos,
                sucessos: resultadoMesas.totalSalvos,
                falhas: 0,
                detalhes: [
                    { id: 'mesas', status: 'sucesso' }, // Removido 'quantidade'
                    { id: 'historico', status: 'sucesso' }
                ]
            };
        }
        catch (error) {
            this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
            throw error;
        }
    }
}
exports.MesasProcessor = MesasProcessor;
//# sourceMappingURL=mesas.processor.js.map