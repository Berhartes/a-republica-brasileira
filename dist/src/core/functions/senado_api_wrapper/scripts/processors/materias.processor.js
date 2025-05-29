"use strict";
/**
 * Processador especializado para matérias legislativas
 *
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de matérias legislativas de senadores.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MateriasProcessor = void 0;
const etl_processor_1 = require("../core/etl-processor");
const etl_types_1 = require("../types/etl.types");
const perfilsenadores_1 = require("../extracao/perfilsenadores");
const materias_1 = require("../extracao/materias");
const materias_2 = require("../transformacao/materias");
const materias_3 = require("../carregamento/materias");
const date_1 = require("../utils/date");
const common_1 = require("../utils/common");
/**
 * Processador de matérias legislativas
 */
class MateriasProcessor extends etl_processor_1.ETLProcessor {
    getProcessName() {
        return 'Processador de Matérias Legislativas';
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
        // Validar senador específico se fornecido
        if (this.context.options.senador && !/^\d+$/.test(this.context.options.senador)) {
            erros.push('Código do senador deve conter apenas números');
        }
        // Avisar sobre possíveis limitações
        if (!this.context.options.limite && !this.context.options.senador) {
            avisos.push('Processando matérias de todos os senadores pode demorar muito. Considere usar --limite ou --senador');
        }
        return {
            valido: erros.length === 0,
            erros,
            avisos
        };
    }
    async extract() {
        const legislatura = await this.determinarLegislatura();
        this.context.logger.info(`📅 Extraindo matérias legislativas da legislatura ${legislatura}`);
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 10, 'Extraindo lista de senadores...');
        // 1. Extrair lista de senadores da legislatura
        const senadoresExtraidos = await perfilsenadores_1.perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura);
        if (!senadoresExtraidos.senadores || senadoresExtraidos.senadores.length === 0) {
            throw new Error(`Nenhum senador encontrado para a legislatura ${legislatura}`);
        }
        // 2. Filtrar senadores de acordo com os parâmetros
        let codigosSenadores = senadoresExtraidos.senadores
            .map(s => s.IdentificacaoParlamentar?.CodigoParlamentar)
            .filter(Boolean);
        this.context.logger.info(`🔍 ${codigosSenadores.length} códigos de senadores válidos encontrados`);
        // Filtrar por senador específico se fornecido
        if (this.context.options.senador) {
            this.context.logger.info(`🎯 Filtrando apenas o senador com código ${this.context.options.senador}`);
            codigosSenadores = codigosSenadores.filter(codigo => codigo === this.context.options.senador);
        }
        // Aplicar limite se fornecido
        if (this.context.options.limite && this.context.options.limite > 0 && this.context.options.limite < codigosSenadores.length) {
            this.context.logger.info(`📊 Limitando processamento aos primeiros ${this.context.options.limite} senadores`);
            codigosSenadores = codigosSenadores.slice(0, this.context.options.limite);
        }
        this.context.logger.info(`🚀 Processando matérias legislativas de ${codigosSenadores.length} senadores`);
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 30, 'Extraindo matérias legislativas...');
        // 3. Extrair matérias legislativas para cada senador
        const materiasExtraidas = await this.extrairMateriasSeadores(codigosSenadores, legislatura);
        this.updateExtractionStats(senadoresExtraidos.senadores.length, materiasExtraidas.length, 0);
        return {
            senadores: senadoresExtraidos.senadores,
            materias: materiasExtraidas,
            legislatura
        };
    }
    async transform(data) {
        this.context.logger.info('🔄 Transformando matérias legislativas...');
        this.emitProgress(etl_types_1.ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados das matérias...');
        // Transformar matérias
        const materiasTransformadas = await materias_2.materiasTransformer.transformMultiplasMaterias(data.materias);
        // Calcular estatísticas
        const estatisticas = {
            totalSenadores: data.senadores.length,
            totalMaterias: materiasTransformadas.length,
            totalAutorias: 0,
            totalRelatorias: 0,
            materiasPorTipo: {}
        };
        // Contar estatísticas detalhadas
        materiasTransformadas.forEach(materia => {
            const todasAutorias = [
                ...(materia.autoriasIndividuais || []),
                ...(materia.coautorias || []),
                ...(materia.autoriasColetivas || [])
            ];
            // Contar autorias
            if (todasAutorias.length > 0) {
                estatisticas.totalAutorias += todasAutorias.length;
                // Contar por tipo
                todasAutorias.forEach((autoria) => {
                    const tipo = autoria.tipo || 'Outros';
                    estatisticas.materiasPorTipo[tipo] = (estatisticas.materiasPorTipo[tipo] || 0) + 1;
                });
            }
            // Contar relatorias
            if (materia.relatorias?.length) {
                estatisticas.totalRelatorias += materia.relatorias.length;
            }
        });
        this.updateTransformationStats(data.materias.length, materiasTransformadas.length, 0);
        this.context.logger.info(`✓ ${materiasTransformadas.length} senadores com matérias transformados`);
        this.context.logger.info(`📊 Estatísticas:`, estatisticas);
        return {
            materiasTransformadas,
            estatisticas,
            legislatura: data.legislatura
        };
    }
    async load(data) {
        this.emitProgress(etl_types_1.ProcessingStatus.CARREGANDO, 80, 'Salvando matérias legislativas...');
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
    async extrairMateriasSeadores(codigosSenadores, legislatura) {
        const materiasExtraidas = [];
        let sucessos = 0;
        let falhas = 0;
        for (const [index, codigoSenador] of codigosSenadores.entries()) {
            this.context.logger.info(`👤 Processando senador ${index + 1}/${codigosSenadores.length}: código ${codigoSenador}`);
            try {
                // Extrair dados básicos e mandatos do senador
                const perfilBasico = await perfilsenadores_1.perfilSenadoresExtractor.extractDadosBasicos(codigoSenador);
                const mandatosSenador = await perfilsenadores_1.perfilSenadoresExtractor.extractMandatos(codigoSenador);
                if (!mandatosSenador || !mandatosSenador.dados) {
                    this.context.logger.warn(`⚠️ Não foi possível obter mandatos para o senador ${codigoSenador}. Usando método padrão.`);
                    this.incrementWarnings();
                    // Usar método padrão se não conseguir obter mandatos
                    const materiaSenador = await materias_1.materiasExtractor.extractMaterias(codigoSenador);
                    materiasExtraidas.push(materiaSenador);
                    continue;
                }
                // Extrair matérias por períodos de mandato
                this.context.logger.debug(`📋 Extraindo matérias por períodos de mandato para o senador ${codigoSenador}`);
                // Obter array de mandatos
                const mandatosObj = mandatosSenador.dados;
                const mandatosArray = Array.isArray(mandatosObj.Mandato) ? mandatosObj.Mandato : [mandatosObj.Mandato];
                // Arrays para armazenar resultados por período
                let autoriasPorPeriodo = [];
                let relatoriasPorPeriodo = [];
                // Processar cada mandato
                for (const [idxMandato, mandato] of mandatosArray.entries()) {
                    // Extrair datas de início e fim do mandato
                    let dataInicio = mandato?.DataInicio;
                    let dataFim = mandato?.DataFim;
                    // Se não encontrar datas, tentar obter do arquivo XML
                    if (!dataInicio) {
                        const periodoLegislatura = await (0, date_1.obterPeriodoLegislatura)(legislatura);
                        if (periodoLegislatura) {
                            dataInicio = periodoLegislatura.DataInicio;
                            dataFim = periodoLegislatura.DataFim;
                            this.context.logger.debug(`📅 Período da legislatura ${legislatura} extraído do XML: ${dataInicio} a ${dataFim}`);
                        }
                        else {
                            const hoje = new Date();
                            const quatroAnosAtras = new Date();
                            quatroAnosAtras.setFullYear(hoje.getFullYear() - 4);
                            dataInicio = quatroAnosAtras.toISOString().slice(0, 10);
                            dataFim = hoje.toISOString().slice(0, 10);
                            this.context.logger.warn(`⚠️ Usando período padrão de 4 anos: ${dataInicio} a ${dataFim}`);
                            this.incrementWarnings();
                        }
                    }
                    this.context.logger.debug(`📅 Processando mandato ${idxMandato + 1}/${mandatosArray.length}: ${dataInicio} a ${dataFim}`);
                    // Extrair autorias por período de mandato
                    const autoriasMandato = await materias_1.materiasExtractor.extractAutoriasPorPeriodoMandato(codigoSenador, dataInicio, dataFim);
                    // Adicionar resultados ao array
                    autoriasPorPeriodo = [...autoriasPorPeriodo, ...autoriasMandato];
                    // Extrair relatorias por período de mandato
                    const relatoriasMandato = await materias_1.materiasExtractor.extractRelatoriasPorPeriodoMandato(codigoSenador, dataInicio, dataFim);
                    // Adicionar resultados ao array
                    relatoriasPorPeriodo = [...relatoriasPorPeriodo, ...relatoriasMandato];
                }
                // Consolidar resultados
                this.context.logger.debug(`🔄 Consolidando resultados de matérias para o senador ${codigoSenador}`);
                // Consolidar autorias
                const autoriasConsolidadas = autoriasPorPeriodo.length > 0
                    ? materias_1.materiasExtractor.consolidarResultadosAutorias(autoriasPorPeriodo)
                    : null;
                // Consolidar relatorias
                const relatoriasConsolidadas = relatoriasPorPeriodo.length > 0
                    ? materias_1.materiasExtractor.consolidarResultadosRelatorias(relatoriasPorPeriodo)
                    : null;
                // Verificar se encontrou alguma matéria
                if (autoriasConsolidadas || relatoriasConsolidadas) {
                    // Criar objeto consolidado
                    const materiaConsolidada = {
                        timestamp: new Date().toISOString(),
                        codigo: codigoSenador,
                        dadosBasicos: perfilBasico,
                        autorias: autoriasConsolidadas ? {
                            timestamp: new Date().toISOString(),
                            origem: `Consolidação de ${autoriasPorPeriodo.length} períodos`,
                            dados: autoriasConsolidadas,
                            metadados: {}
                        } : undefined,
                        relatorias: relatoriasConsolidadas ? {
                            timestamp: new Date().toISOString(),
                            origem: `Consolidação de ${relatoriasPorPeriodo.length} períodos`,
                            dados: relatoriasConsolidadas,
                            metadados: {}
                        } : undefined
                    };
                    materiasExtraidas.push(materiaConsolidada);
                    sucessos++;
                }
                else {
                    this.context.logger.warn(`⚠️ Nenhuma matéria encontrada para o senador ${codigoSenador}. Usando método padrão.`);
                    this.incrementWarnings();
                    // Usar método padrão se não encontrar matérias nos períodos
                    const materiaSenador = await materias_1.materiasExtractor.extractMaterias(codigoSenador);
                    materiasExtraidas.push(materiaSenador);
                }
            }
            catch (error) {
                this.context.logger.error(`❌ Erro ao processar matérias do senador ${codigoSenador}: ${error.message}`);
                falhas++;
                this.incrementErrors();
                // Adicionar objeto de erro para manter consistência
                materiasExtraidas.push({
                    timestamp: new Date().toISOString(),
                    codigo: codigoSenador,
                    dadosBasicos: {
                        timestamp: new Date().toISOString(),
                        origem: `Processamento de matérias do senador ${codigoSenador}`,
                        dados: null,
                        metadados: {},
                        erro: error.message
                    },
                    erro: error.message
                });
            }
            // Emitir progresso
            const progresso = Math.round((index + 1) / codigosSenadores.length * 50); // 50% da barra para extração
            this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 30 + progresso, `Processados ${index + 1}/${codigosSenadores.length} senadores`);
            // Pausa entre senadores para não sobrecarregar a API
            if (index < codigosSenadores.length - 1) {
                this.context.logger.debug(`⏱️ Aguardando 3 segundos antes de processar o próximo senador...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        this.context.logger.info(`✅ Extração concluída: ${sucessos} sucessos, ${falhas} falhas`);
        return materiasExtraidas;
    }
    async salvarNoPC(data) {
        this.context.logger.info('💾 Salvando matérias legislativas no PC local...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseDir = `materias/legislatura_${data.legislatura}`;
        const detalhes = [];
        try {
            // Salvar todas as matérias
            const materiasPath = `${baseDir}/materias_completas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.materiasTransformadas, materiasPath);
            detalhes.push({ id: 'materias_completas', status: 'sucesso' });
            // Salvar estatísticas
            const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.estatisticas, statsPath);
            detalhes.push({ id: 'estatisticas', status: 'sucesso' });
            // Salvar por tipo de matéria
            const tiposDir = `${baseDir}/tipos`;
            Object.entries(data.estatisticas.materiasPorTipo).forEach(([tipo, quantidade]) => {
                try {
                    const materiasDoTipo = data.materiasTransformadas.filter(m => {
                        const todasAutorias = [
                            ...(m.autoriasIndividuais || []),
                            ...(m.coautorias || []),
                            ...(m.autoriasColetivas || [])
                        ];
                        return todasAutorias.some((a) => a.tipo === tipo); // Adicionar tipo para a
                    });
                    const tipoPath = `${tiposDir}/${tipo}_${timestamp}.json`;
                    (0, common_1.exportToJson)(materiasDoTipo, tipoPath);
                    detalhes.push({ id: `tipo_${tipo}`, status: 'sucesso' });
                }
                catch (error) {
                    detalhes.push({
                        id: `tipo_${tipo}`,
                        status: 'falha',
                        erro: error.message
                    });
                }
            });
            // Salvar por senador se específico
            if (this.context.options.senador) {
                const senadorDir = `${baseDir}/senador_${this.context.options.senador}`;
                const senadorPath = `${senadorDir}/materias_${timestamp}.json`;
                (0, common_1.exportToJson)(data.materiasTransformadas, senadorPath);
                detalhes.push({ id: `senador_${this.context.options.senador}`, status: 'sucesso' });
            }
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
        this.context.logger.info('☁️ Salvando matérias legislativas no Firestore...');
        try {
            // Salvar matérias
            const resultado = await materias_3.materiasLoader.saveMultiplasMaterias(data.materiasTransformadas, data.legislatura);
            this.updateLoadStats(resultado.sucessos + resultado.falhas, resultado.sucessos, resultado.falhas);
            return {
                total: resultado.sucessos + resultado.falhas,
                processados: resultado.sucessos + resultado.falhas,
                sucessos: resultado.sucessos,
                falhas: resultado.falhas,
                detalhes: [
                    { id: 'materias', status: 'sucesso' }, // Removido 'quantidade'
                    ...(resultado.falhas > 0 ? [{ id: 'falhas', status: 'falha' }] : []) // Removido 'quantidade'
                ]
            };
        }
        catch (error) {
            this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
            throw error;
        }
    }
}
exports.MateriasProcessor = MateriasProcessor;
//# sourceMappingURL=materias.processor.js.map