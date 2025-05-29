"use strict";
/**
 * Processador especializado para blocos parlamentares
 *
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de blocos parlamentares.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlocosProcessor = void 0;
const etl_processor_1 = require("../core/etl-processor");
const etl_types_1 = require("../types/etl.types");
const blocos_1 = require("../extracao/blocos");
const blocos_2 = require("../transformacao/blocos");
const blocos_3 = require("../carregamento/blocos");
const date_1 = require("../utils/date");
const common_1 = require("../utils/common");
/**
 * Processador de blocos parlamentares
 */
class BlocosProcessor extends etl_processor_1.ETLProcessor {
    getProcessName() {
        return 'Processador de Blocos Parlamentares';
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
            avisos.push('Processando todos os blocos pode demorar. Considere usar --limite para testes');
        }
        return {
            valido: erros.length === 0,
            erros,
            avisos
        };
    }
    async extract() {
        const legislatura = await this.determinarLegislatura();
        this.context.logger.info(`📅 Extraindo blocos da legislatura ${legislatura}`);
        // Extrair lista de blocos
        this.context.logger.info('📋 Extraindo lista de blocos parlamentares...');
        const resultadoBlocos = await blocos_1.blocoExtractor.extractBlocosLegislatura(legislatura);
        let blocos = resultadoBlocos.blocos || [];
        if (blocos.length === 0) {
            throw new Error(`Nenhum bloco encontrado para a legislatura ${legislatura}`);
        }
        this.context.logger.info(`✓ ${blocos.length} blocos encontrados`);
        // Aplicar limite se especificado
        if (this.context.options.limite && this.context.options.limite > 0) {
            blocos = blocos.slice(0, this.context.options.limite);
            this.context.logger.info(`🔍 Limitado a ${blocos.length} blocos`);
        }
        // Extrair membros de cada bloco
        this.context.logger.info('👥 Extraindo membros dos blocos...');
        const membros = await this.extrairMembros(blocos);
        this.updateExtractionStats(blocos.length, blocos.length, 0);
        return {
            blocos,
            membros,
            legislatura
        };
    }
    async transform(data) {
        this.context.logger.info('🔄 Transformando blocos e membros...');
        const blocosTransformados = [];
        const membrosTransformados = new Map();
        const estatisticas = {
            totalBlocos: 0,
            totalMembros: 0,
            blocosPorTipo: {}
        };
        // Transformar blocos
        for (const bloco of data.blocos) {
            try {
                const transformado = blocos_2.blocoTransformer.transformBloco(bloco);
                if (transformado) {
                    blocosTransformados.push(transformado);
                    // Atualizar estatísticas
                    estatisticas.totalBlocos++;
                    // const tipo = transformado.tipo || 'Outros'; // 'tipo' não existe em BlocoTransformado
                    // estatisticas.blocosPorTipo[tipo] = (estatisticas.blocosPorTipo[tipo] || 0) + 1; // Removido
                    // Transformar membros do bloco
                    const membrosBloco = data.membros.get(bloco.CodigoBloco);
                    if (membrosBloco) {
                        const membrosTransf = membrosBloco.map(m => blocos_2.blocoTransformer.transformMembroBloco(m, bloco.CodigoBloco)).filter(Boolean);
                        membrosTransformados.set(bloco.CodigoBloco, membrosTransf);
                        estatisticas.totalMembros += membrosTransf.length;
                    }
                }
            }
            catch (error) {
                this.context.logger.warn(`Erro ao transformar bloco ${bloco.CodigoBloco}: ${error.message}`);
                this.incrementErrors();
            }
        }
        this.updateTransformationStats(data.blocos.length, blocosTransformados.length, data.blocos.length - blocosTransformados.length);
        this.context.logger.info(`✓ ${blocosTransformados.length} blocos transformados`);
        this.context.logger.info(`✓ ${estatisticas.totalMembros} membros transformados`);
        this.context.logger.info(`📊 Estatísticas:`, estatisticas);
        return {
            blocosTransformados,
            membrosTransformados,
            estatisticas,
            legislatura: data.legislatura
        };
    }
    async load(data) {
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
    async extrairMembros(blocos) {
        const membros = new Map();
        let processados = 0;
        for (const bloco of blocos) {
            try {
                this.context.logger.debug(`Extraindo membros do bloco ${bloco.NomeBloco}`);
                const resultadoMembros = await blocos_1.blocoExtractor.extractMembrosBloco(bloco.CodigoBloco, this.context.options.legislatura || 57);
                if (resultadoMembros.membros && resultadoMembros.membros.length > 0) {
                    membros.set(bloco.CodigoBloco, resultadoMembros.membros);
                }
                processados++;
                // Emitir progresso
                const progresso = Math.round((processados / blocos.length) * 100);
                this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 25 + Math.round(progresso * 0.25), `Extraídos membros de ${processados}/${blocos.length} blocos`);
                // Pausa entre requisições
                if (processados < blocos.length) {
                    await new Promise(resolve => setTimeout(resolve, this.context.config.senado.pauseBetweenRequests));
                }
            }
            catch (error) {
                this.context.logger.warn(`Erro ao extrair membros do bloco ${bloco.CodigoBloco}: ${error.message}`);
                this.incrementWarnings();
            }
        }
        return membros;
    }
    async salvarNoPC(data) {
        this.context.logger.info('💾 Salvando blocos no PC local...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseDir = `blocos/legislatura_${data.legislatura}`;
        const detalhes = [];
        try {
            // Salvar lista de blocos
            const blocosPath = `${baseDir}/blocos_${timestamp}.json`;
            (0, common_1.exportToJson)(data.blocosTransformados, blocosPath);
            detalhes.push({ id: 'blocos', status: 'sucesso' });
            // Salvar estatísticas
            const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.estatisticas, statsPath);
            detalhes.push({ id: 'estatisticas', status: 'sucesso' });
            // Salvar membros por bloco
            const membrosDir = `${baseDir}/membros`;
            data.membrosTransformados.forEach((membros, blocoId) => {
                try {
                    const membrosPath = `${membrosDir}/bloco_${blocoId}_${timestamp}.json`;
                    (0, common_1.exportToJson)(membros, membrosPath);
                    detalhes.push({ id: `membros_${blocoId}`, status: 'sucesso' });
                }
                catch (error) {
                    detalhes.push({
                        id: `membros_${blocoId}`,
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
        this.context.logger.info('☁️ Salvando blocos no Firestore...');
        try {
            // Salvar blocos
            const resultadoBlocos = await blocos_3.blocoLoader.saveMultiplosBlocos(data.blocosTransformados, data.legislatura);
            // Salvar membros
            let totalMembros = 0;
            let sucessosMembros = 0;
            let falhasMembros = 0;
            for (const [blocoId, membros] of data.membrosTransformados) {
                try {
                    const resultado = await blocos_3.blocoLoader.saveMembrosBloco(membros, blocoId, data.legislatura);
                    totalMembros += resultado.total;
                    sucessosMembros += resultado.sucessos;
                    falhasMembros += resultado.falhas;
                }
                catch (error) {
                    this.context.logger.warn(`Erro ao salvar membros do bloco ${blocoId}: ${error.message}`);
                    falhasMembros += membros.length;
                }
            }
            const totalSucessos = resultadoBlocos.sucessos + sucessosMembros;
            const totalFalhas = resultadoBlocos.falhas + falhasMembros;
            this.updateLoadStats(resultadoBlocos.total + totalMembros, totalSucessos, totalFalhas);
            return {
                total: resultadoBlocos.total + totalMembros,
                processados: resultadoBlocos.processados + totalMembros,
                sucessos: totalSucessos,
                falhas: totalFalhas,
                detalhes: [
                    { id: 'blocos', status: 'sucesso' }, // Removido 'quantidade'
                    { id: 'membros', status: 'sucesso' } // Removido 'quantidade'
                ]
            };
        }
        catch (error) {
            this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
            throw error;
        }
    }
}
exports.BlocosProcessor = BlocosProcessor;
//# sourceMappingURL=blocos.processor.js.map