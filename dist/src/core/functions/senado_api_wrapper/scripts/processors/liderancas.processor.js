"use strict";
/**
 * Processador especializado para lideranças parlamentares
 *
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de lideranças parlamentares.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiderancasProcessor = void 0;
const etl_processor_1 = require("../core/etl-processor");
const etl_types_1 = require("../types/etl.types");
const liderancas_1 = require("../extracao/liderancas");
const liderancas_2 = require("../transformacao/liderancas");
const liderancas_3 = require("../carregamento/liderancas");
const date_1 = require("../utils/date");
const common_1 = require("../utils/common");
/**
 * Processador de lideranças parlamentares
 */
class LiderancasProcessor extends etl_processor_1.ETLProcessor {
    getProcessName() {
        return 'Processador de Lideranças Parlamentares';
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
            avisos.push('Processando todas as lideranças pode demorar. Considere usar --limite para testes');
        }
        return {
            valido: erros.length === 0,
            erros,
            avisos
        };
    }
    async extract() {
        const legislatura = await this.determinarLegislatura();
        this.context.logger.info(`📅 Extraindo lideranças da legislatura ${legislatura}`);
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 10, 'Extraindo dados de lideranças...');
        // Extrair todos os dados de lideranças
        const dadosExtraidos = await liderancas_1.liderancaExtractor.extractAll();
        if (!dadosExtraidos.liderancas) {
            throw new Error('Nenhuma liderança encontrada');
        }
        // Verificar dados extraídos
        this.context.logger.debug('Dados de lideranças extraídos:', JSON.stringify(dadosExtraidos.liderancas).substring(0, 200) + '...');
        this.context.logger.debug('Tipos de liderança:', JSON.stringify(dadosExtraidos.referencias.tiposLideranca).substring(0, 200) + '...');
        const totalLiderancas = Array.isArray(dadosExtraidos.liderancas) ?
            dadosExtraidos.liderancas.length :
            (dadosExtraidos.liderancas.itens?.length || 0);
        this.context.logger.info(`✓ ${totalLiderancas} lideranças encontradas`);
        this.updateExtractionStats(totalLiderancas, totalLiderancas, 0);
        return {
            timestamp: new Date().toISOString(), // Adicionado
            liderancas: dadosExtraidos.liderancas,
            referencias: dadosExtraidos.referencias,
            legislatura
        };
    }
    async transform(data) {
        this.context.logger.info('🔄 Transformando lideranças...');
        this.emitProgress(etl_types_1.ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados de lideranças...');
        // Transformar lideranças
        const dadosTransformados = liderancas_2.liderancaTransformer.transformLiderancas(data);
        // Calcular estatísticas
        const liderancas = dadosTransformados.liderancas.itens || [];
        const totalMembros = liderancas.reduce((total, lideranca) => total + (lideranca.membros?.length || 0), 0);
        const estatisticas = {
            totalLiderancas: liderancas.length,
            totalMembros,
            liderancasPorTipo: {}
        };
        // Contar lideranças por tipo
        liderancas.forEach((lideranca) => {
            const tipo = lideranca.tipo || 'Outros';
            estatisticas.liderancasPorTipo[tipo] = (estatisticas.liderancasPorTipo[tipo] || 0) + 1;
        });
        this.updateTransformationStats(liderancas.length, dadosTransformados.liderancas.itens.length, 0);
        this.context.logger.info(`✓ ${dadosTransformados.liderancas.itens.length} lideranças transformadas`);
        this.context.logger.info(`✓ ${totalMembros} membros transformados`);
        return {
            liderancasTransformadas: dadosTransformados.liderancas,
            referenciasTransformadas: dadosTransformados.referencias,
            estatisticas,
            legislatura: data.legislatura
        };
    }
    async load(data) {
        this.emitProgress(etl_types_1.ProcessingStatus.CARREGANDO, 80, 'Salvando lideranças...');
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
    async salvarNoPC(data) {
        this.context.logger.info('💾 Salvando lideranças no PC local...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseDir = `liderancas/legislatura_${data.legislatura}`;
        const detalhes = [];
        try {
            // Salvar lideranças
            const liderancasPath = `${baseDir}/liderancas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.liderancasTransformadas, liderancasPath);
            detalhes.push({ id: 'liderancas', status: 'sucesso' });
            // Salvar referências
            const referenciasPath = `${baseDir}/referencias_${timestamp}.json`;
            (0, common_1.exportToJson)(data.referenciasTransformadas, referenciasPath);
            detalhes.push({ id: 'referencias', status: 'sucesso' });
            // Salvar estatísticas
            const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.estatisticas, statsPath);
            detalhes.push({ id: 'estatisticas', status: 'sucesso' });
            // Salvar por tipo de liderança
            const tiposDir = `${baseDir}/tipos`;
            data.liderancasTransformadas.itens?.forEach((lideranca, index) => {
                try {
                    const tipo = lideranca.tipo || 'outros';
                    const tipoPath = `${tiposDir}/${tipo}_${index}_${timestamp}.json`;
                    (0, common_1.exportToJson)(lideranca, tipoPath);
                    detalhes.push({ id: `tipo_${tipo}_${index}`, status: 'sucesso' });
                }
                catch (error) {
                    detalhes.push({
                        id: `tipo_${index}`,
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
        this.context.logger.info('☁️ Salvando lideranças no Firestore...');
        try {
            // Reconstituir dados no formato esperado pelo loader
            const dadosParaCarregamento = {
                liderancas: data.liderancasTransformadas,
                referencias: data.referenciasTransformadas,
                timestamp: new Date().toISOString()
            };
            // Salvar lideranças
            const resultadoLiderancas = await liderancas_3.liderancaLoader.saveLiderancas(dadosParaCarregamento, data.legislatura);
            // Salvar histórico
            await liderancas_3.liderancaLoader.saveLiderancasHistorico(dadosParaCarregamento, data.legislatura);
            this.updateLoadStats(resultadoLiderancas.totalLiderancas, resultadoLiderancas.totalLiderancas, 0);
            return {
                total: resultadoLiderancas.totalLiderancas,
                processados: resultadoLiderancas.totalLiderancas,
                sucessos: resultadoLiderancas.totalLiderancas,
                falhas: 0,
                detalhes: [
                    { id: 'liderancas', status: 'sucesso' }, // Removido 'quantidade'
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
exports.LiderancasProcessor = LiderancasProcessor;
//# sourceMappingURL=liderancas.processor.js.map